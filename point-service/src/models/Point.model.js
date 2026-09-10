const mongoose = require("mongoose");

const pointSchema = new mongoose.Schema(
  {
    titre: { type: String, required: true },
    date: { type: Date, required: true },
    description: { type: String, trim: true },

    // IDs user-service (UUID string) — pas des ObjectId Mongo
    collaborateur: { type: String, default: null },
    invite: { type: [String], default: [] },
    created_by: { type: String, required: true },

    criticite: {
      type: String,
      enum: ["Basse", "Moyenne", "Haute"],
      default: "Basse",
    },
    duree_estimee: { type: String, default: "" },
    frequence: { type: String, default: "" },
    labels: { type: [String], default: [] },

    status: {
      type: String,
      enum: ["En attente", "En cours", "Terminé", "Annulé"],
      default: "En attente",
    },
    is_recurring: { type: Boolean, default: false },

    // Interne à ce service — reste un vrai ObjectId Mongo
    parent_point_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Point",
      default: null,
    },

    // ID practice-service (UUID string)
    practice_id: { type: String, required: false },
  },
  { timestamps: true, collection: "points" }
);

pointSchema.index({ invite: 1 });

module.exports = mongoose.models.Point || mongoose.model("Point", pointSchema);