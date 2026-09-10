const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/reclamation.controller");
const authMiddleware = require("../middleware/auth.middleware");

router.use(authMiddleware);

router.get("/me",         ctrl.getMyReclamations);
router.post("/",          ctrl.createReclamation);

router.get("/manager/me", ctrl.getManagerReclamations);
router.post("/manager",   ctrl.createManagerReclamation);

router.get("/",            ctrl.getPracticeReclamations);

router.get("/:id",   ctrl.getReclamationById);
router.patch("/:id", ctrl.updateReclamation);

module.exports = router;