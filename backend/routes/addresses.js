const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = require('../models/User');

router.post('/save-address', async (req, res) => {
  try {
    const { name, phone, address1, address2, city } = req.body;

    const address = {
      _id: new mongoose.Types.ObjectId(),
      name, phone, address1, address2, city,
      createdAt: new Date()
    };

    // ADD to user's addresses array
    await User.updateOne(
      { phone },
      { $push: { addresses: address } }
    );

    console.log('📍 ADDRESS SAVED:', phone);
    res.json({ success: true, address });
  } catch (error) {
    console.error('❌ Save address error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
