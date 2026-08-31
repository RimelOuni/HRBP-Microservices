const mongoose        = require("mongoose");
const axios           = require("axios");
const Survey          = require("../models/Survey.model");
const SurveyResponse  = require("../models/SurveyResponse.model");

const userSvc = require("../services/user.service");

const BADGE_SERVICE_URL   = process.env.BADGE_SERVICE_URL;
const PRACTICE_SERVICE_URL = process.env.PRACTICE_SERVICE_URL;

// ═══════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════

function uid(req) {
  return req.user?._id || req.user?.userId || req.user?.id;
}

function token(req) {
  return (req.headers.authorization || "").replace("Bearer ", "");
}

function isValidId(id) {
  return !!id && mongoose.Types.ObjectId.isValid(id.toString());
}

/**
 * Applique la gamification après une réponse à un sondage :
 * incrémente points + surveysAnswered via le user-service, puis délègue
 * le calcul/enregistrement des badges à badge-service.
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
    // dégrade gracieusement : pas de badge calculé si badge-service est down,
    // mais les points/surveysAnswered restent bien enregistrés côté user-service
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
 * Construit le filtre Mongo des sondages visibles par un user donné,
 * en se basant sur son practice_id (résolu via le user-service) et
 * les sondages déjà répondus (à exclure).
 */
