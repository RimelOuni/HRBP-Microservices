const mongoose = require("mongoose");

const pointSchema = new mongoose.Schema(
  {
    titre: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    description: {
      type: String,
      trim: true,
    },
    collaborateur: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    // ── FIX: store as array of ObjectId so it accepts a list of users ──
    invite: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: [],
      },
    ],
    criticite: {
      type: String,
      enum: ["Basse", "Moyenne", "Haute"],
      default: "Basse",
    },
    duree_estimee: {
      type: String,
      default: "",
    },
    frequence: {
      type: String,
      default: "",
    },
    labels: {
      type: [String],
      default: [],
    },
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["En attente", "En cours", "Terminé", "Annulé"],
      default: "En attente",
    },
    is_recurring: {
      type: Boolean,
      default: false,
    },
    parent_point_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Point",
      default: null,
    },
    practice_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Practice",
      required: false,
    },
  },
  {
    timestamps: true,
    collection: "points",
  }
);

pointSchema.index({ invite: 1 });

module.exports = mongoose.models.Point || mongoose.model("Point", pointSchema);
