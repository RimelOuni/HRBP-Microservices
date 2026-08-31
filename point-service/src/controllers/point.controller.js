const mongoose = require("mongoose");
const Point = require("../models/Point.model");

const userSvc = require("../services/user.service");
const practiceSvc = require("../services/practice.service");

// ─── Helpers ──────────────────────────────────────────────────────────────

function uid(req) {
  return req.user?.userId || req.user?.id || req.user?._id;
}

function token(req) {
  return (req.headers.authorization || "").replace("Bearer ", "");
}

function isValidId(id) {
  return !!id && mongoose.Types.ObjectId.isValid(id.toString());
}

const resolveInvites = async (point, tk) => {
  const obj = typeof point.toObject === "function" ? point.toObject() : { ...point };
  const inviteArr = Array.isArray(obj.invite) ? obj.invite : (obj.invite ? [obj.invite] : []);
  const validIds = inviteArr.filter(isValidId).map((id) => id.toString());
  obj.invite = validIds.length > 0 ? await userSvc.getUsersByIds(validIds, tk) : [];
  return obj;
};

const resolveCreatedBy = async (obj, tk) => {
  if (obj.created_by && isValidId(obj.created_by)) {
    obj.created_by = await userSvc.getUserSnapshot(obj.created_by.toString(), tk);
  }
  return obj;
};

const resolveCollaborateur = async (obj, tk) => {
  if (obj.collaborateur && isValidId(obj.collaborateur)) {
    obj.collaborateur = await userSvc.getUserSnapshot(obj.collaborateur.toString(), tk);
  }
  return obj;
};

const resolvePracticeLight = async (obj, tk) => {
  if (obj.practice_id && isValidId(obj.practice_id)) {
    const pr = await practiceSvc.getPracticeById(obj.practice_id.toString(), tk);
    obj.practice_id = pr ? { _id: pr._id, name: pr.name } : obj.practice_id;
  }
  return obj;
};

const fullyResolvePoint = async (point, tk) => {
  let obj = await resolveInvites(point, tk);
  obj = await resolveCreatedBy(obj, tk);
  obj = await resolveCollaborateur(obj, tk);
  obj = await resolvePracticeLight(obj, tk);
  return obj;
};

// ═══════════════════════════════════════════════════════════
// HRBP / ADMIN — Points CRUD
// ═══════════════════════════════════════════════════════════

const getAllPractices = async (req, res) => {
  try {
    const practices = await practiceSvc.getActivePractices(token(req));

    const practicesWithCount = await Promise.all(
      practices.map(async (practice) => {
        const pointsCount = await Point.countDocuments({ practice_id: practice._id });
        return {
          _id: practice._id,
          name: practice.name,
          description: practice.description,
          pointsCount,
        };
      })
    );

    return res.status(200).json({ success: true, data: practicesWithCount });
  } catch (error) {
    console.error("[point-service] getAllPractices error:", error.message);
    return res.status(500).json({ success: false, message: "Error fetching practices" });
  }
};

const getPointsByPractice = async (req, res) => {
  try {
    const { practiceId } = req.params;
    const tk = token(req);

    const points = await Point.find({ practice_id: practiceId }).sort({ date: -1 });
    const populated = await Promise.all(points.map((p) => fullyResolvePoint(p, tk)));

    return res.status(200).json({ success: true, data: populated });
  } catch (error) {
    console.error("[point-service] getPointsByPractice error:", error.message);
    return res.status(500).json({ success: false, message: "Error fetching points" });
  }
};

const getPointById = async (req, res) => {
  try {
    const { pointId } = req.params;
    const tk = token(req);

    if (!isValidId(pointId)) {
      return res.status(400).json({ success: false, message: "Invalid point ID" });
    }

    const point = await Point.findById(pointId);
    if (!point) {
      return res.status(404).json({ success: false, message: "Point not found" });
    }

    const obj = await fullyResolvePoint(point, tk);
    return res.status(200).json({ success: true, data: obj });
  } catch (error) {
    console.error("[point-service] getPointById error:", error.message);
    return res.status(500).json({ success: false, message: "Error fetching point details" });
  }
};

const getAllPoints = async (req, res) => {
  try {
    const { status, criticite, is_recurring } = req.query;
    const tk = token(req);
    const filter = {};
    if (status) filter.status = status;
    if (criticite) filter.criticite = criticite;
    if (is_recurring !== undefined) filter.is_recurring = is_recurring === "true";

    const points = await Point.find(filter).sort({ date: -1 });
    const populated = await Promise.all(points.map((p) => fullyResolvePoint(p, tk)));

    return res.status(200).json({ success: true, data: populated });
  } catch (error) {
    console.error("[point-service] getAllPoints error:", error.message);
    return res.status(500).json({ success: false, message: "Error fetching points" });
  }
};

