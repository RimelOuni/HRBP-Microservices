const mongoose = require("mongoose");

const surveyResponseSchema = new mongoose.Schema(
  {
    // Interne à survey-service — reste un vrai ObjectId Mongo
    survey: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Survey",
      required: true,
    },
    // ID user-service (UUID string)
    user: {
      type: String,
      required: true,
    },
    roleAtAnswer: {
      type: String,
      default: null,
    },
    // ID practice-service (UUID string)
    practiceAtAnswer: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

surveyResponseSchema.index({ survey: 1, user: 1 }, { unique: true });

module.exports =
  mongoose.models.SurveyResponse ||
  mongoose.model("SurveyResponse", surveyResponseSchema);