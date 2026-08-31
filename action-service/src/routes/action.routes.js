const express         = require("express");
const router          = express.Router();
const actionController = require("../controllers/action.controller");
const authMiddleware   = require("../middleware/auth.middleware");

router.use(authMiddleware);

// ═══════════════════════════════════════════════════════════
// ROUTE STATIQUE (avant /:id) — remplace l'ancien
// GET /api/points/:pointId/actions du monolithe
// ═══════════════════════════════════════════════════════════
router.get("/by-point/:pointId", actionController.getActionsByPoint);

// ─── CRUD standard ──────────────────────────────────────────
router.post("/",     actionController.createAction);
router.get("/:id",   actionController.getActionById);
router.put("/:id",   actionController.updateAction);
router.delete("/:id", actionController.deleteAction);

module.exports = router;
