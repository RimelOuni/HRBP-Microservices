const mongoose = require("mongoose");
const Action   = require("../models/Action.model");

const userSvc  = require("../services/user.service");
const pointSvc = require("../services/point.service");

// ─── Helpers ──────────────────────────────────────────────────────────────

function uid(req) {
  return req.user?.userId || req.user?.id || req.user?._id;
}

function token(req) {
  return (req.headers.authorization || "").replace("Bearer ", "");
}

function isValidId(id) {
  return !!id && mongoose.Types.ObjectId.isValid(id.toString());
}

async function resolveCreatedBy(obj, tk) {
  if (isValidId(obj.created_by)) {
    obj.created_by = await userSvc.getUserSnapshot(obj.created_by.toString(), tk);
  }
  return obj;
}

async function resolvePointId(obj, tk) {
  if (isValidId(obj.point_id)) {
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

    const userId = uid(req);
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized: user not found in token" });
    }

    const newAction = await Action.create({
      point_id,
      action,
      description,
      status,
      created_by: userId,
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

    if (!isValidId(pointId)) {
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

    if (!isValidId(req.params.id)) {
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
