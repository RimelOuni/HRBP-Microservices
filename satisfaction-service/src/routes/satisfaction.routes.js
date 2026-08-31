const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/satisfaction.controller");
const authMiddleware = require("../middleware/auth.middleware");

router.use(authMiddleware.authenticate || authMiddleware);

// ⚠️ Routes statiques AVANT toute route dynamique future

router.post("/",             ctrl.saveSatisfaction);
router.get("/me",            ctrl.getMySatisfactions);
router.get("/me/last",       ctrl.getLastSatisfaction);
router.post("/bulk",         ctrl.getSatisfactionForMany);
router.post("/by-points",    ctrl.getSatisfactionsByPoints);

module.exports = router;