async function buildUserFilter(userId, tk) {
  const user = await userSvc.getUserSnapshot(userId, tk);
  if (!user) return null;

  const filter = {
    status: "ACTIVE",
    target: { $in: ["ALL", "COLLABORATOR"] },
  };

  if (user.practice_id?.length > 0) {
    const userPracticeObjectIds = user.practice_id
      .filter(isValidId)
      .map((p) => new mongoose.Types.ObjectId(p));
    filter.$or = [
      { practices: { $size: 0 } },
      { practices: { $in: userPracticeObjectIds } },
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
 * Résout practices[] et specificUserIds[] d'un survey en objets légers
 * via les services externes (équivalent du .populate() du monolithe).
 */
async function resolveSurveyRefs(surveyDoc, tk) {
  const obj = surveyDoc.toObject ? surveyDoc.toObject() : { ...surveyDoc };

  if (Array.isArray(obj.practices) && obj.practices.length > 0) {
    obj.practices = await Promise.all(
      obj.practices.map(async (p) => {
        const id = (p && p._id) ? p._id : p;
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
    const ids   = obj.specificUserIds.map((u) => (u && u._id) ? u._id : u);
    const users = await Promise.all(ids.map((id) => userSvc.getUserSnapshot(id, tk)));
    obj.specificUserIds = users
      .filter(Boolean)
      .map((u) => ({ _id: u._id, firstName: u.firstName, lastName: u.lastName, email: u.email }));
  }

  return obj;
}

async function resolveSurveyRefsMany(surveys, tk) {
  return Promise.all(surveys.map((s) => resolveSurveyRefs(s, tk)));
}

/** Résout practiceAtAnswer (ObjectId → {_id, name}) sur un plain object de réponse */
async function resolvePracticeAtAnswer(obj, tk) {
  if (!isValidId(obj.practiceAtAnswer)) {
    obj.practiceAtAnswer = null;
    return obj;
  }
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
      createdBy:       uid(req),
      createdByRole:   "ADMIN_RH",
    });
    await survey.save();

    const populated = await resolveSurveyRefs(survey, token(req));
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
      const newPracticeId = new mongoose.Types.ObjectId(req.body.practice);
      const alreadyIn = survey.practices.some((p) => p.toString() === newPracticeId.toString());
      if (!alreadyIn) survey.practices.push(newPracticeId);
    }

    if (Array.isArray(req.body.specificUserIds)) {
      for (const rawId of req.body.specificUserIds) {
        const newId = new mongoose.Types.ObjectId(rawId);
        const alreadyIn = survey.specificUserIds.some((id) => id.toString() === newId.toString());
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
        obj.user = isValidId(r.user) ? await userSvc.getUserSnapshot(r.user.toString(), tk) : null;
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
    if (!req.user) return res.status(401).json({ message: "Non authentifié" });
    const userId = uid(req);
    const tk     = token(req);
    const result = await buildUserFilter(userId, tk);
    if (!result) return res.status(404).json({ message: "Utilisateur introuvable" });

    let surveys = await Survey.find(result.filter).sort({ createdAt: -1 });
    surveys = applySpecificUserFilter(surveys, userId);

    const populated = await resolveSurveyRefsMany(surveys, tk);
    res.json(populated);
  } catch (error) {
    console.error("[survey-service] getSurveysForUser error:", error.message);
    res.status(500).json({ message: error.message });
  }
};

exports.getSurveyCount = async (req, res) => {
  try {
    const userId = uid(req);
    const tk     = token(req);
    const result = await buildUserFilter(userId, tk);
    if (!result) return res.status(404).json({ message: "Utilisateur introuvable" });

    let surveys = await Survey.find(result.filter).lean();
    surveys = applySpecificUserFilter(surveys, userId);
    res.json({ count: surveys.length });
  } catch (error) {
    console.error("[survey-service] getSurveyCount error:", error.message);
    res.status(500).json({ message: error.message });
  }
};

exports.completeGoogleSurvey = async (req, res) => {
  try {
    const userId = uid(req);
    const tk     = token(req);
    const survey = await Survey.findById(req.params.id);
    if (!survey) return res.status(404).json({ message: "Survey not found" });

    const already = await SurveyResponse.findOne({ survey: survey._id, user: userId });
    if (already) return res.status(400).json({ message: "Vous avez déjà validé ce sondage" });

    const user = await userSvc.getUserSnapshot(userId, tk);
    if (!user) return res.status(404).json({ message: "Utilisateur introuvable" });

    const practiceAtAnswer = user.practice_id?.length ? user.practice_id[0] : null;
    await SurveyResponse.create({
      survey:           survey._id,
      user:              userId,
      roleAtAnswer:      req.user.role,
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

/**
 * Remplace l'ancienne version : les points/surveysAnswered viennent
 * toujours de user-service, mais les badges sont maintenant récupérés
 * via un appel HTTP à badge-service.
 */
exports.getMyGamification = async (req, res) => {
  try {
    const userId = uid(req);
    const tk     = token(req);

    const fullUser = await userSvc.getUserById(userId, tk);
    if (!fullUser) return res.status(404).json({ message: "Utilisateur introuvable" });

    const points          = fullUser.gamification?.points          ?? 0;
    const surveysAnswered = fullUser.gamification?.surveysAnswered ?? 0;

    let badgeData = { earnedBadges: [], nextBadge: null, allBadges: [] };
    try {
      const { data } = await axios.get(
        `${process.env.BADGE_SERVICE_URL}/api/badges/user/${userId}`,
        {
          params: { surveysAnswered },
          headers: { Authorization: `Bearer ${tk}` },
          timeout: 8000,
        }
      );
      badgeData = data;
    } catch (err) {
      console.error("[survey-service] Erreur appel badge-service:", err.message);
      // dégrade gracieusement : points/surveysAnswered restent affichés
      // même si badge-service est indisponible
    }

    res.json({
      points,
      surveysAnswered,
      ...badgeData,
    });
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
    const { title, type, pointsReward, googleFormUrl } = req.body;
    const userId = uid(req);
    const tk     = token(req);

    const manager = await userSvc.getUserSnapshot(userId, tk);
    if (!manager) return res.status(404).json({ message: "Manager introuvable" });

    if (!manager.practice_id?.length) {
      return res.status(403).json({ message: "Vous n'êtes assigné à aucun practice" });
    }

    const managerPracticeId = manager.practice_id[0];

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
      createdBy:       userId,
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
    const userId = uid(req);
    const tk     = token(req);

    const manager = await userSvc.getUserSnapshot(userId, tk);
    if (!manager) return res.status(404).json({ message: "Manager introuvable" });

    const surveys = await Survey.find({ createdBy: userId, createdByRole: "MANAGER" })
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
    const userId   = uid(req);
    const tk       = token(req);
    const surveyId = req.params.id;

    const manager = await userSvc.getUserSnapshot(userId, tk);
    if (!manager) return res.status(404).json({ message: "Manager introuvable" });

    const survey = await Survey.findById(surveyId);
    if (!survey) return res.status(404).json({ message: "Survey not found" });

    if (survey.createdBy?.toString() !== userId.toString()) {
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
        const existingSet = new Set(survey.specificUserIds.map((id) => id.toString()));
        for (const rawId of req.body.specificUserIds) {
          const newId = rawId.toString();
          if (!existingSet.has(newId)) {
            survey.specificUserIds.push(new mongoose.Types.ObjectId(rawId));
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
    const userId   = uid(req);
    const tk       = token(req);
    const surveyId = req.params.id;

    const manager = await userSvc.getUserSnapshot(userId, tk);
    if (!manager) return res.status(404).json({ message: "Manager introuvable" });

    const survey = await Survey.findById(surveyId);
    if (!survey) return res.status(404).json({ message: "Survey not found" });

    if (survey.createdBy?.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Vous n'avez pas accès à ce sondage" });
    }

    await Survey.findByIdAndDelete(surveyId);
    await SurveyResponse.deleteMany({ survey: surveyId });

    res.json({ message: "Survey deleted" });
  } catch (error) {
    console.error("[survey-service] deleteSurveyAsManager error:", error.message);
    res.status(500).json({ message: error.message });
  }
};

exports.getManagerSurveyStats = async (req, res) => {
  try {
    const userId   = uid(req);
    const tk       = token(req);
    const surveyId = req.params.id;

    const manager = await userSvc.getUserSnapshot(userId, tk);
    if (!manager) return res.status(404).json({ message: "Manager introuvable" });

    const survey = await Survey.findById(surveyId);
    if (!survey) return res.status(404).json({ message: "Survey not found" });

    if (survey.createdBy?.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Vous n'avez pas accès à ce sondage" });
    }

    const responses = await SurveyResponse.find({ survey: surveyId }).sort({ createdAt: -1 });

    const populated = await Promise.all(
      responses.map(async (r) => {
        let obj = r.toObject();
        obj.user = isValidId(r.user) ? await userSvc.getUserSnapshot(r.user.toString(), tk) : null;
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