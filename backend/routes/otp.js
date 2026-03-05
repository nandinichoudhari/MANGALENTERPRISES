const express = require('express');
const router = express.Router();
const { Resend } = require('resend');
const Otp = require('../models/Otp');
require('dotenv').config();

const resend = new Resend(process.env.RESEND_API_KEY);

router.post('/send-email-otp', async (req, res) => {
  try {
    const { email } = req.body;

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Delete old OTPs
    await Otp.deleteMany({ email });

    // Save new OTP (5 min expiry)
    await Otp.create({
      email,
      otp,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000)
    });

    // Send email via Resend (HTTP API — works on Render)
    await resend.emails.send({
      from: process.env.EMAIL_FROM || 'Mangal Enterprises <onboarding@resend.dev>',
      to: email,
      subject: '🛒 Mangal Enterprises - Email Verification',
      html: `
        <div style="font-family: Arial; max-width: 500px; margin: 0 auto;">
          <h2>Verify Your Email</h2>
          <div style="background: linear-gradient(45deg, #28a745, #20c997); 
                      color: white; padding: 30px; text-align: center; 
                      font-size: 32px; font-weight: bold; 
                      letter-spacing: 8px; border-radius: 10px;">
            ${otp}
          </div>
          <p style="margin-top: 20px;">This code expires in 5 minutes.</p>
          <hr>
          <p><strong>Mangal Enterprises</strong></p>
        </div>
      `
    });

    console.log('📧 OTP sent to:', email);
    res.json({ success: true, message: 'OTP sent successfully!' });
  } catch (error) {
    console.error('❌ Email error:', error);
    res.status(500).json({ success: false, message: 'Failed to send OTP' });
  }
});

router.post('/verify-email-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    const otpRecord = await Otp.findOne({
      email,
      otp,
      expiresAt: { $gt: new Date() }
    });

    if (!otpRecord) {
      return res.json({ success: false, message: 'Invalid or expired OTP' });
    }

    // Delete used OTP
    await Otp.deleteOne({ _id: otpRecord._id });

    res.json({
      success: true,
      message: 'Email verified successfully!',
      user: { email }
    });
  } catch (error) {
    console.error('❌ Verify error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
