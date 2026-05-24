const express = require('express');
const User = require('../models/User');
const Order = require('../models/Order');
const Subscription = require('../models/Subscription');
const router = express.Router();

// GET /api/admin/data — orders + customers for admin panel
router.get('/data', async (req, res) => {
  try {
    // Read ALL orders from the dedicated Order collection (no date filter)
    const allOrders = await Order.find({}).sort({ timestamp: -1 }).lean();

    // Build stats per phone from ALL orders
    const statsByPhone = {};
    allOrders.forEach(o => {
      const p = o.userPhone || '';
      if (!statsByPhone[p]) {
        statsByPhone[p] = { orderCount: 0, totalSpent: 0, lastOrder: null };
      }
      statsByPhone[p].orderCount += 1;
      statsByPhone[p].totalSpent += (o.total || 0);
      if (o.timestamp && (!statsByPhone[p].lastOrder || new Date(o.timestamp) > new Date(statsByPhone[p].lastOrder))) {
        statsByPhone[p].lastOrder = o.timestamp;
      }
    });

    // Read ALL registered users (no filter)
    const users = await User.find({}).lean();

    const customers = users.map(u => {
      const stats = statsByPhone[u.phone] || { orderCount: 0, totalSpent: 0, lastOrder: null };
      return {
        name: u.name || 'Unknown',
        phone: u.phone || '',
        email: u.email || '',
        isVerified: u.isVerified || false,
        last_status: u.last_status || 'offline',
        updatedAt: u.updatedAt || u.createdAt || null,
        orderCount: stats.orderCount,
        totalSpent: stats.totalSpent,
        lastOrder: stats.lastOrder,
        addressCount: (u.addresses || []).length,
      };
    });

    res.json({ orders: allOrders, logins: customers });
  } catch (error) {
    console.error('❌ Admin data error:', error.message);
    res.status(500).json({ orders: [], logins: [], error: error.message });
  }
});

// GET /api/admin/vapid-public-key — expose public VAPID key
router.get('/vapid-public-key', (req, res) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY || 'BLhjE6JTljVAHe6E4nM1wGAXT95C1vIXbZUtnMzVIEbgM20FGuHa_WCHGqAgb_exYBaC3329XkpV-PCeuo44XdA' });
});

// POST /api/admin/subscribe — store a new subscription
router.post('/subscribe', async (req, res) => {
  try {
    const { endpoint, keys } = req.body;
    if (!endpoint || !keys || !keys.p256dh || !keys.auth) {
      return res.status(400).json({ success: false, message: 'Invalid subscription object' });
    }

    // Upsert the subscription so we don't save duplicates
    await Subscription.findOneAndUpdate(
      { endpoint },
      { endpoint, keys, createdAt: new Date() },
      { upsert: true, new: true }
    );

    console.log('🔔 New admin push subscription registered!');
    res.json({ success: true, message: 'Subscription saved successfully' });
  } catch (error) {
    console.error('❌ Subscription error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/admin/unsubscribe — remove subscription
router.post('/unsubscribe', async (req, res) => {
  try {
    const { endpoint } = req.body;
    if (!endpoint) {
      return res.status(400).json({ success: false, message: 'Endpoint required' });
    }

    await Subscription.deleteOne({ endpoint });
    console.log('🔕 Admin push subscription removed!');
    res.json({ success: true, message: 'Subscription removed successfully' });
  } catch (error) {
    console.error('❌ Unsubscribe error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
