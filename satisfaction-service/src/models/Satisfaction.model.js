const mongoose = require('mongoose');

const satisfactionSchema = new mongoose.Schema(
  {
    collaborateur: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },

    point_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Point',
      default: null
    },
    value: {
      type: Number,
      required: true
    },
    comment: {
      type: String,
      default: ''
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Satisfaction', satisfactionSchema);