const express = require('express');
const User = require('../models/User');
const router = express.Router();

router.post('/save-address', async (req, res) => {
  try {
    const { phone, address } = req.body;
    const user = await User.findOne({ phone });
    
    if (!user) return res.json({ success: false, message: 'User not found' });
    
    if (user.addresses.length === 0) {
      address.isDefault = true;
    }
    
    user.addresses.push(address);
    await user.save();
    
    res.json({ success: true, addresses: user.addresses });
  } catch (error) {
    res.status(500).json({ success: false });
  }
});

router.get('/addresses/:phone', async (req, res) => {
  try {
    const user = await User.findOne({ phone: req.params.phone });
    res.json({ success: true, addresses: user?.addresses || [] });
  } catch (error) {
    res.status(500).json({ success: false });
  }
});

module.exports = router;