const createPoint = async (req, res) => {
  try {
    const {
      titre, date, description, collaborateur, invite, criticite,
      duree_estimee, frequence, is_recurring, practice_id, status,
    } = req.body;

    if (!titre || !date) {
      return res.status(400).json({
        success: false,
        message: "Le titre et la date sont obligatoires.",
      });
    }

    const userId = uid(req);
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized: user not found in token" });
    }

    const pointData = {
      titre, date, description, criticite, duree_estimee, frequence,
      is_recurring: is_recurring || false,
      status: status || "En attente",
      created_by: userId,
    };

    if (collaborateur) pointData.collaborateur = collaborateur;
    if (invite) pointData.invite = Array.isArray(invite) ? invite : [invite];
    if (practice_id) pointData.practice_id = practice_id;

    const point = await new Point(pointData).save();
    const obj = await fullyResolvePoint(point, token(req));

    return res.status(201).json({ success: true, data: obj });
  } catch (error) {
    console.error("[point-service] createPoint error:", error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const updatePoint = async (req, res) => {
  try {
    const { pointId } = req.params;
    const tk = token(req);

    if (!isValidId(pointId)) {
      return res.status(400).json({ success: false, message: "Invalid point ID" });
    }

    const exists = await Point.findById(pointId);
    if (!exists) {
      return res.status(404).json({ success: false, message: "Point not found" });
    }

    const updated = await Point.findByIdAndUpdate(
      pointId,
      { $set: req.body },
      { new: true, runValidators: false }
    );

    const obj = await fullyResolvePoint(updated, tk);
    return res.status(200).json({ success: true, data: obj });
  } catch (error) {
    console.error("[point-service] updatePoint error:", error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ═══════════════════════════════════════════════════════════
// COLLABORATEUR
// ═══════════════════════════════════════════════════════════

const getMyPoints = async (req, res) => {
  try {
    const userId = uid(req);
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const tk = token(req);
    const filter = { invite: { $in: [new mongoose.Types.ObjectId(userId)] } };
    if (req.query.status) filter.status = req.query.status;

    const points = await Point.find(filter).sort({ date: -1 });
    const populated = await Promise.all(points.map((p) => fullyResolvePoint(p, tk)));

    return res.status(200).json({ success: true, data: populated });
  } catch (e) {
    console.error("[point-service] getMyPoints error:", e.message);
    return res.status(500).json({ success: false, message: e.message });
  }
};

// ═══════════════════════════════════════════════════════════
// MANAGER
// ═══════════════════════════════════════════════════════════

const getManagerPoints = async (req, res) => {
  try {
    const userId = uid(req);
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const tk = token(req);
    const filter = {
      $or: [
        { invite: { $in: [new mongoose.Types.ObjectId(userId)] } },
        { created_by: new mongoose.Types.ObjectId(userId) },
      ],
    };
    if (req.query.status) filter.$and = [{ status: req.query.status }];

    const points = await Point.find(filter).sort({ date: -1 });
    const populated = await Promise.all(points.map((p) => fullyResolvePoint(p, tk)));

    return res.status(200).json({ success: true, data: populated });
  } catch (e) {
    console.error("[point-service] getManagerPoints error:", e.message);
    return res.status(500).json({ success: false, message: e.message });
  }
};

// ═══════════════════════════════════════════════════════════
// HRBP par ID
// ═══════════════════════════════════════════════════════════

const getPointsByHrbp = async (req, res) => {
  try {
    const { hrbpId } = req.params;
    if (!isValidId(hrbpId)) {
      return res.status(400).json({ success: false, message: "Invalid HRBP ID" });
    }

    const tk = token(req);
    const points = await Point.find({ created_by: hrbpId }).sort({ date: -1 });
    const populated = await Promise.all(points.map((p) => fullyResolvePoint(p, tk)));

    return res.status(200).json({ success: true, data: populated });
  } catch (error) {
    console.error("[point-service] getPointsByHrbp error:", error.message);
    return res.status(500).json({ success: false, message: "Error fetching points" });
  }
};

// ═══════════════════════════════════════════════════════════
// STATS — criticité (reste ici, purement basé sur Point)
// ═══════════════════════════════════════════════════════════

const getCriticiteForMany = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids)) {
      return res.status(400).json({ message: "ids doit être un tableau" });
    }

    const result = {};
    for (const id of ids) {
      if (!isValidId(id)) { result[id] = { Haute: 0, Moyenne: 0, Basse: 0 }; continue; }

      const counts = await Point.aggregate([
        { $match: { collaborateur: new mongoose.Types.ObjectId(id) } },
        { $group: { _id: "$criticite", count: { $sum: 1 } } },
      ]);
      result[id] = { Haute: 0, Moyenne: 0, Basse: 0 };
      counts.forEach((c) => {
        if (c._id in result[id]) result[id][c._id] = c.count;
      });
    }

    return res.json(result);
  } catch (err) {
    console.error("[point-service] getCriticiteForMany error:", err.message);
    return res.status(500).json({ message: "Erreur serveur" });
  }
};

module.exports = {
  getAllPractices,
  getPointsByPractice,
  getPointById,
  getAllPoints,
  createPoint,
  updatePoint,
  getMyPoints,
  getManagerPoints,
  getPointsByHrbp,
  getCriticiteForMany,
};