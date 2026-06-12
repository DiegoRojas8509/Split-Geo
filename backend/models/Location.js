const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  type: { type: String, enum: ['point', 'zone'], default: 'point' },
  lat: { type: Number },
  lng: { type: Number },
  coordinates: [[Number]],
  group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
  linkedExpense: { type: mongoose.Schema.Types.ObjectId, ref: 'Expense' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

module.exports = mongoose.model('Location', locationSchema);
