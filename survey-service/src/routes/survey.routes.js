const express          = require("express");
const router           = express.Router();
const surveyController = require("../controllers/survey.controller");
const authMiddleware   = require("../middleware/auth.middleware");
const roleMiddleware   = require("../middleware/role.middleware");

// ─── Admin routes ────────────────────────────────────────────────
router.post(
  "/",
  authMiddleware,
  roleMiddleware(["ADMIN_RH"]),
  surveyController.createSurvey
);
router.get(
  "/all",
  authMiddleware,
  roleMiddleware(["ADMIN_RH", "HRBP"]),
  surveyController.getAllSurveys
);
router.patch(
  "/:id/toggle",
  authMiddleware,
  roleMiddleware(["ADMIN_RH"]),
  surveyController.toggleSurvey
);
router.patch(
  "/:id",
  authMiddleware,
  roleMiddleware(["ADMIN_RH"]),
  surveyController.updateSurvey
);
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware(["ADMIN_RH"]),
  surveyController.deleteSurvey
);
router.get(
  "/:id/stats",
  authMiddleware,
  roleMiddleware(["ADMIN_RH", "HRBP"]),
  surveyController.getStats
);

// ═══ MANAGER ROUTES ════════════════════════════════════════════════
// Le manager peut créer des sondages pour SON practice uniquement
router.post(
  "/manager",
  authMiddleware,
  roleMiddleware(["MANAGER"]),
  surveyController.createSurveyAsManager
);

// Le manager peut voir SEULEMENT les sondages qu'il a créés
router.get(
  "/manager/mine",
  authMiddleware,
  roleMiddleware(["MANAGER"]),
  surveyController.getManagerSurveys
);

// Le manager peut mettre à jour SES sondages (envoyer à plus de monde)
router.patch(
  "/manager/:id",
  authMiddleware,
  roleMiddleware(["MANAGER"]),
  surveyController.updateSurveyAsManager
);

// Le manager peut supprimer SES sondages
router.delete(
  "/manager/:id",
  authMiddleware,
  roleMiddleware(["MANAGER"]),
  surveyController.deleteSurveyAsManager
);

// Le manager peut voir les stats de SES sondages
router.get(
  "/manager/:id/stats",
  authMiddleware,
  roleMiddleware(["MANAGER"]),
  surveyController.getManagerSurveyStats
);

// ─── User routes ─────────────────────────────────────────────────
router.get("/me",              authMiddleware, surveyController.getSurveysForUser);
router.get("/me/count",        authMiddleware, surveyController.getSurveyCount);
router.get("/me/gamification", authMiddleware, surveyController.getMyGamification);

// Seule route de réponse : Google Form
router.post("/:id/complete-google", authMiddleware, surveyController.completeGoogleSurvey);

module.exports = router;
