const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = require('../models/User'); 
const Order = require('../models/Order');
const Promotion = require('../models/Promotion');

// 🔥 REPLACE YOUR /place-order route with this:
// 🔥 NEW: CHECK OFFER ELIGIBILITY
router.get('/check-offer-eligibility', async (req, res) => {
  try {
    const { email, phone } = req.query;
    if (!email && !phone) return res.json({ eligible: false, reason: 'Missing identifier' });

    // 1. Check if offer exists and is active
    const offer = await Promotion.findOne({ code: 'FIRST20_OFFER', isActive: true });
    if (!offer) return res.json({ eligible: false, reason: 'Offer not found or inactive' });

    // 2. Check if start time has passed
    if (new Date() < offer.startTime) {
      return res.json({ eligible: false, reason: 'Offer hasn\'t started yet', startTime: offer.startTime });
    }

    // 3. Check if limit reached
    if (offer.currentUsage >= offer.maxUsage) {
      return res.json({ eligible: false, reason: 'Offer limit reached' });
    }

    // 4. Check if user is first-time customer
    const query = [];
    if (email) query.push({ userEmail: email });
    if (phone) query.push({ userPhone: phone });
    
    const existingOrdersCount = await Order.countDocuments({ $or: query });
    if (existingOrdersCount > 0) {
      return res.json({ eligible: false, reason: 'Only for first-time customers' });
    }

    res.json({ 
      eligible: true, 
      discountPercentage: offer.discountPercentage,
      description: offer.description
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 🔥 REPLACE YOUR /place-order route with this:
router.post('/place-order', async (req, res) => {
  try {
    const { userName, userPhone, userEmail, items, total, address, paymentMethod, applyOffer } = req.body;

    let finalTotal = total;
    let offerApplied = null;

    // ✅ CHECK OFFER IF REQUESTED
    if (applyOffer) {
      const offer = await Promotion.findOne({ code: 'FIRST20_OFFER', isActive: true });
      if (offer && new Date() >= offer.startTime && offer.currentUsage < offer.maxUsage) {
        // Double check first order
        const query = [];
        if (userEmail) query.push({ userEmail });
        if (userPhone) query.push({ userPhone });
        const existingOrdersCount = await Order.countDocuments({ $or: query });
        
        if (existingOrdersCount === 0) {
          offerApplied = 'FIRST20_OFFER';
          
          // Increment usage
          await Promotion.updateOne(
            { code: 'FIRST20_OFFER' },
            { 
              $inc: { currentUsage: 1 },
              $push: { users: userEmail || userPhone }
            }
          );
        }
      }
    }

    const order = {
      _id: new mongoose.Types.ObjectId(),
      orderId: `ORD${Date.now()}`,
      userName,
      userPhone,
      userEmail,
      items,
      total: finalTotal,
      address: address || {},
      paymentMethod: paymentMethod || 'COD',
      status: 'confirmed',
      offerApplied,
      timestamp: new Date()
    };

    // 🔥 1. ADD to USER'S orders array
    const userQuery = userEmail ? { email: userEmail } : { phone: userPhone };
    await User.updateOne(
      userQuery,
      { 
        $push: { orders: order },
        $setOnInsert: { email: userEmail, phone: userPhone, name: userName || 'Customer' }
      },
      { upsert: true }
    );

    // 🔥 2. ALSO SAVE to SEPARATE Orders collection
    const newOrder = new Order(order);
    await newOrder.save();

    res.json({ success: true, orderId: order.orderId, finalTotal, offerApplied });
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
    const { phone, email } = req.query;
    const Order = require('../models/Order');
    const query = [];
    if (email) query.push({ userEmail: email });
    if (phone) query.push({ userPhone: phone });

    if (query.length === 0) return res.json({ orders: [] });

    const orders = await Order.find({ $or: query }).sort({ timestamp: -1 });
    res.json({ orders });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 🔥 NEW: SUBMIT FEEDBACK
router.post('/submit-feedback', async (req, res) => {
  try {
    const { orderId, rating, comment } = req.body;
    if (!orderId || !rating) return res.status(400).json({ success: false, message: 'Missing orderId or rating' });

    const Order = require('../models/Order');
    const feedback = { rating, comment, submittedAt: new Date() };

    await Order.updateOne({ orderId }, { $set: { feedback } });
    await User.updateOne(
      { 'orders.orderId': orderId },
      { $set: { 'orders.$.feedback': feedback } }
    );

    res.json({ success: true, message: 'Feedback submitted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
