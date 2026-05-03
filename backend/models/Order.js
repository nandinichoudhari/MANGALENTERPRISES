const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderId: { type: String, unique: true },
  userName: String,
  userPhone: String,
  userEmail: String,
  items: [{
    id: String,
    name: String,
    price: Number,
    quantity: Number  // ✅ Shows quantities
  }],
  total: Number,
  address: {
    name: String,
    address1: String,
    address2: String,
    city: String,
    phone: String
  },
  paymentMethod: String,
  status: { type: String, default: 'confirmed' },
  feedback: {
    rating: Number,
    comment: String,
    submittedAt: Date
  },
  offerApplied: { type: String, default: null }, // NEW: Track if 'FIRST20_OFFER' was used
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', orderSchema);
