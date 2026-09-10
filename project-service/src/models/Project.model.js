const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE", "ON_HOLD", "COMPLETED"],
      default: "ACTIVE",
    },
    // Practice vit dans practice-service (Mongo, _id = UUID string) — pas une ref Mongoose locale
    practice_id: {
      type: String,
      required: true,
    },
    // Manager vit dans user-service (Postgres, id = UUID) — idem
    manager: {
      type: String,
      default: null,
    },
    startDate: {
      type: Date,
      default: null,
    },
    endDate: {
      type: Date,
      default: null,
    },
    creationDate: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Project || mongoose.model("Project", projectSchema);