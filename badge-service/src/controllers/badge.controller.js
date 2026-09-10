const Badge = require("../models/Badge.model");
const { BADGE_DEFINITIONS } = require("../models/Badges.config");

const userSvc     = require("../services/user.service");
const practiceSvc = require("../services/practice.service");

function token(req) {
  return (req.headers.authorization || "").replace("Bearer ", "");
}

async function resolvePracticeId(obj, tk) {
  if (obj.practiceId) {
    obj.practiceId = await practiceSvc.getPracticeSnapshot(obj.practiceId, tk);
  } else {
    obj.practiceId = null;
  }
  return obj;
}

async function resolveUserId(obj, tk) {
  if (obj.userId) {
    const snap = await userSvc.getUserSnapshot(obj.userId, tk);
    if (snap) obj.userId = snap;
  }
  return obj;
}

// ═══════════════════════════════════════════════════════════════════
// GET /api/badges/me — badges de l'utilisateur connecté
// ═══════════════════════════════════════════════════════════════════
exports.getMyBadges = async (req, res) => {
  try {
    const tk = token(req);
    const profile = await userSvc.getCurrentUserProfile(tk);
    if (!profile) {
      return res.status(401).json({ message: "Unauthorized: unable to resolve user profile" });
    }

    const badges = await Badge.find({ userId: profile._id }).sort({ earnedAt: 1 }).lean();
    const populated = await Promise.all(badges.map((b) => resolvePracticeId(b, tk)));

    res.json(populated);
  } catch (e) {
    console.error("[badge-service] getMyBadges error:", e.message);
    res.status(500).json({ message: e.message });
  }
};

// ═══════════════════════════════════════════════════════════════════
// GET /api/badges — tous les badges (admin)
// ═══════════════════════════════════════════════════════════════════
exports.getAllBadges = async (req, res) => {
  try {
    const tk = token(req);
    const badges = await Badge.find().sort({ earnedAt: -1 }).lean();

    const populated = await Promise.all(
      badges.map(async (b) => {
        let obj = { ...b };
        obj = await resolveUserId(obj, tk);
        obj = await resolvePracticeId(obj, tk);
        return obj;
      })
    );

    res.json(populated);
  } catch (e) {
    console.error("[badge-service] getAllBadges error:", e.message);
    res.status(500).json({ message: e.message });
  }
};

// ═══════════════════════════════════════════════════════════════════
// GET /api/badges/definitions — définitions statiques (sans auth)
// ═══════════════════════════════════════════════════════════════════
exports.getBadgeDefinitions = (_req, res) => {
  res.json(BADGE_DEFINITIONS);
};

// ═══════════════════════════════════════════════════════════════════
// POST /api/badges — attribution manuelle (admin)
// ═══════════════════════════════════════════════════════════════════
exports.createBadge = async (req, res) => {
  try {
    const badge = new Badge(req.body);
    await badge.save();
    res.status(201).json(badge);
  } catch (e) {
    if (e.code === 11000) {
      return res.status(409).json({ message: "Cet utilisateur possède déjà ce badge." });
    }
    console.error("[badge-service] createBadge error:", e.message);
    res.status(500).json({ message: e.message });
  }
};