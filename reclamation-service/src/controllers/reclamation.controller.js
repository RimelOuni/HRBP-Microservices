const Reclamation = require("../models/Reclamation.model");
const userSvc = require("../services/user.service");
const practiceSvc = require("../services/practice.service");
const pointSvc = require("../services/point.service");

function uid(req) {
  return req.user?.userId || req.user?.id || req.user?._id;
}

function token(req) {
  return (req.headers.authorization || "").replace("Bearer ", "");
}

function isValidId(id) {
  return !!id && id.toString().match(/^[a-f\d]{24}$/i);
}

/** Résout claimant + practice_id + point_id (léger) sur un document Reclamation */
const resolveReclamation = async (r, tk, pointFields = "titre status date criticite description") => {
  const obj = r.toObject ? r.toObject() : { ...r };

  obj.claimant = isValidId(obj.claimant)
    ? await userSvc.getUserSnapshot(obj.claimant.toString(), tk)
    : null;

  if (isValidId(obj.practice_id)) {
    const pr = await practiceSvc.getPracticeById(obj.practice_id.toString(), tk);
    obj.practice_id = pr ? { _id: pr._id, name: pr.name } : obj.practice_id;
  }

  if (isValidId(obj.point_id)) {
    const point = await pointSvc.getPointById(obj.point_id.toString(), tk);
    obj.point_id = point
      ? {
          _id: point._id,
          titre: point.titre,
          status: point.status,
          date: point.date,
          criticite: point.criticite,
          ...(pointFields.includes("description") ? { description: point.description } : {}),
        }
      : obj.point_id;
  }

  return obj;
};

// ═══════════════════════════════════════════════════════════
// HRBP — réclamations de la/des practice(s) qu'il gère
// ═══════════════════════════════════════════════════════════

const getPracticeReclamations = async (req, res) => {
  try {
    const tk = token(req);
    const userId = uid(req);
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const hrbp = await userSvc.getUserSnapshot(userId, tk);
    if (!hrbp) return res.status(404).json({ success: false, message: "HRBP introuvable" });

    const practiceIds = hrbp.practice_id || [];

    const reclamations = await Reclamation.find({
      practice_id: { $in: practiceIds },
    }).sort({ createdAt: -1 });

    const populated = await Promise.all(reclamations.map((r) => resolveReclamation(r, tk)));

    return res.status(200).json({ success: true, data: populated });
  } catch (e) {
    console.error("[reclamation-service] getPracticeReclamations error:", e.message);
    return res.status(500).json({ success: false, message: e.message });
  }
};

const getReclamationById = async (req, res) => {
  try {
    const tk = token(req);
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid reclamation ID" });
    }

    const r = await Reclamation.findById(req.params.id);
    if (!r) return res.status(404).json({ success: false, message: "Réclamation introuvable" });

    const obj = await resolveReclamation(r, tk, "titre status date criticite description duree_estimee");
    return res.status(200).json({ success: true, data: obj });
  } catch (e) {
    console.error("[reclamation-service] getReclamationById error:", e.message);
    return res.status(500).json({ success: false, message: e.message });
  }
};

const updateReclamation = async (req, res) => {
  try {
    const { status, reponse_hrbp } = req.body;
    if (!["PENDING", "PROCESSED", "REJECTED"].includes(status))
      return res.status(400).json({ success: false, message: "Statut invalide" });

    if (!isValidId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid reclamation ID" });
    }

    const r = await Reclamation.findByIdAndUpdate(
      req.params.id,
      { $set: { status, ...(reponse_hrbp !== undefined ? { reponse_hrbp } : {}) } },
      { new: true }
    );
    if (!r) return res.status(404).json({ success: false, message: "Réclamation introuvable" });

    const tk = token(req);
    const obj = await resolveReclamation(r, tk);
    return res.status(200).json({ success: true, data: obj });
  } catch (e) {
    console.error("[reclamation-service] updateReclamation error:", e.message);
    return res.status(500).json({ success: false, message: e.message });
  }
};

// ═══════════════════════════════════════════════════════════
// COLLABORATEUR
// ═══════════════════════════════════════════════════════════

const getMyReclamations = async (req, res) => {
  try {
    const userId = uid(req);
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const tk = token(req);
    const reclamations = await Reclamation.find({
      claimant: userId,
      claimant_type: "COLLABORATEUR",
    }).sort({ createdAt: -1 });

    const populated = await Promise.all(
      reclamations.map(async (r) => {
        const obj = r.toObject();
        if (isValidId(r.point_id)) {
          const point = await pointSvc.getPointById(r.point_id.toString(), tk);
          obj.point_id = point
            ? { _id: point._id, titre: point.titre, status: point.status, date: point.date, criticite: point.criticite, description: point.description }
            : obj.point_id;
        }
        if (isValidId(r.practice_id)) {
          const pr = await practiceSvc.getPracticeById(r.practice_id.toString(), tk);
          obj.practice_id = pr ? { _id: pr._id, name: pr.name } : obj.practice_id;
        }
        return obj;
      })
    );

    return res.status(200).json({ success: true, data: populated });
  } catch (e) {
    console.error("[reclamation-service] getMyReclamations error:", e.message);
    return res.status(500).json({ success: false, message: e.message });
  }
};

