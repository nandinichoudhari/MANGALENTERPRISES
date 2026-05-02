const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  // Phone is now optional, email is primary
  phone: { type: String, unique: true, sparse: true },

  // Email is now the primary unique identifier
  email: { type: String, unique: true, required: true },

  // Name
  name: String,

  // ✅ NEW: ADDRESSES ARRAY
  addresses: [{
    name: String,
    phone: String,
    address1: String,
    address2: { type: String, default: '' },
    city: String,
    createdAt: { type: Date, default: Date.now }
  }],

  otp: String,
  otpExpiry: Date,
  last_status: { type: String, default: 'offline' },
  isVerified: { type: Boolean, default: false },

  orders: [{
    orderId: String,
    userName: String,
    userPhone: String,
    userEmail: String,
    items: [{ name: String, price: Number, qty: Number, quantity: Number, emoji: String }],
    total: Number,
    address: {
      name: String,
      phone: String,
      address1: String,
      address2: String,
      city: String
    },
    paymentMethod: String,
    status: { type: String, default: 'confirmed' },
    feedback: {
      rating: Number,
      comment: String,
      submittedAt: Date
    },
    razorpayOrderId: String,
    razorpayPaymentId: String,
    timestamp: { type: Date, default: Date.now }
  }],

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
