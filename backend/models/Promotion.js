const mongoose = require('mongoose');

const promotionSchema = new mongoose.Schema({
  code: { type: String, unique: true, required: true },
  description: String,
  discountPercentage: { type: Number, default: 0 },
  maxUsage: { type: Number, default: 0 },
  currentUsage: { type: Number, default: 0 },
  startTime: { type: Date, required: true },
  isActive: { type: Boolean, default: true },
  users: [{ type: String }] // Store user identifiers (email or phone) who used it
});

module.exports = mongoose.model('Promotion', promotionSchema);
