const mongoose = require("mongoose");

const satisfactionSchema = new mongoose.Schema(
  {
    // ID user-service (UUID string) — pas un ObjectId Mongo
    collaborateur: {
      type: String,
      required: true,
      index: true,
    },
    point_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Point",
      default: null,
    },
    value: {
      type: Number,
      required: true,
    },
    comment: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.Satisfaction || mongoose.model("Satisfaction", satisfactionSchema);