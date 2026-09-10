const mongoose        = require("mongoose");
const axios           = require("axios");
const Survey          = require("../models/Survey.model");
const SurveyResponse  = require("../models/SurveyResponse.model");

const userSvc = require("../services/user.service");

const BADGE_SERVICE_URL    = process.env.BADGE_SERVICE_URL;
const PRACTICE_SERVICE_URL = process.env.PRACTICE_SERVICE_URL;

// ═══════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════

function token(req) {
  return (req.headers.authorization || "").replace("Bearer ", "");
}

/**
 * Résout l'utilisateur courant (profil léger) via /api/users/me.
 * Remplace l'ancien uid(req) qui lisait directement l'ID dans le JWT —
 * le token Keycloak ne contient que keycloakId, pas l'ID interne.
 */
async function resolveCurrentUser(req) {
  const tk = token(req);
  const user = await userSvc.getCurrentUserProfile(tk);
  return { user, tk };
}

/**
 * Applique la gamification après une réponse à un sondage.
 */
async function applyGamification(user, survey, tk) {
  const updated = await userSvc.incrementGamification(
    user._id,
    { pointsDelta: survey.pointsReward, surveysDelta: 1 },
    tk
  );

  const newCount  = updated?.surveysAnswered ?? (user.gamification?.surveysAnswered || 0) + 1;
  const newPoints = updated?.points          ?? (user.gamification?.points          || 0) + survey.pointsReward;

  const practiceId = user.practice_id?.length ? user.practice_id[0] : null;

  let newBadges = [];
  let nextBadge = null;

  try {
    const { data } = await axios.post(
      `${BADGE_SERVICE_URL}/api/badges/evaluate`,
      { userId: user._id, practiceId, newCount, newPoints },
      { headers: { Authorization: `Bearer ${tk}` }, timeout: 8000 }
    );
    newBadges = data.newBadges || [];
    nextBadge = data.nextBadge || null;
  } catch (err) {
    console.error("[survey-service] Erreur appel badge-service:", err.message);
  }

  return {
    pointsEarned:    survey.pointsReward,
    totalPoints:     newPoints,
    surveysAnswered: newCount,
    newBadges,
    nextBadge,
  };
}

/**
 * Construit le filtre Mongo des sondages visibles par un user donné.
 * practice_id et practices sont maintenant tous deux des UUID string —
 * plus besoin de cast ObjectId pour matcher.
 */
async function buildUserFilter(userId, tk) {
  const user = await userSvc.getUserSnapshot(userId, tk);
  if (!user) return null;

  const filter = {
    status: "ACTIVE",
    target: { $in: ["ALL", "COLLABORATOR"] },
  };

  if (user.practice_id?.length > 0) {
    filter.$or = [
      { practices: { $size: 0 } },
      { practices: { $in: user.practice_id } },
    ];
  } else {
    filter.practices = { $size: 0 };
  }

  const answeredIds = await SurveyResponse.find({ user: userId }).distinct("survey");
  if (answeredIds.length > 0) filter._id = { $nin: answeredIds };

  return { filter, user };
}

function applySpecificUserFilter(surveys, userId) {
  return surveys.filter((s) => {
    if (!s.specificUserIds || s.specificUserIds.length === 0) return true;
    return s.specificUserIds.some((id) => id.toString() === userId.toString());
  });
}

/**
 * Résout practices[] et specificUserIds[] d'un survey en objets légers.
 */
async function resolveSurveyRefs(surveyDoc, tk) {
  const obj = surveyDoc.toObject ? surveyDoc.toObject() : { ...surveyDoc };

  if (Array.isArray(obj.practices) && obj.practices.length > 0) {
    obj.practices = await Promise.all(
      obj.practices.map(async (id) => {
        try {
          const { data } = await axios.get(`${PRACTICE_SERVICE_URL}/api/practices/${id}`, {
            headers: { Authorization: `Bearer ${tk}` },
            timeout: 8000,
          });
          const pr = data?.data || data;
          return pr ? { _id: pr._id, name: pr.name } : { _id: id };
        } catch {
          return { _id: id };
        }
      })
    );
  }

  if (Array.isArray(obj.specificUserIds) && obj.specificUserIds.length > 0) {
    const users = await Promise.all(obj.specificUserIds.map((id) => userSvc.getUserSnapshot(id, tk)));
    obj.specificUserIds = users
      .filter(Boolean)
      .map((u) => ({ _id: u._id, firstName: u.first_name, lastName: u.last_name, email: u.email }));
  }

  return obj;
}

async function resolveSurveyRefsMany(surveys, tk) {
  return Promise.all(surveys.map((s) => resolveSurveyRefs(s, tk)));
}

