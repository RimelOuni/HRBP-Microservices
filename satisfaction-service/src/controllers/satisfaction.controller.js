const mongoose = require("mongoose");
const Satisfaction = require("../models/Satisfaction.model");

function uid(req) {
  return req.user?.userId || req.user?.id || req.user?._id;
}

function isValidId(id) {
  return !!id && id.toString().match(/^[a-f\d]{24}$/i);
}

// ═══════════════════════════════════════════════════════════
// POST /api/satisfactions — enregistrer une satisfaction
// (fusion de saveSatisfaction et updateSatisfaction du monolithe)
// ═══════════════════════════════════════════════════════════
const saveSatisfaction = async (req, res) => {
  try {
    const { value, comment, point_id } = req.body;
    const collaborateur = uid(req);
    if (!collaborateur) return res.status(401).json({ message: "Unauthorized" });

    const newSat = await Satisfaction.create({
      collaborateur,
      value,
      comment: comment || "",
      point_id: point_id || null,
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
    const collaborateur = uid(req);
    if (!collaborateur) return res.status(401).json({ message: "Unauthorized" });

    const sats = await Satisfaction.find({ collaborateur }).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data: sats });
  } catch (err) {
    console.error("[satisfaction-service] getMySatisfactions error:", err.message);
    return res.status(500).json({ message: "Erreur serveur" });
  }
};

// ═══════════════════════════════════════════════════════════
// GET /api/satisfactions/me/last — dernière satisfaction du user connecté
// (remplace la partie "satisfaction" de getLastMoodAndSatisfaction)
// ═══════════════════════════════════════════════════════════
const getLastSatisfaction = async (req, res) => {
  try {
    const collaborateur = uid(req);
    if (!collaborateur) return res.status(401).json({ message: "Unauthorized" });

    const lastSat = await Satisfaction.findOne({ collaborateur }).sort({ createdAt: -1 });
    return res.json({ satisfaction: lastSat });
  } catch (err) {
    console.error("[satisfaction-service] getLastSatisfaction error:", err.message);
    return res.status(500).json({ message: "Erreur serveur" });
  }
};

// ═══════════════════════════════════════════════════════════
// POST /api/satisfactions/bulk — dernière satisfaction pour une liste de collaborateurs
// (remplace la partie "satisfaction" de getMoodAndSatForMany)
// ═══════════════════════════════════════════════════════════
const getSatisfactionForMany = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids)) {
      return res.status(400).json({ message: "ids doit être un tableau" });
    }

    const objectIds = ids
      .filter(isValidId)
      .map((id) => new mongoose.Types.ObjectId(id));

    const sats = await Satisfaction.aggregate([
      { $match: { collaborateur: { $in: objectIds } } },
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
      result[s._id.toString()] = { satisfaction: s.value, comment: s.comment };
    });

    return res.json(result);
  } catch (err) {
    console.error("[satisfaction-service] getSatisfactionForMany error:", err.message);
    return res.status(500).json({ message: "Erreur serveur" });
  }
};

// ═══════════════════════════════════════════════════════════
// POST /api/satisfactions/by-points — satisfaction du user pour une liste de points
// (identique à getSatisfactionsByPoints du monolithe)
// ═══════════════════════════════════════════════════════════
const getSatisfactionsByPoints = async (req, res) => {
  try {
    const collaborateur = uid(req);
    if (!collaborateur) return res.status(401).json({ message: "Unauthorized" });

    const { point_ids } = req.body;
    if (!Array.isArray(point_ids) || !point_ids.length) {
      return res.json({});
    }

    const objectIds = point_ids.filter(isValidId).map((id) => new mongoose.Types.ObjectId(id));

    const sats = await Satisfaction.find({
      collaborateur,
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