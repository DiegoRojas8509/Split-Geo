const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

module.exports = mongoose.model('Trip', tripSchema);
