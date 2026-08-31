const mongoose = require("mongoose");

const surveySchema = new mongoose.Schema(
  {
    title: { type: String, trim: true, required: true },

    googleFormUrl: { type: String, default: null },

    // Toujours COLLABORATOR
    target: {
      type: String,
      enum: ["COLLABORATOR", "MANAGER", "ALL"],
      default: "COLLABORATOR",
      required: true,
    },

    // Historique cumulatif de toutes les practices ciblées (jamais écrasé)
    practices: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Practice" }],
      default: [],
    },

    // Historique cumulatif de tous les utilisateurs spécifiquement ciblés (jamais écrasé)
    specificUserIds: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      default: [],
    },

    type: {
      type: String,
      enum: ["MONTHLY", "QUARTERLY", "ANNUAL", "ENGAGEMENT", "SATISFACTION", "PULSE"],
      required: true,
    },

    status:       { type: String, enum: ["ACTIVE", "INACTIVE"], default: "INACTIVE" },
    pointsReward: { type: Number, required: true, min: 0, default: 10 },

    // ⚠️ Ajoutés : le controller les lit/écrit (updateSurvey, updateSurveyAsManager)
    // mais ils étaient absents du schéma → écriture silencieusement ignorée en mode strict.
    startDate: { type: Date, default: null },
    endDate:   { type: Date, default: null },

    createdBy:     { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    createdByRole: { type: String, enum: ["ADMIN_RH", "MANAGER", "HRBP"], default: null },
  },
  { timestamps: true }
);

// Index utile pour buildUserFilter (status + target sont filtrés à chaque getSurveysForUser)
surveySchema.index({ status: 1, target: 1 });

module.exports = mongoose.models.Survey || mongoose.model("Survey", surveySchema);