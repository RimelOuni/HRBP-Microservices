const router          = require("express").Router();
const badgeController = require("../controllers/badge.controller");
const authMiddleware  = require("../middleware/auth.middleware");

// ─── Statique /me et /definitions avant / dynamique ─────────────
router.get("/me",          authMiddleware, badgeController.getMyBadges);
router.get("/definitions",               badgeController.getBadgeDefinitions);

// ─── CRUD ────────────────────────────────────────────────────────
router.get("/",  authMiddleware, badgeController.getAllBadges);
router.post("/", authMiddleware, badgeController.createBadge);

module.exports = router;
