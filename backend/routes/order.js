const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = require('../models/User'); // Your User model

// 🔥 REPLACE YOUR /place-order route with this:
router.post('/place-order', async (req, res) => {
  try {
    const { userName, userPhone, userEmail, items, total, address, paymentMethod } = req.body;

    console.log('📦 place-order received:');
    console.log('   phone:', userPhone);
    console.log('   address:', JSON.stringify(address));
    console.log('   paymentMethod:', paymentMethod);
    console.log('   items:', items?.length, 'items, total ₹' + total);

    // ✅ COMPLETE ORDER with ALL data (matches frontend Payment.js)
    const order = {
      _id: new mongoose.Types.ObjectId(),
      orderId: `ORD${Date.now()}`,
      userName,
      userPhone,
      userEmail,
      items,           // ✅ Contains name, price, quantity
      total,
      address: address || {},  // full address object
      paymentMethod: paymentMethod || 'COD',
      status: 'confirmed',
      timestamp: new Date()
    };

    // 🔥 1. ADD to USER'S orders array (existing users see their orders)
    const userResult = await User.updateOne(
      { phone: userPhone },
      { $push: { orders: order } }
    );

    // 🔥 2. ALSO SAVE to SEPARATE Orders collection (admin panel)
    const Order = require('../models/Order');
    const newOrder = new Order(order);
    await newOrder.save();

    console.log('🧾 ORDER SAVED:', userPhone, 'Total: ₹' + total, 'User updated:', !!userResult.modifiedCount);
    res.json({ success: true, orderId: order.orderId });
  } catch (error) {
    console.error('🚨 ORDER ERROR:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 🔥 NEW: ADMIN GET ALL ORDERS
router.get('/allorders', async (req, res) => {
  try {
    const Order = require('../models/Order');
    const orders = await Order.find({}).sort({ timestamp: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 🔥 NEW: USER GET MY ORDERS
router.get('/myorders', async (req, res) => {
  try {
    const { phone } = req.query;
    const Order = require('../models/Order');
    const orders = await Order.find({ userPhone: phone }).sort({ timestamp: -1 });
    res.json({ orders });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
