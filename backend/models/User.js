const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
}, { timestamps: true });

// Use 'splitgeo_users' to avoid colliding with the existing 'users' collection
// in the shared DB that has a unique index on 'username'
module.exports = mongoose.model('User', userSchema, 'splitgeo_users');
