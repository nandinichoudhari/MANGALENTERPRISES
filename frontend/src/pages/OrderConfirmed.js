import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function OrderConfirmed() {
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);

  useEffect(() => {
    const lastOrder = localStorage.getItem('lastOrder');
    if (lastOrder) {
      setOrder(JSON.parse(lastOrder));
      localStorage.removeItem('lastOrder');
    } else {
      navigate("/cart");
    }
  }, [navigate]);

  if (!order) return <div>Loading...</div>;

  return (
    <div className="order-page cart-page">
      <div className="cart-header">
        <h2 className="page-title">Order Confirmed! 🎉</h2>
      </div>
      
      <div className="order-success">
  <div className="success-icon">✅</div>
  <h3>Thank you for your order!</h3>
  {/* 🔥 FIXED: Safe order ID display */}
  <p>Order #<strong>{order.orderId ? order.orderId.slice(-6) : 'SUCCESS'}</strong></p>
  <p>We'll call you on <strong>{order.phone || 'your number'}</strong></p>
  {/* 🔥 ADD: Show total + items */}
  <p>Total: <strong>₹{order.total || 0}</strong> | {order.items?.length || 0} items</p>
</div>

      <div className="cart-actions">
        <button className="cta-btn" onClick={() => navigate("/menu")}>
          Continue Shopping
        </button>
      </div>
    </div>
  );
}

export default OrderConfirmed;