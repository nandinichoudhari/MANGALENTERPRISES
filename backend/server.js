// MUST be FIRST — force ALL DNS lookups to IPv4 before anything else loads
const dns = require('dns');
const origLookup = dns.lookup;
dns.lookup = function (hostname, options, callback) {
  if (typeof options === 'function') { callback = options; options = {}; }
  if (typeof options === 'number') { options = { family: options }; }
  options = Object.assign({}, options, { family: 4 }); // Force IPv4
  return origLookup.call(this, hostname, options, callback);
};

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const nodemailer = require('nodemailer');
const axios = require('axios');
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

/* ===========================
   EMAIL SETUP
   Primary: Brevo HTTP API (works on Render — no SMTP needed)
   Fallback: Nodemailer Gmail SMTP (works on localhost)
=========================== */
const USE_BREVO = !!process.env.BREVO_API_KEY;
let transporter = null;

if (USE_BREVO) {
  console.log('✅ Using Brevo API for email delivery');
} else {
  transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    tls: { rejectUnauthorized: false },
    family: 4,
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 20000
  });

  transporter.verify()
    .then(() => console.log('✅ Email transporter ready (nodemailer SMTP, IPv4 forced)'))
    .catch(err => console.error('❌ Email transporter ERROR:', err.message));
}

// Helper: send email via whichever method is configured
async function sendEmail({ to, subject, html }) {
  if (USE_BREVO) {
    const senderEmail = process.env.BREVO_SENDER_EMAIL || process.env.EMAIL_USER;
    const senderName = process.env.BREVO_SENDER_NAME || 'Mangal Enterprises';

    try {
      const response = await axios.post('https://api.brevo.com/v3/smtp/email', {
        sender: { name: senderName, email: senderEmail },
        to: [{ email: to }],
        subject: subject,
        htmlContent: html
      }, {
        headers: {
          'api-key': process.env.BREVO_API_KEY,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (err) {
      // Brevo returns error details in err.response.data
      const brevoError = err.response?.data || err.message;
      console.error('❌ BREVO API ERROR:', JSON.stringify(brevoError));
      throw new Error(JSON.stringify(brevoError));
    }
  } else {
    return transporter.sendMail({
      from: `"Mangal Enterprises" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html
    });
  }
}

// Diagnostic endpoint
app.get('/check-email', async (req, res) => {
  try {
    if (USE_BREVO) {
      res.json({
        method: 'Brevo HTTP API',
        BREVO_API_KEY_set: true,
        sender_email: process.env.BREVO_SENDER_EMAIL || process.env.EMAIL_USER,
        status: 'ready'
      });
    } else {
      let dnsResult = 'not tested';
      try {
        const addr = await new Promise((resolve, reject) => {
          dns.lookup('smtp.gmail.com', { family: 4 }, (err, address) => {
            if (err) reject(err); else resolve(address);
          });
        });
        dnsResult = `IPv4: ${addr}`;
      } catch (e) { dnsResult = `FAILED: ${e.message}`; }

      let verifyResult = 'not tested';
      try {
        await transporter.verify();
        verifyResult = 'SUCCESS';
      } catch (e) { verifyResult = `FAILED: ${e.message}`; }

      res.json({
        method: 'nodemailer SMTP + forced IPv4',
        EMAIL_USER: process.env.EMAIL_USER || 'NOT SET',
        EMAIL_PASS_set: !!(process.env.EMAIL_PASS),
        dns_lookup: dnsResult,
        transporter: verifyResult
      });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Test endpoint — send a test email to see if Brevo works
app.get('/test-email', async (req, res) => {
  const testTo = req.query.to || process.env.BREVO_SENDER_EMAIL || process.env.EMAIL_USER;
  try {
    const result = await sendEmail({
      to: testTo,
      subject: 'Test Email — Mangal Enterprises',
      html: '<h1>It works!</h1><p>Brevo email is configured correctly.</p>'
    });
    res.json({ success: true, sentTo: testTo, result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

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

    await sendEmail({
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

    console.log("✅ OTP email sent to:", email);
    res.json({ success: true });

  } catch (error) {
    console.error("❌ EMAIL OTP ERROR:", error.message);
    res.status(500).json({ success: false, message: "Failed to send OTP: " + error.message });
  }
});

/* ===========================
   EMAIL OTP VERIFY
=========================== */
app.post('/api/verify-email-otp', async (req, res) => {
  try {
    const { phone, email, otp } = req.body;

    console.log('🔍 VERIFY REQUEST:', { phone, email, otp });

    // Find user by phone OR email (same logic as send endpoint)
    const user = await User.findOne({ $or: [{ phone }, { email }] });

    if (!user) {
      console.log('❌ No user found for phone:', phone, 'or email:', email);
      return res.json({ success: false, message: "User not found" });
    }

    console.log('🔍 Found user, stored OTP:', user.otp, '| received OTP:', otp);

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
