const mongoose = require("mongoose");

const surveySchema = new mongoose.Schema(
  {
    title: { type: String, trim: true, required: true },

    googleFormUrl: { type: String, default: null },

    target: {
      type: String,
      enum: ["COLLABORATOR", "MANAGER", "ALL"],
      default: "COLLABORATOR",
      required: true,
    },

    // IDs practice-service (UUID string) — plus des ObjectId Mongo
    practices: {
      type: [String],
      default: [],
    },

    // IDs user-service (UUID string) — plus des ObjectId Mongo
    specificUserIds: {
      type: [String],
      default: [],
    },

    type: {
      type: String,
      enum: ["MONTHLY", "QUARTERLY", "ANNUAL", "ENGAGEMENT", "SATISFACTION", "PULSE"],
      required: true,
    },

    status:       { type: String, enum: ["ACTIVE", "INACTIVE"], default: "INACTIVE" },
    pointsReward: { type: Number, required: true, min: 0, default: 10 },

    startDate: { type: Date, default: null },
    endDate:   { type: Date, default: null },

    // ID user-service (UUID string)
    createdBy:     { type: String, default: null },
    createdByRole: { type: String, enum: ["ADMIN_RH", "MANAGER", "HRBP"], default: null },
  },
  { timestamps: true }
);

surveySchema.index({ status: 1, target: 1 });

module.exports = mongoose.models.Survey || mongoose.model("Survey", surveySchema);