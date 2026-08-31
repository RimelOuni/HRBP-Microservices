const mongoose = require("mongoose");

const surveyResponseSchema = new mongoose.Schema(
  {
    survey: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Survey",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    roleAtAnswer: {
      type: String,
      default: null,
    },
    practiceAtAnswer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Practice",
      default: null,
    },
  },
  { timestamps: true }
);

// Un user ne peut répondre qu'une fois au même sondage
surveyResponseSchema.index({ survey: 1, user: 1 }, { unique: true });

module.exports =
  mongoose.models.SurveyResponse ||
  mongoose.model("SurveyResponse", surveyResponseSchema);