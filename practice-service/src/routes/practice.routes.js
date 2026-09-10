const router = require("express").Router();
const ctrl   = require("../controllers/practice.controller");
const auth   = require("../middleware/auth.middleware");
const role   = require("../middleware/role.middleware");

const ADMIN = role(["ADMIN_RH"]);

// Users par rôle
router.get("/users",    auth, ADMIN, ctrl.getUsersByRole);

// CRUD
router.post("/",        auth, ADMIN, ctrl.createPractice);
router.get("/",         auth,        ctrl.getAllPractices);
router.get("/:id",      auth,        ctrl.getPracticeById);
router.put("/:id",      auth, ADMIN, ctrl.updatePractice);
router.delete("/:id",   auth, ADMIN, ctrl.deletePractice);

// Collaborateurs & Managers par practice
router.get("/:id/collaborators", auth, ADMIN, ctrl.getCollaboratorsByPractice);
router.get("/:id/managers",      auth, ADMIN, ctrl.getManagersByPractice);

// Par practice ET HRBP
router.get("/:practiceId/hrbp/:hrbpId", auth, ADMIN, ctrl.getCollaboratorsByPracticeAndHrbp);

module.exports = router;