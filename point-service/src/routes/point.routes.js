const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/point.controller");
const auth = require("../middleware/auth.middleware");

router.use(auth);

// ═══════════════════════════════════════════════════════════
// ROUTES STATIQUES (toujours AVANT les routes dynamiques /:pointId)
// ═══════════════════════════════════════════════════════════

router.get("/practices",                    ctrl.getAllPractices);
router.get("/practices/:practiceId/points", ctrl.getPointsByPractice);

router.get("/hrbp/:hrbpId", ctrl.getPointsByHrbp);

router.get("/me",         ctrl.getMyPoints);
router.get("/manager/me", ctrl.getManagerPoints);

router.post("/criticite/bulk", ctrl.getCriticiteForMany);

router.get("/",  ctrl.getAllPoints);
router.post("/", ctrl.createPoint);

// ═══════════════════════════════════════════════════════════
// ROUTES DYNAMIQUES /:pointId (toujours en dernier)
// ═══════════════════════════════════════════════════════════
router.get("/:pointId", ctrl.getPointById);
router.put("/:pointId", ctrl.updatePoint);

module.exports = router;