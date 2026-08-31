const PointRequest = require("../models/PointRequest.model");
const userSvc = require("../services/user.service");
const practiceSvc = require("../services/practice.service");

function uid(req) {
  return req.user?.userId || req.user?.id || req.user?._id;
}

function token(req) {
  return (req.headers.authorization || "").replace("Bearer ", "");
}

function isValidId(id) {
  return !!id && id.toString().match(/^[a-f\d]{24}$/i);
}

/** Résout requester + practice_id sur un document PointRequest */
const resolveRequest = async (request, tk) => {
  const obj = request.toObject ? request.toObject() : { ...request };

  obj.requester = isValidId(obj.requester)
    ? await userSvc.getUserSnapshot(obj.requester.toString(), tk)
    : null;

  if (isValidId(obj.practice_id)) {
    const pr = await practiceSvc.getPracticeById(obj.practice_id.toString(), tk);
    obj.practice_id = pr ? { _id: pr._id, name: pr.name } : obj.practice_id;
  }

  return obj;
};

// ═══════════════════════════════════════════════════════════
// HRBP — demandes de la/des practice(s) qu'il gère
// ═══════════════════════════════════════════════════════════

const getPracticeRequests = async (req, res) => {
  try {
    const tk = token(req);
    const userId = uid(req);
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const hrbp = await userSvc.getUserSnapshot(userId, tk);
    if (!hrbp) return res.status(404).json({ success: false, message: "HRBP introuvable" });

    const practiceIds = hrbp.practice_id || [];

    const requests = await PointRequest.find({
      practice_id: { $in: practiceIds },
    }).sort({ createdAt: -1 });

    const populated = await Promise.all(requests.map((r) => resolveRequest(r, tk)));

    return res.status(200).json({ success: true, data: populated });
  } catch (e) {
    console.error("[pointrequest-service] getPracticeRequests error:", e.message);
    return res.status(500).json({ success: false, message: e.message });
  }
};

const getRequestById = async (req, res) => {
  try {
    const tk = token(req);
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid request ID" });
    }

    const request = await PointRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ success: false, message: "Demande introuvable" });

    const obj = await resolveRequest(request, tk);
    return res.status(200).json({ success: true, data: obj });
  } catch (e) {
    console.error("[pointrequest-service] getRequestById error:", e.message);
    return res.status(500).json({ success: false, message: e.message });
  }
};

const updateRequest = async (req, res) => {
  try {
    const { status } = req.body;
    if (!["PENDING", "PROCESSED", "REJECTED"].includes(status))
      return res.status(400).json({ success: false, message: "Statut invalide" });

    if (!isValidId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid request ID" });
    }

    const request = await PointRequest.findByIdAndUpdate(
      req.params.id,
      { $set: { status } },
      { new: true }
    );
    if (!request) return res.status(404).json({ success: false, message: "Demande introuvable" });

    const tk = token(req);
    const obj = await resolveRequest(request, tk);
    return res.status(200).json({ success: true, data: obj });
  } catch (e) {
    console.error("[pointrequest-service] updateRequest error:", e.message);
    return res.status(500).json({ success: false, message: e.message });
  }
};

// ═══════════════════════════════════════════════════════════
// COLLABORATEUR
// ═══════════════════════════════════════════════════════════

const getMyRequests = async (req, res) => {
  try {
    const userId = uid(req);
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const tk = token(req);
    const requests = await PointRequest.find({
      requester: userId,
      requester_type: "COLLABORATEUR",
    }).sort({ createdAt: -1 });

    const populated = await Promise.all(
      requests.map(async (r) => {
        const obj = r.toObject();
        if (isValidId(r.practice_id)) {
          const pr = await practiceSvc.getPracticeById(r.practice_id.toString(), tk);
          obj.practice_id = pr ? { _id: pr._id, name: pr.name } : obj.practice_id;
        }
        return obj;
      })
    );

    return res.status(200).json({ success: true, data: populated });
  } catch (e) {
    console.error("[pointrequest-service] getMyRequests error:", e.message);
    return res.status(500).json({ success: false, message: e.message });
  }
};

const createPointRequest = async (req, res) => {
  try {
    const userId = uid(req);
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const { titre, commentaire, date_souhaitee } = req.body;
    if (!titre?.trim())
      return res.status(400).json({ success: false, message: "Le titre est obligatoire." });
    if (!date_souhaitee)
      return res.status(400).json({ success: false, message: "La date souhaitée est obligatoire." });

    const tk = token(req);
    const user = await userSvc.getUserSnapshot(userId, tk);
    const practiceId = user?.practice_id?.length ? user.practice_id[0] : null;

    const request = await new PointRequest({
      requester: userId,
      requester_type: "COLLABORATEUR",
      practice_id: practiceId,
      titre: titre.trim(),
      commentaire: commentaire?.trim() || "",
      date_souhaitee: new Date(date_souhaitee),
      status: "PENDING",
    }).save();

    const obj = request.toObject();
    obj.requester = user;
    obj.practice_id = practiceId ? await practiceSvc.getPracticeById(practiceId, tk) : null;

    return res.status(201).json({ success: true, data: obj });
  } catch (e) {
    console.error("[pointrequest-service] createPointRequest error:", e.message);
    return res.status(500).json({ success: false, message: e.message });
  }
};

// ═══════════════════════════════════════════════════════════
// MANAGER
// ═══════════════════════════════════════════════════════════

const getManagerRequests = async (req, res) => {
  try {
    const userId = uid(req);
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const tk = token(req);
    const requests = await PointRequest.find({
      requester: userId,
      requester_type: "MANAGER",
    }).sort({ createdAt: -1 });

    const populated = await Promise.all(
      requests.map(async (r) => {
        const obj = r.toObject();
        if (isValidId(r.practice_id)) {
          const pr = await practiceSvc.getPracticeById(r.practice_id.toString(), tk);
          obj.practice_id = pr ? { _id: pr._id, name: pr.name } : obj.practice_id;
        }
        return obj;
      })
    );

    return res.status(200).json({ success: true, data: populated });
  } catch (e) {
    console.error("[pointrequest-service] getManagerRequests error:", e.message);
    return res.status(500).json({ success: false, message: e.message });
  }
};

const createManagerPointRequest = async (req, res) => {
  try {
    const userId = uid(req);
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const { titre, commentaire, date_souhaitee } = req.body;
    if (!titre?.trim())
      return res.status(400).json({ success: false, message: "Le titre est obligatoire." });
    if (!date_souhaitee)
      return res.status(400).json({ success: false, message: "La date souhaitée est obligatoire." });

    const tk = token(req);
    const user = await userSvc.getUserSnapshot(userId, tk);
    const practiceId = user?.practice_id?.length ? user.practice_id[0] : null;

    const request = await new PointRequest({
      requester: userId,
      requester_type: "MANAGER",
      practice_id: practiceId,
      titre: titre.trim(),
      commentaire: commentaire?.trim() || "",
      date_souhaitee: new Date(date_souhaitee),
      status: "PENDING",
    }).save();

    const obj = request.toObject();
    obj.requester = user;
    obj.practice_id = practiceId ? await practiceSvc.getPracticeById(practiceId, tk) : null;

    return res.status(201).json({ success: true, data: obj });
  } catch (e) {
    console.error("[pointrequest-service] createManagerPointRequest error:", e.message);
    return res.status(500).json({ success: false, message: e.message });
  }
};

module.exports = {
  getPracticeRequests,
  getRequestById,
  updateRequest,
  getMyRequests,
  createPointRequest,
  getManagerRequests,
  createManagerPointRequest,
};