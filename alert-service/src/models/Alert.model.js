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
    // The point this alert belongs to
    point_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Point",
      required: true,
    },
    // Who created the alert (HRBP)
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Destination: the collaborateur's RO or CC (manager)
    destination_user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Label for display (e.g. "RO" or "CC")
    destination_label: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Alert || mongoose.model("Alert", alertSchema);
