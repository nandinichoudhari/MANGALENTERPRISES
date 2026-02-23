import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function Order() {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);

  useEffect(() => {
    const saved = localStorage.getItem('cart');
    if (saved) {
      setCartItems(JSON.parse(saved));
    }
  }, []);

  const totalItems = cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0);
  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
  const delivery = 0;
  const total = subtotal + delivery;

  const placeOrder = () => {
    // 🔥 NO ALERT POPUP - Just clear cart & go home
    localStorage.removeItem('cart');
    localStorage.removeItem('deliveryAddress');
    navigate("/"); // Go to home page silently
  };

  if (cartItems.length === 0) {
    return (
      <div className="order-page cart-page">
        <div className="empty-cart">
          <div className="empty-icon">📋</div>
          <h2 className="page-title">No Items to Order</h2>
          <p className="empty-text">Your cart is empty. Add items first!</p>
          <button className="cta-btn" onClick={() => navigate("/menu")}>
            Shop Now
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="order-page cart-page">
      <div className="cart-header">
        <h2 className="page-title">Order Confirmed ({totalItems} items)</h2>
        <button className="continue-shopping" onClick={() => navigate("/cart")}>
          ← Edit Cart
        </button>
      </div>

      <div className="order-success">
        <div className="success-icon">✅</div>
        <h3>Your order has been placed successfully!</h3>
        <p>We'll call you on <strong>982531370</strong> to confirm delivery details.</p>
      </div>

      {/* Order Items */}
      <div className="cart-items">
        {cartItems.map((item) => {
          const qty = item.quantity || 1;
          const itemTotal = item.price * qty;
          return (
            <div key={item.id} className="cart-item-row">
              <div className="cart-item-image">
                <span>{item.emoji || '🍽️'}</span>
              </div>
              <div className="cart-item-details">
                <h3 className="cart-item-name">{item.name}</h3>
                <p className="cart-item-price">₹{item.price} x {qty}</p>
              </div>
              <div className="item-total">₹{itemTotal}</div>
            </div>
          );
        })}
      </div>

      <div className="cart-summary">
        <div className="summary-row">
          <span>Subtotal ({totalItems} items):</span>
          <span>₹{subtotal}</span>
        </div>
        <div className="summary-row delivery">
          <span>Delivery:</span>
          <span className="free">FREE</span>
        </div>
        <div className="summary-total">
          <span>Total:</span>
          <strong>₹{total}</strong>
        </div>
      </div>

      <div className="order-info">
        <h3>📞 Next Steps</h3>
        <p>Our team will call you within 30 minutes to confirm delivery time.</p>
        <p><strong>Payment:</strong> Cash on Delivery</p>
        <p><strong>Delivery:</strong> Same day within Mumbai</p>
      </div>

      <div className="cart-actions">
        <button className="cta-btn" onClick={placeOrder}>
          Continue Shopping
        </button>
      </div>
    </div>
  );
}

export default Order;
