const mongoose = require("mongoose");
const crypto = require("crypto");

const practiceSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: () => crypto.randomUUID(),
  },
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
    enum: ["ACTIVE", "INACTIVE"],
    default: "ACTIVE",
  },
  creationDate: {
    type: Date,
    default: Date.now,
  },
  hrbp: {
    type: [String],
    default: [],
  },
  manager: {
    type: String,
    default: null,
  },
});

module.exports = mongoose.models.Practice || mongoose.model("Practice", practiceSchema);