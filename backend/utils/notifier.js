const webPush = require('web-push');
const Subscription = require('../models/Subscription');
const axios = require('axios');

// Configure VAPID details for Web Push
const pubKey = process.env.VAPID_PUBLIC_KEY || 'BLhjE6JTljVAHe6E4nM1wGAXT95C1vIXbZUtnMzVIEbgM20FGuHa_WCHGqAgb_exYBaC3329XkpV-PCeuo44XdA';
const privKey = process.env.VAPID_PRIVATE_KEY || 'nj_wBKbtJsRp1ftDB4BTxKnfLlcgYwG6zyaQ7hnkyvk';

if (pubKey && privKey) {
  webPush.setVapidDetails(
    'mailto:admin@mangalenterprise.com',
    pubKey,
    privKey
  );
  console.log('📶 Web Push configured successfully!');
} else {
  console.warn('⚠️ Web Push VAPID keys are missing from environment variables!');
}

/**
 * Sends order alerts via browser Web Push AND mobile Pushover API (if configured)
 * @param {Object} order The created order document/object
 */
async function notifyNewOrder(order) {
  const amount = Number(order.total || 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR' });
  const userName = order.userName || 'Customer';
  const orderId = order.orderId || 'New Order';

  const title = '🚨 New Order Received!';
  const body = `${userName} placed an order for ${amount} (${order.paymentMethod || 'COD'})`;
  const url = 'https://mangalenterprise.com/admin-panel'; // Opens direct PWA route on tap

  console.log(`📣 Initiating order notifications for: ${orderId} | ₹${order.total}`);

  // 1. Send native browser Web Push to all active subscriptions
  try {
    const subscriptions = await Subscription.find({});
    console.log(`👥 Found ${subscriptions.length} active browser subscription(s).`);

    const payload = JSON.stringify({
      title,
      body,
      url,
      timestamp: new Date()
    });

    const pushPromises = subscriptions.map(async (sub) => {
      try {
        await webPush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.keys.p256dh,
              auth: sub.keys.auth
            }
          },
          payload
        );
        console.log(`✅ Web Push sent to endpoint: ${sub.endpoint.substring(0, 40)}...`);
      } catch (err) {
        // Delete expired/invalid subscription
        if (err.statusCode === 410 || err.statusCode === 404) {
          console.log(`🧹 Removing expired subscription endpoint: ${sub.endpoint.substring(0, 40)}...`);
          await Subscription.deleteOne({ _id: sub._id });
        } else {
          console.error('❌ Individual Web Push failed:', err.message);
        }
      }
    });

    await Promise.all(pushPromises);
  } catch (error) {
    console.error('❌ Failed to process browser Web Push:', error.message);
  }

  // 2. Send Pushover notifications (backup for high-ringing lock-screen alarms)
  const userKey = process.env.PUSHOVER_USER_KEY;
  const apiToken = process.env.PUSHOVER_API_TOKEN;

  if (userKey && apiToken) {
    try {
      await axios.post('https://api.pushover.net/1/messages.json', {
        token: apiToken,
        user: userKey,
        title,
        message: body,
        url,
        url_title: 'Open Mangal Partner App',
        sound: 'alarm', // High ringing alarm sound on Pushover
        priority: 1    // High priority to bypass quiet hours
      });
      console.log('✅ Mobile Pushover Alarm sent successfully!');
    } catch (err) {
      console.error('❌ Mobile Pushover Alarm failed:', err.message);
    }
  } else {
    console.log('ℹ️ Pushover notifications bypassed (keys not configured in .env).');
  }
}

module.exports = { notifyNewOrder };