/** Résout practiceAtAnswer (UUID string → {_id, name}) sur un plain object de réponse */
async function resolvePracticeAtAnswer(obj, tk) {
  if (!obj.practiceAtAnswer) return obj;
  try {
    const { data } = await axios.get(
      `${PRACTICE_SERVICE_URL}/api/practices/${obj.practiceAtAnswer}`,
      { headers: { Authorization: `Bearer ${tk}` }, timeout: 8000 }
    );
    const pr = data?.data || data;
    obj.practiceAtAnswer = pr ? { _id: pr._id, name: pr.name } : null;
  } catch {
    obj.practiceAtAnswer = null;
  }
  return obj;
}

// ═══════════════════════════════════════════════════════════════════
// ADMIN — CRUD
// ═══════════════════════════════════════════════════════════════════

exports.createSurvey = async (req, res) => {
  try {
    const { user, tk } = await resolveCurrentUser(req);
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    const { title, type, pointsReward, googleFormUrl } = req.body;
    if (!title?.trim()) return res.status(400).json({ message: "Le titre est obligatoire" });

    const survey = new Survey({
      title:           title.trim(),
      target:          "COLLABORATOR",
      type,
      practices:       [],
      pointsReward:    pointsReward ?? 10,
      googleFormUrl:   googleFormUrl || null,
      specificUserIds: [],
      status:          "INACTIVE",
      createdBy:       user._id,
      createdByRole:   "ADMIN_RH",
    });
    await survey.save();

    const populated = await resolveSurveyRefs(survey, tk);
    res.status(201).json(populated);
  } catch (error) {
    console.error("[survey-service] createSurvey error:", error.message);
    res.status(500).json({ message: error.message });
  }
};

exports.getAllSurveys = async (req, res) => {
  try {
    const surveys = await Survey.find({ createdByRole: { $in: ["ADMIN_RH", "HRBP", null] } })
      .sort({ createdAt: -1 });
    const populated = await resolveSurveyRefsMany(surveys, token(req));
    res.json(populated);
  } catch (error) {
    console.error("[survey-service] getAllSurveys error:", error.message);
    res.status(500).json({ message: error.message });
  }
};

exports.updateSurvey = async (req, res) => {
  try {
    const survey = await Survey.findById(req.params.id);
    if (!survey) return res.status(404).json({ message: "Survey not found" });

    if (survey.createdByRole === "MANAGER") {
      return res.status(403).json({ message: "Vous ne pouvez pas modifier un sondage manager" });
    }

    const simpleFields = ["title", "type", "pointsReward", "status", "googleFormUrl", "startDate", "endDate"];
    for (const f of simpleFields) {
      if (req.body[f] !== undefined) survey[f] = req.body[f];
    }

    survey.target = "COLLABORATOR";

    if (req.body.practice) {
      const newPracticeId = req.body.practice.toString();
      const alreadyIn = survey.practices.some((p) => p === newPracticeId);
      if (!alreadyIn) survey.practices.push(newPracticeId);
    }

    if (Array.isArray(req.body.specificUserIds)) {
      for (const rawId of req.body.specificUserIds) {
        const newId = rawId.toString();
        const alreadyIn = survey.specificUserIds.some((id) => id === newId);
        if (!alreadyIn) survey.specificUserIds.push(newId);
      }
    }

    await survey.save();

    const populated = await resolveSurveyRefs(survey, token(req));
    res.json(populated);
  } catch (error) {
    console.error("[survey-service] updateSurvey error:", error.message);
    res.status(500).json({ message: error.message });
  }
};

exports.toggleSurvey = async (req, res) => {
  try {
    const survey = await Survey.findById(req.params.id);
    if (!survey) return res.status(404).json({ message: "Survey not found" });
    survey.status = survey.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    await survey.save();
    res.json(survey);
  } catch (error) {
    console.error("[survey-service] toggleSurvey error:", error.message);
    res.status(500).json({ message: error.message });
  }
};

exports.deleteSurvey = async (req, res) => {
  try {
    const survey = await Survey.findByIdAndDelete(req.params.id);
    if (!survey) return res.status(404).json({ message: "Survey not found" });
    await SurveyResponse.deleteMany({ survey: req.params.id });
    res.json({ message: "Survey deleted" });
  } catch (error) {
    console.error("[survey-service] deleteSurvey error:", error.message);
    res.status(500).json({ message: error.message });
  }
};

