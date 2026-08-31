const mongoose = require("mongoose");
const Alert    = require("../models/Alert.model");

const userSvc  = require("../services/user.service");
const pointSvc = require("../services/point.service");

// ─── Helpers ──────────────────────────────────────────────────────────────

function uid(req) {
  return req.user?.id || req.user?._id || req.user?.userId;
}

function token(req) {
  return (req.headers.authorization || "").replace("Bearer ", "");
}

function isValidId(id) {
  return !!id && mongoose.Types.ObjectId.isValid(id.toString());
}

/**
 * Résout les 3 refs d'une alerte en parallèle :
 * created_by, destination_user_id, point_id
 * fields : champs souhaités sur le point (varient selon la route)
 */
async function resolveAlertRefs(alertDoc, tk, pointFields = ["titre"]) {
  const obj = alertDoc.toObject ? alertDoc.toObject() : { ...alertDoc };

  const [createdBy, destination, point] = await Promise.all([
    isValidId(obj.created_by)          ? userSvc.getCreatedBySnapshot(obj.created_by.toString(), tk)          : Promise.resolve(null),
    isValidId(obj.destination_user_id) ? userSvc.getDestinationSnapshot(obj.destination_user_id.toString(), tk) : Promise.resolve(null),
    isValidId(obj.point_id)            ? pointSvc.getPointSnapshot(obj.point_id.toString(), tk, pointFields)    : Promise.resolve(null),
  ]);

  obj.created_by          = createdBy;
  obj.destination_user_id = destination;
  obj.point_id            = point;

  return obj;
}

// ═══════════════════════════════════════════════════════════════════
// CREATE alert — POST /api/alerts
// ═══════════════════════════════════════════════════════════════════
const createAlert = async (req, res) => {
  try {
    const userId = uid(req);
    const tk     = token(req);

    const {
      point_id, type, titre, description, managerNote,
      keyPoints, date, statut, destination_user_id, destination_label,
    } = req.body;

    if (!point_id || !type || !titre || !date || !destination_user_id) {
      return res.status(400).json({ success: false, message: "Champs obligatoires manquants." });
    }

    const alert = new Alert({
      point_id, type, titre, description, managerNote,
      keyPoints:           keyPoints || [],
      date,
      statut:              statut || "En attente",
      created_by:          userId,
      destination_user_id, destination_label,
    });

    await alert.save();

    const populated = await resolveAlertRefs(alert, tk, ["titre"]);
    return res.status(201).json({ success: true, data: populated });
  } catch (err) {
    console.error("[alert-service] createAlert error:", err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ═══════════════════════════════════════════════════════════════════
// GET alerts for a point — GET /api/alerts/point/:pointId
// ═══════════════════════════════════════════════════════════════════
const getAlertsByPoint = async (req, res) => {
  try {
    const { pointId } = req.params;
    const tk = token(req);

    if (!isValidId(pointId)) {
      return res.status(400).json({ success: false, message: "Invalid point ID" });
    }

    const alerts = await Alert.find({ point_id: pointId }).sort({ createdAt: -1 });

    const populated = await Promise.all(
      alerts.map((a) => resolveAlertRefs(a, tk, ["titre"]))
    );

    return res.status(200).json({ success: true, data: populated });
  } catch (err) {
    console.error("[alert-service] getAlertsByPoint error:", err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ═══════════════════════════════════════════════════════════════════
// GET alerts received by a manager — GET /api/alerts/manager/:managerId
// ═══════════════════════════════════════════════════════════════════
const getAlertsByManager = async (req, res) => {
  try {
    const { managerId } = req.params;
    const tk = token(req);

    if (!isValidId(managerId)) {
      return res.status(400).json({ success: false, message: "Invalid manager ID" });
    }

    const alerts = await Alert.find({ destination_user_id: managerId }).sort({ createdAt: -1 });

    // getAlertsByManager dans le monolithe populate point_id avec titre + criticite + status
    const populated = await Promise.all(
      alerts.map((a) => resolveAlertRefs(a, tk, ["titre", "criticite", "status"]))
    );

    return res.status(200).json({ success: true, data: populated });
  } catch (err) {
    console.error("[alert-service] getAlertsByManager error:", err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ═══════════════════════════════════════════════════════════════════
// UPDATE alert — PUT|PATCH /api/alerts/:alertId
// ═══════════════════════════════════════════════════════════════════
const updateAlert = async (req, res) => {
  try {
    const { alertId } = req.params;
    const tk = token(req);

    if (!isValidId(alertId)) {
      return res.status(400).json({ success: false, message: "Invalid alert ID" });
    }

    const alert = await Alert.findByIdAndUpdate(
      alertId,
      { $set: req.body },
      { new: true, runValidators: false }
    );

    if (!alert) return res.status(404).json({ success: false, message: "Alert not found" });

    const populated = await resolveAlertRefs(alert, tk, ["titre"]);
    return res.status(200).json({ success: true, data: populated });
  } catch (err) {
    console.error("[alert-service] updateAlert error:", err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ═══════════════════════════════════════════════════════════════════
// DELETE alert — DELETE /api/alerts/:alertId
// ═══════════════════════════════════════════════════════════════════
const deleteAlert = async (req, res) => {
  try {
    const { alertId } = req.params;

    if (!isValidId(alertId)) {
      return res.status(400).json({ success: false, message: "Invalid alert ID" });
    }

    await Alert.findByIdAndDelete(alertId);
    return res.status(200).json({ success: true, message: "Alert deleted" });
  } catch (err) {
    console.error("[alert-service] deleteAlert error:", err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { createAlert, getAlertsByPoint, getAlertsByManager, updateAlert, deleteAlert };
