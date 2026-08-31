const mongoose = require("mongoose");

const pointRequestSchema = new mongoose.Schema(
  {
    requester: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    requester_type: {
      type: String,
      enum: ["COLLABORATEUR", "MANAGER"],
      default: "COLLABORATEUR",
    },
    practice_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Practice",
      default: null,
    },
    titre:          { type: String, required: true, trim: true },
    commentaire:    { type: String, trim: true, default: "" },
    date_souhaitee: { type: Date, required: true },
    status: {
      type: String,
      enum: ["PENDING", "PROCESSED", "REJECTED"],
      default: "PENDING",
    },
  },
  { timestamps: true, collection: "point_requests" }
);

module.exports =
  mongoose.models.PointRequest || mongoose.model("PointRequest", pointRequestSchema);