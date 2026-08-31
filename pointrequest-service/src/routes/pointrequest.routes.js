const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/pointrequest.controller");
const authMiddleware = require("../middleware/auth.middleware");

router.use(authMiddleware.authenticate || authMiddleware);

// ═══════════════════════════════════════════════════════════
// ROUTES STATIQUES AVANT LES DYNAMIQUES /:id
// ═══════════════════════════════════════════════════════════

router.get("/me",              ctrl.getMyRequests);
router.post("/",               ctrl.createPointRequest);

router.get("/manager/me",      ctrl.getManagerRequests);
router.post("/manager",        ctrl.createManagerPointRequest);

router.get("/",                ctrl.getPracticeRequests);

// ═══════════════════════════════════════════════════════════
// DYNAMIQUES /:id (TOUJOURS EN DERNIER)
// ═══════════════════════════════════════════════════════════

router.get("/:id",             ctrl.getRequestById);
router.patch("/:id",           ctrl.updateRequest);

module.exports = router;