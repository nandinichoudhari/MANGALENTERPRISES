require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const nodemailer = require('nodemailer');
const User = require('./models/User');
const jwt = require('jsonwebtoken');

const app = express();

/* ===========================
   MIDDLEWARE
=========================== */
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://mangalenterprises.vercel.app',
    'https://mangalenterprises.onrender.com',
    /\.vercel\.app$/   // allows any vercel preview URLs too
  ],
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());

/* ===========================
   MOUNT ROUTE FILES
=========================== */
const authRoutes = require('./routes/auth');
const orderRoutes = require('./routes/order');
const userRoutes = require('./routes/user');
const adminRoutes = require('./routes/admin');
const paymentRoutes = require('./routes/payment');

app.use('/api/auth', authRoutes);
app.use('/api', orderRoutes);
app.use('/api/user', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payment', paymentRoutes);

// Health check — visiting http://localhost:5000 shows status
app.get('/', (req, res) => {
  res.json({
    status: 'running',
    message: 'Mangal Enterprises API is running',
    frontend: 'http://localhost:3000',
    admin: 'http://localhost:3000/admin-panel'
  });
});

// Email config diagnostic (temporary — remove after fixing)
app.get('/check-email', async (req, res) => {
  try {
    const hasUser = !!process.env.EMAIL_USER;
    const hasPass = !!process.env.EMAIL_PASS;
    const passLength = (process.env.EMAIL_PASS || '').length;

    let verifyResult = 'not tested';
    try {
      await transporter.verify();
      verifyResult = 'SUCCESS — transporter is ready';
    } catch (err) {
      verifyResult = `FAILED — ${err.message}`;
    }

    res.json({
      EMAIL_USER_set: hasUser,
      EMAIL_USER_value: hasUser ? process.env.EMAIL_USER : 'NOT SET',
      EMAIL_PASS_set: hasPass,
      EMAIL_PASS_length: passLength,
      transporter_verify: verifyResult
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ===========================
   EMAIL TRANSPORTER
=========================== */
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,            // use SSL on port 465
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false
  },
  // Force IPv4 — Render's free-tier doesn't support IPv6 outbound,
  // which causes "connect ENETUNREACH" when Gmail resolves to IPv6
  family: 4
});

// Verify transporter on startup
transporter.verify()
  .then(() => console.log('✅ Email transporter ready'))
  .catch(err => console.error('❌ Email transporter ERROR:', err.message));

/* ===========================
   EMAIL OTP SEND
=========================== */
app.post('/api/send-email-otp', async (req, res) => {
  try {
    const { email, phone, name } = req.body;

    if (!email || !phone) {
      return res.status(400).json({ success: false, message: "Email and phone are required" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);

    // Find by email OR phone — avoids duplicate key on upsert
    const existing = await User.findOne({ $or: [{ phone }, { email }] });

    if (existing) {
      // Update the FOUND document by its _id (no unique-index collision possible)
      await User.updateOne(
        { _id: existing._id },
        { $set: { name: name || existing.name || '', email, phone, otp, otpExpiry, isVerified: false } }
      );
    } else {
      // Genuinely new user — create fresh document
      await User.create({ phone, email, name: name || '', otp, otpExpiry, isVerified: false });
    }

    await transporter.sendMail({
      from: `"Mangal Enterprises" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Your OTP Code — Mangal Enterprises',
      html: `
        <div style="font-family:sans-serif;max-width:400px;margin:auto;padding:24px;border:1px solid #e0cfb3;border-radius:12px;">
          <h2 style="color:#4a1e0e">Mangal Enterprises</h2>
          <p>Your one-time password is:</p>
          <h1 style="font-size:48px;color:#4a1e0e;letter-spacing:8px">${otp}</h1>
          <p style="color:#888;font-size:13px">Expires in 5 minutes. Do not share this with anyone.</p>
        </div>
      `
    });

    res.json({ success: true });

  } catch (error) {
    console.error("❌ EMAIL OTP ERROR:", error.message);
    console.error("❌ FULL ERROR:", error);
    res.status(500).json({ success: false, message: "Failed to send OTP. Check email configuration." });
  }
});

/* ===========================
   EMAIL OTP VERIFY
=========================== */
app.post('/api/verify-email-otp', async (req, res) => {
  try {
    const { phone, otp } = req.body;

    const user = await User.findOne({ phone });

    if (!user) return res.json({ success: false, message: "User not found" });

    if (String(user.otp) !== String(otp))
      return res.json({ success: false, message: "Invalid OTP" });

    if (!user.otpExpiry || new Date() > user.otpExpiry)
      return res.json({ success: false, message: "OTP expired" });

    user.isVerified = true;
    user.otp = null;
    user.otpExpiry = null;
    user.last_status = 'online';
    user.updatedAt = new Date();
    await user.save();

    const token = jwt.sign(
      { phone: user.phone },
      process.env.JWT_SECRET || "fallback_secret"
    );

    res.json({ success: true, token });

  } catch (error) {
    console.error("❌ VERIFY ERROR:", error);
    res.status(500).json({ success: false });
  }
});

/* ===========================
   UPDATE PROFILE
=========================== */
app.post('/api/update-profile', async (req, res) => {
  try {
    const { phone, name, newPhone } = req.body;
    if (!phone) return res.status(400).json({ success: false, message: 'Phone required' });

    const update = {};
    if (name) update.name = name;
    if (newPhone && newPhone !== phone) update.phone = newPhone;
    update.updatedAt = new Date();

    const result = await User.updateOne({ phone }, { $set: update });

    if (result.matchedCount === 0) {
      return res.json({ success: false, message: 'User not found' });
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Profile update error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

/* ===========================
   UPDATE ORDER STATUS (admin)
=========================== */
app.post('/api/update-order-status', async (req, res) => {
  try {
    const { orderId, status } = req.body;
    if (!orderId || !status) return res.status(400).json({ success: false, message: 'orderId and status required' });

    const validStatuses = ['confirmed', 'preparing', 'out', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    // Update in Order collection
    const Order = require('./models/Order');
    await Order.updateOne({ orderId }, { $set: { status } });

    // Also update in User.orders embedded array
    await User.updateOne(
      { 'orders.orderId': orderId },
      { $set: { 'orders.$.status': status } }
    );

    console.log('Status updated:', orderId, '->', status);
    res.json({ success: true });
  } catch (error) {
    console.error('Status update error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

/* ===========================
   SAVE ADDRESS (inline – primary active route)
=========================== */
app.post('/api/save-address', async (req, res) => {
  try {
    const { phone, name, address1, address2, city } = req.body;

    if (!phone) return res.status(400).json({ success: false, message: 'Phone is required' });

    const addressObj = {
      _id: new mongoose.Types.ObjectId(),
      name: name || '',
      phone,
      address1: address1 || '',
      address2: address2 || '',
      city: city || '',
      createdAt: new Date()
    };

    // Step 1: try to push to existing user
    const result = await User.updateOne(
      { phone },
      { $push: { addresses: addressObj } }
    );

    // Step 2: if no user found, create one with address
    if (result.matchedCount === 0) {
      await User.create({
        phone,
        name: name || 'Customer',
        isVerified: false,
        addresses: [addressObj]
      });
    }

    console.log('✅ Address saved for:', phone, '| created new user:', result.matchedCount === 0);
    res.json({ success: true, address: addressObj });

  } catch (error) {
    console.error("❌ Address error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});


/* ===========================
   GET USER ADDRESSES
=========================== */
app.get('/api/user-addresses', async (req, res) => {
  try {
    const phone = req.query.phone;
    const user = await User.findOne({ phone });

    res.json({
      success: true,
      addresses: user ? user.addresses || [] : []
    });

  } catch {
    res.json({ success: false, addresses: [] });
  }
});

/* ===========================
   GET ORDERS
=========================== */
app.get('/api/orders', async (req, res) => {
  try {
    const phone = req.query.phone;
    const user = await User.findOne({ phone });

    res.json({
      success: true,
      orders: user ? user.orders || [] : []
    });

  } catch {
    res.json({ success: false, orders: [] });
  }
});

/* ===========================
   PLACE ORDER
=========================== */
app.post('/api/place-order', async (req, res) => {
  try {
    const { userName, userPhone, userEmail, items, total, address, paymentMethod } = req.body;

    const order = {
      _id: new mongoose.Types.ObjectId(),
      orderId: `ORD${Date.now()}`,
      userName,
      userPhone,
      userEmail,
      items,
      total,
      address,
      paymentMethod,
      status: 'confirmed',
      timestamp: new Date()
    };

    // Add to user's orders array
    await User.findOneAndUpdate(
      { phone: userPhone },
      {
        $push: { orders: order },
        $setOnInsert: { phone: userPhone, isVerified: false }
      },
      { upsert: true }
    );

    // Also save to standalone Order collection (for admin)
    const Order = require('./models/Order');
    const newOrder = new Order(order);
    await newOrder.save();

    console.log('🧾 ORDER SAVED:', userPhone, 'Total: ₹' + total);
    res.json({ success: true, orderId: order.orderId });

  } catch (error) {
    console.error("❌ Order error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/* Admin data is handled by routes/admin.js */
/* ===========================
   DATABASE CONNECTION + SERVER START
   Connect to MongoDB FIRST, then start the server.
   This prevents "buffering timed out" errors where routes
   receive requests before the DB connection is ready.
=========================== */
const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI, {
  serverSelectionTimeoutMS: 15000,  // how long to wait for server selection
  socketTimeoutMS: 45000,           // how long to wait for socket operations
})
  .then(() => {
    console.log("✅ MongoDB Connected");
    console.log("📦 Connected DB:", mongoose.connection.name);

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error("❌ MongoDB Connection Failed:", err.message);
    process.exit(1); // Exit so nodemon restarts and you see the error clearly
  });