const createReclamation = async (req, res) => {
  try {
    const userId = uid(req);
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const { pointId, titre, commentaire } = req.body;
    const nouvelleDateRaw = req.body.nouvelle_date_proposee ?? req.body.nouvelle_date ?? null;

    if (!titre?.trim())
      return res.status(400).json({ success: false, message: "Le titre est obligatoire." });
    if (!pointId)
      return res.status(400).json({ success: false, message: "Le pointId est obligatoire." });

    const tk = token(req);
    const point = await pointSvc.getPointById(pointId, tk);

    if (!point || point.collaborateur?._id?.toString() !== userId.toString())
      return res.status(403).json({ success: false, message: "Ce point ne vous appartient pas." });

    const existing = await Reclamation.findOne({
      point_id: pointId,
      claimant: userId,
      claimant_type: "COLLABORATEUR",
      status: "PENDING",
    });
    if (existing)
      return res.status(400).json({ success: false, message: "Une réclamation est déjà en attente pour ce point." });

    const user = await userSvc.getUserSnapshot(userId, tk);
    const practiceId = user?.practice_id?.length ? user.practice_id[0] : null;

    const reclam = await new Reclamation({
      point_id: pointId,
      claimant: userId,
      claimant_type: "COLLABORATEUR",
      practice_id: practiceId,
      titre: titre.trim(),
      commentaire: commentaire?.trim() || "",
      nouvelle_date_proposee: nouvelleDateRaw ? new Date(nouvelleDateRaw) : null,
      point_snapshot: {
        titre: point.titre || "",
        date: point.date || null,
        status: point.status || "",
        criticite: point.criticite || "",
      },
      status: "PENDING",
    }).save();

    const obj = await resolveReclamation(reclam, tk);
    return res.status(201).json({ success: true, data: obj });
  } catch (e) {
    console.error("[reclamation-service] createReclamation error:", e.message);
    return res.status(500).json({ success: false, message: e.message });
  }
};

// ═══════════════════════════════════════════════════════════
// MANAGER
// ═══════════════════════════════════════════════════════════

const getManagerReclamations = async (req, res) => {
  try {
    const userId = uid(req);
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const tk = token(req);
    const reclamations = await Reclamation.find({
      claimant: userId,
      claimant_type: "MANAGER",
    }).sort({ createdAt: -1 });

    const populated = await Promise.all(
      reclamations.map(async (r) => {
        const obj = r.toObject();
        if (isValidId(r.point_id)) {
          const point = await pointSvc.getPointById(r.point_id.toString(), tk);
          obj.point_id = point
            ? { _id: point._id, titre: point.titre, status: point.status, date: point.date, criticite: point.criticite, description: point.description }
            : obj.point_id;
        }
        if (isValidId(r.practice_id)) {
          const pr = await practiceSvc.getPracticeById(r.practice_id.toString(), tk);
          obj.practice_id = pr ? { _id: pr._id, name: pr.name } : obj.practice_id;
        }
        return obj;
      })
    );

    return res.status(200).json({ success: true, data: populated });
  } catch (e) {
    console.error("[reclamation-service] getManagerReclamations error:", e.message);
    return res.status(500).json({ success: false, message: e.message });
  }
};

const createManagerReclamation = async (req, res) => {
  try {
    const userId = uid(req);
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const { pointId, titre, commentaire } = req.body;
    const nouvelleDateRaw = req.body.nouvelle_date_proposee ?? req.body.nouvelle_date ?? null;

    if (!titre?.trim())
      return res.status(400).json({ success: false, message: "Le titre est obligatoire." });
    if (!pointId)
      return res.status(400).json({ success: false, message: "Le pointId est obligatoire." });

    const tk = token(req);
    const point = await pointSvc.getPointById(pointId, tk);

    const isCreator = point?.created_by?._id?.toString() === userId.toString();
    const isInvited = Array.isArray(point?.invite) && point.invite.some((u) => u._id?.toString() === userId.toString());

    if (!point || (!isCreator && !isInvited))
      return res.status(403).json({ success: false, message: "Ce point ne vous appartient pas ou vous n'y êtes pas invité." });

    const existing = await Reclamation.findOne({
      point_id: pointId,
      claimant: userId,
      claimant_type: "MANAGER",
      status: "PENDING",
    });
    if (existing)
      return res.status(400).json({ success: false, message: "Une réclamation est déjà en attente pour ce point." });

    const user = await userSvc.getUserSnapshot(userId, tk);
    const practiceId = user?.practice_id?.length ? user.practice_id[0] : null;

    const reclam = await new Reclamation({
      point_id: pointId,
      claimant: userId,
      claimant_type: "MANAGER",
      practice_id: practiceId,
      titre: titre.trim(),
      commentaire: commentaire?.trim() || "",
      nouvelle_date_proposee: nouvelleDateRaw ? new Date(nouvelleDateRaw) : null,
      point_snapshot: {
        titre: point.titre || "",
        date: point.date || null,
        status: point.status || "",
        criticite: point.criticite || "",
      },
      status: "PENDING",
    }).save();

    const obj = await resolveReclamation(reclam, tk);
    return res.status(201).json({ success: true, data: obj });
  } catch (e) {
    console.error("[reclamation-service] createManagerReclamation error:", e.message);
    return res.status(500).json({ success: false, message: e.message });
  }
};

module.exports = {
  getPracticeReclamations,
  getReclamationById,
  updateReclamation,
  getMyReclamations,
  createReclamation,
  getManagerReclamations,
  createManagerReclamation,
};