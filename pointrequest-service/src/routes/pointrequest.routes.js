const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/pointrequest.controller");
const authMiddleware = require("../middleware/auth.middleware");

router.use(authMiddleware);

router.get("/me",         ctrl.getMyRequests);
router.post("/",          ctrl.createPointRequest);

router.get("/manager/me", ctrl.getManagerRequests);
router.post("/manager",   ctrl.createManagerPointRequest);

router.get("/",            ctrl.getPracticeRequests);

router.get("/:id",   ctrl.getRequestById);
router.patch("/:id", ctrl.updateRequest);

module.exports = router;