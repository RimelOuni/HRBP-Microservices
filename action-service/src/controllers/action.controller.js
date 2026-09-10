const mongoose = require("mongoose");
const Action   = require("../models/Action.model");

const userSvc  = require("../services/user.service");
const pointSvc = require("../services/point.service");

function token(req) {
  return (req.headers.authorization || "").replace("Bearer ", "");
}

function isValidObjectId(id) {
  return !!id && mongoose.Types.ObjectId.isValid(id.toString());
}

async function resolveCreatedBy(obj, tk) {
  if (obj.created_by) {
    const snapshot = await userSvc.getUserSnapshot(obj.created_by, tk);
    if (snapshot) obj.created_by = snapshot;
  }
  return obj;
}

async function resolvePointId(obj, tk) {
  if (isValidObjectId(obj.point_id)) {
    obj.point_id = await pointSvc.getPointSnapshot(obj.point_id.toString(), tk);
  }
  return obj;
}

// ═══════════════════════════════════════════════════════════════════
// CREATE action — POST /api/actions
// ═══════════════════════════════════════════════════════════════════
exports.createAction = async (req, res) => {
  try {
    const { point_id, action, description, status } = req.body;

    if (!point_id || !action) {
      return res.status(400).json({ message: "point_id and action are required" });
    }

    const tk = token(req);
    // Résout l'ID interne user-service via /api/users/me (keycloakId != entity id)
    const profile = await userSvc.getCurrentUserProfile(tk);
    if (!profile) {
      return res.status(401).json({ message: "Unauthorized: unable to resolve user profile" });
    }

    const newAction = await Action.create({
      point_id,
      action,
      description,
      status,
      created_by: profile._id,
    });

    res.status(201).json(newAction);
  } catch (error) {
    console.error("[action-service] createAction error:", error.message);
    res.status(500).json({ message: error.message });
  }
};

// ═══════════════════════════════════════════════════════════════════
// GET all actions by point — GET /api/actions/by-point/:pointId
// ═══════════════════════════════════════════════════════════════════
exports.getActionsByPoint = async (req, res) => {
  try {
    const { pointId } = req.params;
    const tk = token(req);

    if (!isValidObjectId(pointId)) {
      return res.status(400).json({ message: "Invalid point ID" });
    }

    const actions = await Action.find({ point_id: pointId }).sort({ createdAt: -1 });
    const populated = await Promise.all(
      actions.map(async (a) => resolveCreatedBy(a.toObject(), tk))
    );

    res.status(200).json(populated);
  } catch (error) {
    console.error("[action-service] getActionsByPoint error:", error.message);
    res.status(500).json({ message: error.message });
  }
};

// ═══════════════════════════════════════════════════════════════════
// GET single action — GET /api/actions/:id
// ═══════════════════════════════════════════════════════════════════
exports.getActionById = async (req, res) => {
  try {
    const tk = token(req);

    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid action ID" });
    }

    const action = await Action.findById(req.params.id);
    if (!action) {
      return res.status(404).json({ message: "Action not found" });
    }

    let obj = action.toObject();
    obj = await resolveCreatedBy(obj, tk);
    obj = await resolvePointId(obj, tk);

    res.status(200).json(obj);
  } catch (error) {
    console.error("[action-service] getActionById error:", error.message);
    res.status(500).json({ message: error.message });
  }
};

// updateAction / deleteAction — inchangés, ils utilisent déjà isValidId sur req.params.id
// (l'id Mongo de l'Action elle-même, pas point_id ni created_by) → renomme juste
// isValidId en isValidObjectId pour cohérence de nommage si tu gardes tout dans un seul fichier.
// ═══════════════════════════════════════════════════════════════════
// UPDATE action — PUT /api/actions/:id
// ═══════════════════════════════════════════════════════════════════
exports.updateAction = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ message: "Invalid action ID" });
    }

    const updatedAction = await Action.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedAction) {
      return res.status(404).json({ message: "Action not found" });
    }

    res.status(200).json(updatedAction);
  } catch (error) {
    console.error("[action-service] updateAction error:", error.message);
    res.status(500).json({ message: error.message });
  }
};

// ═══════════════════════════════════════════════════════════════════
// DELETE action — DELETE /api/actions/:id
// ═══════════════════════════════════════════════════════════════════
exports.deleteAction = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ message: "Invalid action ID" });
    }

    const deletedAction = await Action.findByIdAndDelete(req.params.id);

    if (!deletedAction) {
      return res.status(404).json({ message: "Action not found" });
    }

    res.status(200).json({ message: "Action deleted successfully" });
  } catch (error) {
    console.error("[action-service] deleteAction error:", error.message);
    res.status(500).json({ message: error.message });
  }
};
