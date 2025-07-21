const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  wallet: { type: String, required: true, unique: true },
  twitter: String,
  telegram: String,
  discord: String,
  referredBy: String,
  referrals: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
