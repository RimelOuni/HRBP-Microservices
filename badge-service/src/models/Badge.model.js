const mongoose = require("mongoose");

const badgeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    practiceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Practice",
      default: null,
    },
    badgeId:               { type: String,   required: true },
    name:                  { type: String,   required: true },
    description:           { type: String,   default: "" },
    icon:                  { type: String,   default: "🏅" },
    color:                 { type: String,   default: "#16a34a" },
    gradient:              { type: [String], default: [] },
    surveysRequired:       { type: Number,   required: true },
    surveysAnsweredAtEarn: { type: Number,   default: 0 },
    pointsAtEarn:          { type: Number,   default: 0 },
    earnedAt:              { type: Date,     default: Date.now },
  },
  { timestamps: true }
);

// Prevent same user earning same badge twice
badgeSchema.index({ userId: 1, badgeId: 1 }, { unique: true });

module.exports = mongoose.models.Badge || mongoose.model("Badge", badgeSchema);