exports.getStats = async (req, res) => {
  try {
    const tk        = token(req);
    const responses = await SurveyResponse.find({ survey: req.params.id }).sort({ createdAt: -1 });

    const populated = await Promise.all(
      responses.map(async (r) => {
        let obj = r.toObject();
        obj.user = r.user ? await userSvc.getUserSnapshot(r.user, tk) : null;
        obj = await resolvePracticeAtAnswer(obj, tk);
        return obj;
      })
    );

    res.json(populated);
  } catch (error) {
    console.error("[survey-service] getStats error:", error.message);
    res.status(500).json({ message: error.message });
  }
};

// ═══════════════════════════════════════════════════════════════════
// USER — Consultation & réponse
// ═══════════════════════════════════════════════════════════════════

exports.getSurveysForUser = async (req, res) => {
  try {
    const { user, tk } = await resolveCurrentUser(req);
    if (!user) return res.status(401).json({ message: "Non authentifié" });

    const result = await buildUserFilter(user._id, tk);
    if (!result) return res.status(404).json({ message: "Utilisateur introuvable" });

    let surveys = await Survey.find(result.filter).sort({ createdAt: -1 });
    surveys = applySpecificUserFilter(surveys, user._id);

    const populated = await resolveSurveyRefsMany(surveys, tk);
    res.json(populated);
  } catch (error) {
    console.error("[survey-service] getSurveysForUser error:", error.message);
    res.status(500).json({ message: error.message });
  }
};

exports.getSurveyCount = async (req, res) => {
  try {
    const { user, tk } = await resolveCurrentUser(req);
    if (!user) return res.status(401).json({ message: "Non authentifié" });

    const result = await buildUserFilter(user._id, tk);
    if (!result) return res.status(404).json({ message: "Utilisateur introuvable" });

    let surveys = await Survey.find(result.filter).lean();
    surveys = applySpecificUserFilter(surveys, user._id);
    res.json({ count: surveys.length });
  } catch (error) {
    console.error("[survey-service] getSurveyCount error:", error.message);
    res.status(500).json({ message: error.message });
  }
};

exports.completeGoogleSurvey = async (req, res) => {
  try {
    const { user, tk } = await resolveCurrentUser(req);
    if (!user) return res.status(401).json({ message: "Non authentifié" });

    const survey = await Survey.findById(req.params.id);
    if (!survey) return res.status(404).json({ message: "Survey not found" });

    const already = await SurveyResponse.findOne({ survey: survey._id, user: user._id });
    if (already) return res.status(400).json({ message: "Vous avez déjà validé ce sondage" });

    const practiceAtAnswer = user.practice_id?.length ? user.practice_id[0] : null;
    await SurveyResponse.create({
      survey:           survey._id,
      user:             user._id,
      roleAtAnswer:     user.role,
      practiceAtAnswer,
    });

    const gamification = await applyGamification(user, survey, tk);
    res.json({ message: "Participation Google Form validée", ...gamification });
  } catch (e) {
    console.error("[survey-service] completeGoogleSurvey error:", e.message);
    res.status(500).json({ message: e.message });
  }
};

// ═══════════════════════════════════════════════════════════════════
// USER — Gamification
// ═══════════════════════════════════════════════════════════════════

exports.getMyGamification = async (req, res) => {
  try {
    const { user, tk } = await resolveCurrentUser(req);
    if (!user) return res.status(401).json({ message: "Non authentifié" });

    const fullUser = await userSvc.getUserById(user._id, tk);
    if (!fullUser) return res.status(404).json({ message: "Utilisateur introuvable" });

    const points          = fullUser.gamification?.points          ?? 0;
    const surveysAnswered = fullUser.gamification?.surveysAnswered ?? 0;

    let badgeData = { earnedBadges: [], nextBadge: null, allBadges: [] };
    try {
      const { data } = await axios.get(
        `${BADGE_SERVICE_URL}/api/badges/user/${user._id}`,
        {
          params: { surveysAnswered },
          headers: { Authorization: `Bearer ${tk}` },
          timeout: 8000,
        }
      );
      badgeData = data;
    } catch (err) {
      console.error("[survey-service] Erreur appel badge-service:", err.message);
    }

    res.json({ points, surveysAnswered, ...badgeData });
  } catch (e) {
    console.error("[survey-service] getMyGamification error:", e.message);
    res.status(500).json({ message: e.message });
  }
};

// ═══════════════════════════════════════════════════════════════════
// MANAGER — CRUD
// ═══════════════════════════════════════════════════════════════════

