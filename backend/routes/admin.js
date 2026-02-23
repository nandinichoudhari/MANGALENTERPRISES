const express = require('express');
const User = require('../models/User');
const Order = require('../models/Order');
const router = express.Router();

// GET /api/admin/data — orders + customers for admin panel
router.get('/data', async (req, res) => {
  try {
    // Read from the dedicated Order collection (has full address, paymentMethod, items)
    const allOrders = await Order.find({}).sort({ timestamp: -1 }).lean();

    // Build order count per phone
    const orderCountByPhone = {};
    allOrders.forEach(o => {
      const p = o.userPhone || '';
      orderCountByPhone[p] = (orderCountByPhone[p] || 0) + 1;
    });

    // Read ALL users (not just online ones)
    const users = await User.find({}).lean();

    const customers = users.map(u => ({
      name: u.name || 'Unknown',
      phone: u.phone || '',
      email: u.email || '',
      isVerified: u.isVerified || false,
      last_status: u.last_status || 'offline',
      updatedAt: u.updatedAt || u.createdAt || null,
      orderCount: orderCountByPhone[u.phone] || 0,
      addressCount: (u.addresses || []).length
    }));

    res.json({ orders: allOrders, logins: customers });
  } catch (error) {
    console.error('❌ Admin data error:', error.message);
    res.status(500).json({ orders: [], logins: [], error: error.message });
  }
});

module.exports = router;
