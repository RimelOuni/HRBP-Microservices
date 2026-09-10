const mongoose = require("mongoose");

const badgeSchema = new mongoose.Schema(
  {
    // ID user-service (UUID string) — pas un ObjectId Mongo
    userId: {
      type: String,
      required: true,
      index: true,
    },
    // ID practice-service (UUID string) — idem
    practiceId: {
      type: String,
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

badgeSchema.index({ userId: 1, badgeId: 1 }, { unique: true });

module.exports = mongoose.models.Badge || mongoose.model("Badge", badgeSchema);