exports.createSurveyAsManager = async (req, res) => {
  try {
    const { user: manager, tk } = await resolveCurrentUser(req);
    if (!manager) return res.status(404).json({ message: "Manager introuvable" });

    if (!manager.practice_id?.length) {
      return res.status(403).json({ message: "Vous n'êtes assigné à aucun practice" });
    }
    const managerPracticeId = manager.practice_id[0];

    const { title, type, pointsReward, googleFormUrl } = req.body;
    if (!title?.trim()) {
      return res.status(400).json({ message: "Le titre est obligatoire" });
    }

    const survey = new Survey({
      title:           title.trim(),
      target:          "COLLABORATOR",
      type,
      practices:       [managerPracticeId],
      pointsReward:    pointsReward ?? 10,
      googleFormUrl:   googleFormUrl || null,
      specificUserIds: [],
      status:          "INACTIVE",
      createdBy:       manager._id,
      createdByRole:   "MANAGER",
    });

    await survey.save();

    const populated = await resolveSurveyRefs(survey, tk);
    res.status(201).json(populated);
  } catch (error) {
    console.error("[survey-service] createSurveyAsManager error:", error.message);
    res.status(500).json({ message: error.message });
  }
};

exports.getManagerSurveys = async (req, res) => {
  try {
    const { user: manager, tk } = await resolveCurrentUser(req);
    if (!manager) return res.status(404).json({ message: "Manager introuvable" });

    const surveys = await Survey.find({ createdBy: manager._id, createdByRole: "MANAGER" })
      .sort({ createdAt: -1 });

    const populated = await resolveSurveyRefsMany(surveys, tk);
    res.json(populated);
  } catch (error) {
    console.error("[survey-service] getManagerSurveys error:", error.message);
    res.status(500).json({ message: error.message });
  }
};

exports.updateSurveyAsManager = async (req, res) => {
  try {
    const { user: manager, tk } = await resolveCurrentUser(req);
    if (!manager) return res.status(404).json({ message: "Manager introuvable" });

    const survey = await Survey.findById(req.params.id);
    if (!survey) return res.status(404).json({ message: "Survey not found" });

    if (survey.createdBy !== manager._id) {
      return res.status(403).json({ message: "Vous n'avez pas accès à ce sondage" });
    }

    const simpleFields = ["title", "type", "pointsReward", "status", "googleFormUrl", "startDate", "endDate"];
    for (const f of simpleFields) {
      if (req.body[f] !== undefined) survey[f] = req.body[f];
    }

    if (req.body.specificUserIds !== undefined) {
      if (!Array.isArray(req.body.specificUserIds) || req.body.specificUserIds.length === 0) {
        survey.specificUserIds = [];
      } else {
        const existingSet = new Set(survey.specificUserIds);
        for (const rawId of req.body.specificUserIds) {
          const newId = rawId.toString();
          if (!existingSet.has(newId)) {
            survey.specificUserIds.push(newId);
            existingSet.add(newId);
          }
        }
      }
    }

    await survey.save();

    const populated = await resolveSurveyRefs(survey, tk);
    res.json(populated);
  } catch (error) {
    console.error("[survey-service] updateSurveyAsManager error:", error.message);
    res.status(500).json({ message: error.message });
  }
};

exports.deleteSurveyAsManager = async (req, res) => {
  try {
    const { user: manager, tk } = await resolveCurrentUser(req);
    if (!manager) return res.status(404).json({ message: "Manager introuvable" });

    const survey = await Survey.findById(req.params.id);
    if (!survey) return res.status(404).json({ message: "Survey not found" });

    if (survey.createdBy !== manager._id) {
      return res.status(403).json({ message: "Vous n'avez pas accès à ce sondage" });
    }

    await Survey.findByIdAndDelete(req.params.id);
    await SurveyResponse.deleteMany({ survey: req.params.id });

    res.json({ message: "Survey deleted" });
  } catch (error) {
    console.error("[survey-service] deleteSurveyAsManager error:", error.message);
    res.status(500).json({ message: error.message });
  }
};

exports.getManagerSurveyStats = async (req, res) => {
  try {
    const { user: manager, tk } = await resolveCurrentUser(req);
    if (!manager) return res.status(404).json({ message: "Manager introuvable" });

    const survey = await Survey.findById(req.params.id);
    if (!survey) return res.status(404).json({ message: "Survey not found" });

    if (survey.createdBy !== manager._id) {
      return res.status(403).json({ message: "Vous n'avez pas accès à ce sondage" });
    }

    const responses = await SurveyResponse.find({ survey: req.params.id }).sort({ createdAt: -1 });

    const populated = await Promise.all(
      responses.map(async (r) => {
        let obj = r.toObject();
        obj.user = r.user ? await userSvc.getUserSnapshot(r.user, tk) : null;
        obj = await resolvePracticeAtAnswer(obj, tk);
        return obj;
      })
    );

    res.json(populated);
  } catch (error) {
    console.error("[survey-service] getManagerSurveyStats error:", error.message);
    res.status(500).json({ message: error.message });
  }
};