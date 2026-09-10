const Mood = require("../models/Mood.model");
const userSvc = require("../services/user.service");

function token(req) {
  return (req.headers.authorization || "").replace("Bearer ", "");
}

// ═══════════════════════════════════════════════════════════
// POST /api/moods — enregistrer un mood
// ═══════════════════════════════════════════════════════════
const saveMood = async (req, res) => {
  try {
    const { mood, comment } = req.body;
    const tk = token(req);
    const profile = await userSvc.getCurrentUserProfile(tk);
    if (!profile) {
      return res.status(401).json({ message: "Unauthorized: unable to resolve user profile" });
    }

    const newMood = await Mood.create({ collaborateur: profile._id, mood, comment });
    return res.status(201).json({ message: "Mood enregistré", mood: newMood });
  } catch (err) {
    console.error("[mood-service] saveMood error:", err.message);
    return res.status(500).json({ message: "Erreur serveur" });
  }
};

// ═══════════════════════════════════════════════════════════
// GET /api/moods/me/last — dernier mood du user connecté
// ═══════════════════════════════════════════════════════════
const getLastMood = async (req, res) => {
  try {
    const tk = token(req);
    const profile = await userSvc.getCurrentUserProfile(tk);
    if (!profile) return res.status(401).json({ message: "Unauthorized" });

    const lastMood = await Mood.findOne({ collaborateur: profile._id }).sort({ createdAt: -1 });
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
    const tk = token(req);
    const profile = await userSvc.getCurrentUserProfile(tk);
    if (!profile) return res.status(401).json({ message: "Unauthorized" });

    const moods = await Mood.find({ collaborateur: profile._id }).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data: moods });
  } catch (err) {
    console.error("[mood-service] getMyMoods error:", err.message);
    return res.status(500).json({ message: "Erreur serveur" });
  }
};

// ═══════════════════════════════════════════════════════════
// POST /api/moods/bulk — dernier mood pour une liste de collaborateurs
// ═══════════════════════════════════════════════════════════
const getMoodForMany = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids)) {
      return res.status(400).json({ message: "ids doit être un tableau" });
    }

    // IDs user-service = UUID string, pas d'ObjectId Mongo à valider/caster ici
    const validIds = ids.filter((id) => !!id).map((id) => id.toString());

    const moods = await Mood.aggregate([
      { $match: { collaborateur: { $in: validIds } } },
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
      result[m._id] = { mood: m.mood, comment: m.comment };
    });

    return res.json(result);
  } catch (err) {
    console.error("[mood-service] getMoodForMany error:", err.message);
    return res.status(500).json({ message: "Erreur serveur" });
  }
};

module.exports = { saveMood, getLastMood, getMyMoods, getMoodForMany };