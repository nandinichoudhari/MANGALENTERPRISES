const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const Razorpay = require('razorpay');
const mongoose = require('mongoose');
const User = require('../models/User');
const Order = require('../models/Order');

/* ========================================
   RAZORPAY INSTANCE (Test Mode)
   ========================================
   Uses test keys from .env — no real money
   is charged. Use Razorpay's test card:
     Card: 4111 1111 1111 1111
     Expiry: Any future date
     CVV: Any 3 digits
     OTP: Any valid OTP (or skip in test)
   ======================================== */
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/* ========================================
   POST /api/payment/create-order
   Creates a Razorpay order (Test Mode)
   ======================================== */
router.post('/create-order', async (req, res) => {
    try {
        const { amount, currency = 'INR', receipt } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({ success: false, message: 'Valid amount is required' });
        }

        const options = {
            amount: Math.round(amount * 100), // Razorpay expects amount in paise
            currency,
            receipt: receipt || `receipt_${Date.now()}`,
            payment_capture: 1, // Auto-capture payment
        };

        const order = await razorpay.orders.create(options);

        console.log('💳 Razorpay Order Created:', order.id, '| ₹' + amount);

        res.json({
            success: true,
            order: {
                id: order.id,
                amount: order.amount,
                currency: order.currency,
            },
            key: process.env.RAZORPAY_KEY_ID, // Send key to frontend for checkout
        });
    } catch (error) {
        console.error('❌ Razorpay create-order error:', error);
        res.status(500).json({ success: false, message: error.message || 'Failed to create Razorpay order' });
    }
});

/* ========================================
   POST /api/payment/verify
   Verifies the Razorpay payment signature
   and places the order in the database.
   ======================================== */
router.post('/verify', async (req, res) => {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            orderDetails, // { userName, userPhone, userEmail, items, total, address }
        } = req.body;

        // Step 1: Verify the signature
        const body = razorpay_order_id + '|' + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body)
            .digest('hex');

        const isAuthentic = expectedSignature === razorpay_signature;

        if (!isAuthentic) {
            console.warn('⚠️ Razorpay signature mismatch!');
            return res.status(400).json({ success: false, message: 'Payment verification failed — signature mismatch' });
        }

        // Step 2: Signature is valid — save the order
        const order = {
            _id: new mongoose.Types.ObjectId(),
            orderId: `ORD${Date.now()}`,
            userName: orderDetails.userName,
            userPhone: orderDetails.userPhone,
            userEmail: orderDetails.userEmail,
            items: orderDetails.items,
            total: orderDetails.total,
            address: orderDetails.address,
            paymentMethod: 'razorpay',
            razorpayOrderId: razorpay_order_id,
            razorpayPaymentId: razorpay_payment_id,
            status: 'confirmed',
            timestamp: new Date(),
        };

        // Save to user's orders array
        await User.findOneAndUpdate(
            { phone: orderDetails.userPhone },
            {
                $push: { orders: order },
                $setOnInsert: { phone: orderDetails.userPhone, isVerified: false },
            },
            { upsert: true }
        );

        // Save to standalone Order collection (for admin)
        const newOrder = new Order(order);
        await newOrder.save();

        console.log('✅ Razorpay Payment Verified & Order Saved:', order.orderId, '| Payment:', razorpay_payment_id);

        res.json({
            success: true,
            orderId: order.orderId,
            paymentId: razorpay_payment_id,
        });
    } catch (error) {
        console.error('❌ Razorpay verify error:', error);
        res.status(500).json({ success: false, message: error.message || 'Payment verification failed' });
    }
});

module.exports = router;
