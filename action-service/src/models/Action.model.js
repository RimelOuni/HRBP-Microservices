const mongoose = require("mongoose");

const actionSchema = new mongoose.Schema(
  {
    // Relation with Point (ONE point -> MANY actions)
    point_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Point",
      required: true,
    },

    // Action title
    action: {
      type: String,
      required: true,
      trim: true,
    },

    // Action description
    description: {
      type: String,
      required: false,
      default: "",
      trim: true,
    },

    // Action status (criticité)
    status: {
      type: String,
      enum: ["NONE", "LOW", "MEDIUM", "HIGH"],
      required: true,
      default: "NONE",
    },

    // Who created the action
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports =
  mongoose.models.Action || mongoose.model("Action", actionSchema);
