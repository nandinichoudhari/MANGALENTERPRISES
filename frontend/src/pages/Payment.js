import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

function Payment() {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [address, setAddress] = useState({});
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Address.js saves 'checkoutCart' right before navigating here.
    // Read that first — avoids the race condition where App.js's useEffect
    // might clear 'cart' from localStorage at the same moment this mounts.
    const cart =
      JSON.parse(localStorage.getItem('checkoutCart') || 'null') ||
      JSON.parse(localStorage.getItem('cart') || '[]');

    const addr = JSON.parse(localStorage.getItem('deliveryAddress') || '{}');

    setCartItems(cart);
    setAddress(addr);

    if (cart.length === 0) {
      alert('Your cart is empty. Please add items before proceeding to payment.');
      navigate('/menu');
    }
  }, [navigate]);

  // Load Razorpay SDK script dynamically
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const totalItems = cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0);
  const total = cartItems.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);

  // Build order details object (shared between COD & Razorpay)
  const buildOrderDetails = useCallback(() => {
    const phone = localStorage.getItem('phone') || '';
    const userName = localStorage.getItem('userName') || localStorage.getItem('currentUserName') || 'Customer';
    const userEmail = localStorage.getItem('userEmail') || localStorage.getItem('currentUserEmail') || '';

    const rawAddr = JSON.parse(localStorage.getItem('deliveryAddress') || '{}');
    const addr = {
      name: rawAddr.name || '',
      phone: rawAddr.phone || localStorage.getItem('phone') || '',
      address1: rawAddr.address1 || '',
      address2: rawAddr.address2 || '',
      city: rawAddr.city || '',
    };

    return {
      userName,
      userPhone: phone,
      userEmail,
      items: cartItems,
      total,
      address: addr,
    };
  }, [cartItems, total]);

  // ─────────────────────────────────────
  // COD Order
  // ─────────────────────────────────────
  const placeOrderCOD = async () => {
    console.log('🧾 Place Order (COD) clicked!');
    setLoading(true);

    try {
      const orderDetails = { ...buildOrderDetails(), paymentMethod: 'cod' };

      console.log('📤 Sending COD order to backend:', JSON.stringify(orderDetails.address));

      const response = await fetch('/api/place-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderDetails),
      });

      const result = await response.json();
      console.log('📥 Backend response:', result);

      if (result.success) {
        localStorage.setItem("lastOrder", JSON.stringify(orderDetails));
        localStorage.removeItem('cart');
        localStorage.removeItem('checkoutCart');
        localStorage.removeItem('deliveryAddress');
        alert(`✅ Order placed! ID: ${result.orderId}`);
        navigate("/order-confirmed");
      } else {
        alert(`❌ Order failed: ${result.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('� Network error:', error);
      alert('❌ Network error - Check if backend is running on port 5000');
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────
  // Razorpay Payment
  // ─────────────────────────────────────
  const placeOrderRazorpay = async () => {
    console.log('💳 Pay with Razorpay clicked!');
    setLoading(true);

    try {
      // Step 1: Load Razorpay SDK
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        alert('❌ Failed to load Razorpay SDK. Check your internet connection.');
        setLoading(false);
        return;
      }

      // Step 2: Create order on backend
      const response = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: total,
          receipt: `receipt_${Date.now()}`,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        alert(`❌ Could not create payment order: ${data.message}`);
        setLoading(false);
        return;
      }

      // Step 3: Open Razorpay checkout popup
      const orderDetails = buildOrderDetails();

      const options = {
        key: data.key,
        amount: data.order.amount,
        currency: data.order.currency,
        name: 'Mangal Enterprises',
        description: `Payment for ${totalItems} item${totalItems > 1 ? 's' : ''}`,
        order_id: data.order.id,
        handler: async function (response) {
          // Step 4: Verify payment on backend
          console.log('✅ Razorpay payment response:', response);

          try {
            const verifyRes = await fetch('/api/payment/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                orderDetails,
              }),
            });

            const verifyData = await verifyRes.json();

            if (verifyData.success) {
              localStorage.setItem("lastOrder", JSON.stringify({
                ...orderDetails,
                paymentMethod: 'razorpay',
                razorpayPaymentId: response.razorpay_payment_id,
              }));
              localStorage.removeItem('cart');
              localStorage.removeItem('checkoutCart');
              localStorage.removeItem('deliveryAddress');
              alert(`✅ Payment successful! Order ID: ${verifyData.orderId}`);
              navigate("/order-confirmed");
            } else {
              alert(`❌ Payment verification failed: ${verifyData.message}`);
            }
          } catch (err) {
            console.error('🚨 Verify error:', err);
            alert('❌ Payment received but verification failed. Contact support.');
          }
        },
        prefill: {
          name: orderDetails.userName,
          email: orderDetails.userEmail,
          contact: orderDetails.userPhone,
        },
        notes: {
          address: orderDetails.address.address1,
        },
        theme: {
          color: '#4a1e0e',
        },
        modal: {
          ondismiss: function () {
            console.log('⚠️ Razorpay popup closed by user');
            setLoading(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response) {
        console.error('❌ Razorpay payment failed:', response.error);
        alert(`❌ Payment failed: ${response.error.description}`);
        setLoading(false);
      });

      rzp.open();
    } catch (error) {
      console.error('🚨 Razorpay error:', error);
      alert('❌ Payment error. Check if backend is running.');
      setLoading(false);
    }
  };

  // ─────────────────────────────────────
  // Place Order Handler
  // ─────────────────────────────────────
  const placeOrder = () => {
    if (paymentMethod === 'razorpay') {
      placeOrderRazorpay();
    } else {
      placeOrderCOD();
    }
  };

  if (cartItems.length === 0) return null;

  return (
    <div className="order-page cart-page">
      <div className="cart-header">
        <h2 className="page-title">Payment Method ({totalItems} items)</h2>
        <button className="continue-shopping" onClick={() => navigate("/address")}>
          ← Edit Address
        </button>
      </div>

      <div className="order-info">
        <h3>📍 Delivery Details</h3>
        <div className="address-summary">
          <p><strong>{address.name || "Customer Name"}</strong></p>
          <p>{address.address1 || "..."}, {address.address2 || ""}</p>
          <p>{address.city || "Mumbai"} | 📞 {address.phone || "Phone"}</p>
        </div>
      </div>

      <div className="cart-items">
        {cartItems.slice(0, 3).map(item => (
          <div key={item.id} className="cart-item-row">
            <div className="cart-item-details">
              <h4>{item.name}</h4>
              <p>₹{item.price} x {item.quantity}</p>
            </div>
            <div className="item-total">₹{item.price * item.quantity}</div>
          </div>
        ))}
        {cartItems.length > 3 && (
          <div className="cart-item-row">
            <span>...</span>
            <span>+{cartItems.length - 3} more</span>
          </div>
        )}
      </div>

      <div className="cart-summary">
        <div className="summary-row">
          <span>Items ({totalItems}):</span>
          <span>₹{total}</span>
        </div>
        <div className="summary-row delivery">
          <span>Delivery:</span>
          <span className="free">FREE</span>
        </div>
        <div className="summary-total">
          <span>Grand Total:</span>
          <strong>₹{total}</strong>
        </div>
      </div>

      <div className="payment-options">
        <h3>💳 Choose Payment Method</h3>
        <div className="payment-methods">
          <label className={`payment-method ${paymentMethod === 'cod' ? 'active' : ''}`}>
            <input
              type="radio"
              name="payment"
              value="cod"
              checked={paymentMethod === 'cod'}
              onChange={(e) => setPaymentMethod(e.target.value)}
            />
            <div className="payment-icon">💰</div>
            <div>
              <h4>Cash on Delivery</h4>
              <p>Pay when delivery boy arrives</p>
            </div>
          </label>

          <label className={`payment-method ${paymentMethod === 'razorpay' ? 'active' : ''}`}>
            <input
              type="radio"
              name="payment"
              value="razorpay"
              checked={paymentMethod === 'razorpay'}
              onChange={(e) => setPaymentMethod(e.target.value)}
            />
            <div className="payment-icon">💳</div>
            <div>
              <h4>Pay Online</h4>
              <p>Card / UPI / Netbanking — Razorpay Secure</p>
              <span className="razorpay-badge">
                <img
                  src="https://badges.razorpay.com/badge-dark.png"
                  alt="Razorpay Secure"
                  style={{ height: '20px', marginTop: '4px' }}
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              </span>
            </div>
          </label>
        </div>
      </div>

      {/* Test Mode Info */}
      {paymentMethod === 'razorpay' && (
        <div className="razorpay-test-info">
          <h4>🧪 Test Mode — No Real Money Charged</h4>
          <p>Use these dummy credentials:</p>
          <ul>
            <li><strong>Card:</strong> 4111 1111 1111 1111</li>
            <li><strong>Expiry:</strong> Any future date</li>
            <li><strong>CVV:</strong> Any 3 digits (e.g. 123)</li>
            <li><strong>UPI:</strong> success@razorpay</li>
          </ul>
        </div>
      )}

      <div className="cart-actions">
        <button
          className="checkout-btn"
          onClick={placeOrder}
          disabled={loading}
        >
          {loading
            ? 'Processing...'
            : paymentMethod === 'cod'
              ? `✅ Place Order (COD) — ₹${total}`
              : `💳 Pay ₹${total} with Razorpay`}
        </button>
      </div>

      <div className="secure-payment">
        <p>🔒 Secure checkout | 100% Safe | Mumbai Same Day Delivery</p>
      </div>
    </div>
  );
}

export default Payment;
