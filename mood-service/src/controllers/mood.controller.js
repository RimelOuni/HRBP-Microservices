const Mood = require("../models/Mood.model");

function uid(req) {
  return req.user?.userId || req.user?.id || req.user?._id;
}

// ═══════════════════════════════════════════════════════════
// POST /api/moods — enregistrer un mood
// ═══════════════════════════════════════════════════════════
const saveMood = async (req, res) => {
  try {
    const { mood, comment } = req.body;
    const collaborateur = uid(req);
    if (!collaborateur) return res.status(401).json({ message: "Unauthorized" });

    const newMood = await Mood.create({ collaborateur, mood, comment });
    return res.status(201).json({ message: "Mood enregistré", mood: newMood });
  } catch (err) {
    console.error("[mood-service] saveMood error:", err.message);
    return res.status(500).json({ message: "Erreur serveur" });
  }
};

// ═══════════════════════════════════════════════════════════
// GET /api/moods/me/last — dernier mood du user connecté
// (remplace getLastMoodAndSatisfaction du monolithe, partie mood uniquement —
//  la partie satisfaction revient à satisfaction-service)
// ═══════════════════════════════════════════════════════════
const getLastMood = async (req, res) => {
  try {
    const collaborateur = uid(req);
    if (!collaborateur) return res.status(401).json({ message: "Unauthorized" });

    const lastMood = await Mood.findOne({ collaborateur }).sort({ createdAt: -1 });
    return res.json({ mood: lastMood });
  } catch (err) {
    console.error("[mood-service] getLastMood error:", err.message);
    return res.status(500).json({ message: "Erreur serveur" });
  }
};

// ═══════════════════════════════════════════════════════════
// GET /api/moods/me — historique complet du user connecté
// ═══════════════════════════════════════════════════════════
const getMyMoods = async (req, res) => {
  try {
    const collaborateur = uid(req);
    if (!collaborateur) return res.status(401).json({ message: "Unauthorized" });

    const moods = await Mood.find({ collaborateur }).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data: moods });
  } catch (err) {
    console.error("[mood-service] getMyMoods error:", err.message);
    return res.status(500).json({ message: "Erreur serveur" });
  }
};

// ═══════════════════════════════════════════════════════════
// POST /api/moods/bulk — dernier mood pour une liste de collaborateurs
// (remplace la partie "mood" de getMoodAndSatForMany — la partie
//  satisfaction revient à satisfaction-service)
// ═══════════════════════════════════════════════════════════
const getMoodForMany = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids)) {
      return res.status(400).json({ message: "ids doit être un tableau" });
    }

    const objectIds = ids
      .filter((id) => id && id.toString().match(/^[a-f\d]{24}$/i))
      .map((id) => new (require("mongoose").Types.ObjectId)(id));

    const moods = await Mood.aggregate([
      { $match: { collaborateur: { $in: objectIds } } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: "$collaborateur",
          mood: { $first: "$mood" },
          comment: { $first: "$comment" },
        },
      },
    ]);

    const result = {};
    ids.forEach((id) => { result[id] = { mood: null, comment: null }; });
    moods.forEach((m) => {
      result[m._id.toString()] = { mood: m.mood, comment: m.comment };
    });

    return res.json(result);
  } catch (err) {
    console.error("[mood-service] getMoodForMany error:", err.message);
    return res.status(500).json({ message: "Erreur serveur" });
  }
};

module.exports = {
  saveMood,
  getLastMood,
  getMyMoods,
  getMoodForMany,
};