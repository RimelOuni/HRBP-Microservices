const mongoose = require("mongoose");

const moodSchema = new mongoose.Schema(
  {
    collaborateur: {
      type: String,
      required: true,
    },
    mood: {
      type: String,
      enum: ["Neutre", "Motivé", "Démotivé", "Épanoui"],
      required: true,
    },
    comment: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Mood || mongoose.model("Mood", moodSchema);