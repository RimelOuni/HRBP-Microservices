const mongoose = require("mongoose");
const Satisfaction = require("../models/Satisfaction.model");
const userSvc = require("../services/user.service");

function token(req) {
  return (req.headers.authorization || "").replace("Bearer ", "");
}

// Valide uniquement l'_id Mongo d'un point (point-service) — plus utilisé pour un ID user-service
function isValidObjectId(id) {
  return !!id && mongoose.Types.ObjectId.isValid(id.toString());
}

// ═══════════════════════════════════════════════════════════
// POST /api/satisfactions — enregistrer une satisfaction
// ═══════════════════════════════════════════════════════════
const saveSatisfaction = async (req, res) => {
  try {
    const tk = token(req);
    const user = await userSvc.getCurrentUserProfile(tk);
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    const { value, comment, point_id } = req.body;

    const newSat = await Satisfaction.create({
      collaborateur: user._id,
      value,
      comment: comment || "",
      point_id: isValidObjectId(point_id) ? point_id : null,
    });

    return res.status(201).json({ message: "Satisfaction enregistrée", satisfaction: newSat });
  } catch (err) {
    console.error("[satisfaction-service] saveSatisfaction error:", err.message);
    return res.status(500).json({ message: "Erreur serveur" });
  }
};

// ═══════════════════════════════════════════════════════════
// GET /api/satisfactions/me — historique complet du user connecté
// ═══════════════════════════════════════════════════════════
const getMySatisfactions = async (req, res) => {
  try {
    const tk = token(req);
    const user = await userSvc.getCurrentUserProfile(tk);
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    const sats = await Satisfaction.find({ collaborateur: user._id }).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data: sats });
  } catch (err) {
    console.error("[satisfaction-service] getMySatisfactions error:", err.message);
    return res.status(500).json({ message: "Erreur serveur" });
  }
};

// ═══════════════════════════════════════════════════════════
// GET /api/satisfactions/me/last — dernière satisfaction du user connecté
// ═══════════════════════════════════════════════════════════
const getLastSatisfaction = async (req, res) => {
  try {
    const tk = token(req);
    const user = await userSvc.getCurrentUserProfile(tk);
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    const lastSat = await Satisfaction.findOne({ collaborateur: user._id }).sort({ createdAt: -1 });
    return res.json({ satisfaction: lastSat });
  } catch (err) {
    console.error("[satisfaction-service] getLastSatisfaction error:", err.message);
    return res.status(500).json({ message: "Erreur serveur" });
  }
};

// ═══════════════════════════════════════════════════════════
// POST /api/satisfactions/bulk — dernière satisfaction pour une liste de collaborateurs
// ids = IDs user-service (UUID string) — plus de cast ObjectId
// ═══════════════════════════════════════════════════════════
const getSatisfactionForMany = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids)) {
      return res.status(400).json({ message: "ids doit être un tableau" });
    }

    const cleanIds = ids.filter(Boolean).map((id) => id.toString());

    const sats = await Satisfaction.aggregate([
      { $match: { collaborateur: { $in: cleanIds } } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: "$collaborateur",
          value: { $first: "$value" },
          comment: { $first: "$comment" },
        },
      },
    ]);

    const result = {};
    ids.forEach((id) => { result[id] = { satisfaction: null, comment: null }; });
    sats.forEach((s) => {
      result[s._id] = { satisfaction: s.value, comment: s.comment };
    });

    return res.json(result);
  } catch (err) {
    console.error("[satisfaction-service] getSatisfactionForMany error:", err.message);
    return res.status(500).json({ message: "Erreur serveur" });
  }
};

// ═══════════════════════════════════════════════════════════
// POST /api/satisfactions/by-points — satisfaction du user pour une liste de points
// point_ids = ObjectId Mongo (point-service), inchangé
// ═══════════════════════════════════════════════════════════
const getSatisfactionsByPoints = async (req, res) => {
  try {
    const tk = token(req);
    const user = await userSvc.getCurrentUserProfile(tk);
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    const { point_ids } = req.body;
    if (!Array.isArray(point_ids) || !point_ids.length) {
      return res.json({});
    }

    const objectIds = point_ids.filter(isValidObjectId).map((id) => new mongoose.Types.ObjectId(id));

    const sats = await Satisfaction.find({
      collaborateur: user._id,
      point_id: { $in: objectIds },
    }).sort({ createdAt: -1 });

    const result = {};
    sats.forEach((s) => {
      const key = s.point_id?.toString();
      if (key && !result[key]) result[key] = s.value;
    });

    return res.json(result);
  } catch (err) {
    console.error("[satisfaction-service] getSatisfactionsByPoints error:", err.message);
    return res.status(500).json({ message: "Erreur serveur" });
  }
};

module.exports = {
  saveSatisfaction,
  getMySatisfactions,
  getLastSatisfaction,
  getSatisfactionForMany,
  getSatisfactionsByPoints,
};