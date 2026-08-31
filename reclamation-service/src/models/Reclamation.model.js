const mongoose = require("mongoose");

const reclamationSchema = new mongoose.Schema(
  {
    point_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Point",
      required: true,
      index: true,
    },
    claimant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    claimant_type: {
      type: String,
      enum: ["COLLABORATEUR", "MANAGER"],
      default: "COLLABORATEUR",
    },
    practice_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Practice",
      default: null,
    },
    titre:       { type: String, required: true, trim: true },
    commentaire: { type: String, trim: true, default: "" },
    nouvelle_date_proposee: { type: Date, default: null },
    point_snapshot: {
      titre:     { type: String, default: "" },
      date:      { type: Date,   default: null },
      status:    { type: String, default: "" },
      criticite: { type: String, default: "" },
    },
    status: {
      type: String,
      enum: ["PENDING", "PROCESSED", "REJECTED"],
      default: "PENDING",
    },
    reponse_hrbp: { type: String, trim: true, default: "" },
  },
  { timestamps: true, collection: "reclamations" }
);

module.exports =
  mongoose.models.Reclamation || mongoose.model("Reclamation", reclamationSchema);