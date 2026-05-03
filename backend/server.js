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
const { Resend } = require('resend');
const axios = require('axios');
const User = require('./models/User');
const jwt = require('jsonwebtoken');
const Promotion = require('./models/Promotion');

const app = express();

/* ===========================
   MIDDLEWARE
=========================== */
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://mangalenterprises.vercel.app',
    'https://mangalenterprises.onrender.com',
    'https://mangalenterprise.com',
    'https://www.mangalenterprise.com',
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
   EMAIL SETUP — Resend
   Clean API-based email (no SMTP needed)
=========================== */
const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'noreply@mangalenterprise.com';

console.log(`📧 Email configured via Resend (from: ${FROM_EMAIL})`);

// Helper: send email via Resend API
async function sendEmail({ to, subject, html }) {
  const { data, error } = await resend.emails.send({
    from: `Mangal Enterprises <${FROM_EMAIL}>`,
    to: [to],
    subject,
    html
  });

  if (error) {
    console.error('❌ Resend error:', error);
    throw new Error(error.message || 'Failed to send email via Resend');
  }

  console.log('✅ Email sent via Resend, id:', data?.id);
  return data;
}

// Diagnostic endpoint
app.get('/check-email', async (req, res) => {
  try {
    const key = process.env.RESEND_API_KEY || '';
    const keyPreview = key.length > 12
      ? key.substring(0, 8) + '...' + key.substring(key.length - 4)
      : 'NOT SET';

    res.json({
      method: 'Resend API',
      RESEND_API_KEY_set: !!process.env.RESEND_API_KEY,
      key_preview: keyPreview,
      from_email: FROM_EMAIL,
      status: process.env.RESEND_API_KEY ? 'ready' : 'missing API key'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Test endpoint — send a test email via Resend
app.get('/test-email', async (req, res) => {
  const testTo = req.query.to || process.env.EMAIL_USER;
  try {
    const result = await sendEmail({
      to: testTo,
      subject: 'Test Email — Mangal Enterprises',
      html: '<h1>It works!</h1><p>Resend email is configured correctly.</p>'
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
    const { email, name } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);

    // Find exclusively by email since it's the primary discriminator
    const existing = await User.findOne({ email });

    if (existing) {
      // Update the FOUND document by its _id
      await User.updateOne(
        { _id: existing._id },
        { $set: { name: name || existing.name || '', otp, otpExpiry, isVerified: false } }
      );
    } else {
      // Genuinely new user from email — create fresh document
      await User.create({ email, name: name || '', otp, otpExpiry, isVerified: false });
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
    const { email, otp } = req.body;

    console.log('🔍 VERIFY REQUEST:', { email, otp });

    // Find exclusively by email
    const user = await User.findOne({ email });

    if (!user) {
      console.log('❌ No user found for email:', email);
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
      { email: user.email },
      process.env.JWT_SECRET || "fallback_secret"
    );

    // Return the user data so frontend can properly populate local state
    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone || '',
        email: user.email
      }
    });

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
    const { email, phone, name, address1, address2, city } = req.body;

    if (!email && !phone) return res.status(400).json({ success: false, message: 'Email or phone is required' });

    const addressObj = {
      _id: new mongoose.Types.ObjectId(),
      name: name || '',
      phone: phone || '',
      address1: address1 || '',
      address2: address2 || '',
      city: city || '',
      createdAt: new Date()
    };

    // Use email if present, fallback to phone
    const query = email ? { email } : { phone };

    await User.findOneAndUpdate(
      query,
      {
        $push: { addresses: addressObj },
        $setOnInsert: { email, phone, name: name || 'Customer', isVerified: false }
      },
      { upsert: true, new: true }
    );

    console.log('✅ Address saved for:', email || phone);
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
    const { phone, email } = req.query;
    const query = email ? { email } : { phone };
    const user = await User.findOne(query);

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
app.get(['/api/orders', '/api/myorders'], async (req, res) => {
  try {
    const { phone, email } = req.query;
    const query = email ? { email } : { phone };
    const user = await User.findOne(query);

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

    // ✅ CLEANUP: Drop old phone index if it's causing duplicate null errors
    // Mongoose will recreate it as 'sparse' based on the User model
    User.collection.dropIndex('phone_1').then(() => {
      console.log("🧹 Dropped old phone index to fix duplicate nulls");
    }).catch(() => {
      // Index might not exist or already be correct
    });

    // ✅ INITIALIZE FIRST 20 CUSTOMERS OFFER
    const initOffer = async () => {
      try {
        const startTime = new Date('2026-05-03T20:30:00+05:30'); // 8:30 PM IST
        const existing = await Promotion.findOne({ code: 'FIRST20_OFFER' });
        if (!existing) {
          await Promotion.create({
            code: 'FIRST20_OFFER',
            description: 'Flat 50% Off on your 1st order! (First 20 customers only)',
            discountPercentage: 50,
            maxUsage: 20,
            currentUsage: 0,
            startTime: startTime,
            isActive: true
          });
          console.log('🎁 FIRST20_OFFER initialized in DB');
        } else {
          // Ensure start time is correct if it already exists but we want to update it
          // Only update if it hasn't been used yet or if you want to force it
          // await Promotion.updateOne({ code: 'FIRST20_OFFER' }, { startTime });
        }
      } catch (err) {
        console.error('❌ Failed to init offer:', err.message);
      }
    };
    initOffer();

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error("❌ MongoDB Connection Failed:", err.message);
    process.exit(1); // Exit so nodemon restarts and you see the error clearly
  });
