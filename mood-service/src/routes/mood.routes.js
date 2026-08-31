const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/mood.controller");
const authMiddleware = require("../middleware/auth.middleware");

router.use(authMiddleware.authenticate || authMiddleware);

router.post("/",         ctrl.saveMood);
router.get("/me",        ctrl.getMyMoods);
router.get("/me/last",   ctrl.getLastMood);
router.post("/bulk",     ctrl.getMoodForMany);

module.exports = router;