const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
      default: "",
    },

    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE", "ON_HOLD", "COMPLETED"],
      default: "ACTIVE",
    },

    // Relation : chaque projet appartient à une practice
    practice_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Practice",
      required: true,
    },

    // Chef de projet optionnel (un User résolu via user-service)
    manager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    startDate: {
      type: Date,
      default: null,
    },

    endDate: {
      type: Date,
      default: null,
    },

    creationDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Project", projectSchema);
