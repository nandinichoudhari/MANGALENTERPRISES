const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  // ✅ KEEP phone as-is (existing data)
  phone: { type: String, unique: true, required: true },

  // ✅ KEEP email (new field for OTP)
  email: { type: String, unique: true, sparse: true },

  // ✅ KEEP name 
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
    razorpayOrderId: String,
    razorpayPaymentId: String,
    timestamp: { type: Date, default: Date.now }
  }],

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
