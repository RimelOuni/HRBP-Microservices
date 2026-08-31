const express = require("express");
// mergeParams permet d'accéder à :practiceId depuis le router parent
const router = express.Router({ mergeParams: true });

const ctrl = require("../controllers/project.controller");
const auth = require("../middleware/auth.middleware");
const role = require("../middleware/role.middleware");

const ADMIN = role(["ADMIN_RH"]);

// ─── Lecture — tout utilisateur authentifié ───────────────────────────────
router.get("/",    auth, ctrl.getProjectsByPractice);
router.get("/:id", auth, ctrl.getProjectById);

// ─── Managers disponibles pour cette practice ─────────────────────────────
router.get("/:id/managers", auth, ADMIN, ctrl.getManagersByPractice);

// ─── Écriture — ADMIN_RH uniquement ──────────────────────────────────────
router.post(  "/",    auth, ADMIN, ctrl.createProject);
router.put(   "/:id", auth, ADMIN, ctrl.updateProject);
router.delete("/:id", auth, ADMIN, ctrl.deleteProject);

module.exports = router;
