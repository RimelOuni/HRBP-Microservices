const express = require("express");
const router  = express.Router();
const authMiddleware = require("../middleware/auth.middleware");
const {
  createAlert, getAlertsByPoint,
  getAlertsByManager, updateAlert, deleteAlert,
} = require("../controllers/alert.controller");

router.use(authMiddleware);

// ─── Routes statiques (avant /:alertId) ─────────────────────────
router.post("/",                    createAlert);
router.get("/point/:pointId",       getAlertsByPoint);
router.get("/manager/:managerId",   getAlertsByManager);

// ─── Routes dynamiques ──────────────────────────────────────────
// Accept both PUT and PATCH for updates (identique au monolithe)
router.put("/:alertId",    updateAlert);
router.patch("/:alertId",  updateAlert);
router.delete("/:alertId", deleteAlert);

module.exports = router;
