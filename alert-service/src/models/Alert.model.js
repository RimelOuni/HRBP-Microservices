const mongoose = require("mongoose");

const alertSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["formation", "workshop", "performance", "rh", "risque", "conge", "evolution", "conflit"],
      required: true,
    },
    titre: { type: String, required: true },
    description: { type: String, default: "" },
    managerNote: { type: String, default: "" },
    keyPoints: { type: [String], default: [] },
    date: { type: Date, required: true },
    statut: {
      type: String,
      enum: ["En attente", "Envoyée", "Lue", "Traitée"],
      default: "En attente",
    },
    // Interne à point-service — reste un vrai ObjectId Mongo
    point_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Point",
      required: true,
    },
    // IDs user-service (UUID string) — pas des ObjectId Mongo
    created_by: { type: String, required: true },
    destination_user_id: { type: String, required: true },
    destination_label: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Alert || mongoose.model("Alert", alertSchema);