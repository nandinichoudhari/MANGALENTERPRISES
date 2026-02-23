const express = require('express');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const router = express.Router();

// Send OTP - NOW HANDLES name + phone + email
router.post('/send-otp', async (req, res) => {
  try {
    const { name, phone, email } = req.body;  // ← NEW: All 3 fields
    
    if (!name || !phone || !email) {
      return res.status(400).json({ 
        success: false, 
        error: 'Name, phone, and email required' 
      });
    }
    
    if (phone.length !== 10) {
      return res.status(400).json({ 
        success: false, 
        error: 'Phone must be 10 digits' 
      });
    }
    
    const otp = Math.floor(1000 + Math.random() * 9000);
    
    console.log(`🔄 SAVING name: ${name}, phone: ${phone}, email: ${email}, otp: ${otp}`);
    
    const user = await User.findOneAndUpdate(
      { email },  // ← Use email as unique identifier
      { 
        name,      // ← NEW
        phone,     // ← NEW
        email,     // ← NEW
        otp: otp.toString(),
        otpExpiry: new Date(Date.now() + 15 * 60 * 1000), // 15 min
        last_status: 'otp_sent',
        updatedAt: new Date()
      },
      { upsert: true, new: true }
    );
    
    console.log(`✅ SAVED user:`, user);
    console.log(`📧 OTP for ${email} (${phone}): ${otp}`);  // ← Email OTP ready
    
    res.json({ 
      success: true, 
      message: 'OTP ready!', 
      testOtp: otp  // ← TEMP: Remove after email works
    });
  } catch (error) {
    console.error('❌ Send OTP error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Verify OTP - NOW HANDLES name + phone + email
router.post('/verify-otp', async (req, res) => {
  try {
    const { name, phone, email, otp } = req.body;  // ← NEW: All 3 fields
    
    // 🔍 DEBUG LOGS
    console.log('🔍 VERIFY REQUEST:', { name, phone, email, otp });
    
    // Find by email (unique)
    const user = await User.findOne({ 
      email, 
      otp,
      otpExpiry: { $gt: new Date() } 
    });
    
    console.log('🔍 EXACT MATCH user:', user);
    
    if (!user) {
      // Debug: Show all users with this email
      const allUsers = await User.find({ email });
      console.log('🔍 ALL USERS with email:', allUsers.length);
      return res.json({ success: false, message: 'Invalid/expired OTP' });
    }
    
    // Clear OTP & update status
    user.otp = undefined;
    user.otpExpiry = undefined;
    user.last_status = 'online';
    user.isVerified = true;
    await user.save();

    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET || 'mangal-secret-2026',
      { expiresIn: '7d' }
    );

    console.log('✅ Login success for:', email, phone, name);

    res.json({
      success: true,
      user: { 
        id: user._id, 
        name: user.name, 
        phone: user.phone, 
        email: user.email 
      },
      token
    });
  } catch (error) {
    console.error('❌ Verify OTP error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
