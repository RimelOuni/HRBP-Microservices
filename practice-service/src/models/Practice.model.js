const mongoose = require("mongoose");

const practiceSchema = new mongoose.Schema({
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
  hrbp: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  manager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
});

module.exports = mongoose.model("Practice", practiceSchema);
