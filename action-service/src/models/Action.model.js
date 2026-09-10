const mongoose = require("mongoose");

const actionSchema = new mongoose.Schema(
  {
    point_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    action: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: false,
      default: "",
      trim: true,
    },
    status: {
      type: String,
      enum: ["NONE", "LOW", "MEDIUM", "HIGH"],
      required: true,
      default: "NONE",
    },
    // ID de l'entité UserProfile côté user-service (UUID string) — pas un ObjectId Mongo
    created_by: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Action || mongoose.model("Action", actionSchema);