import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";

function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const phone = localStorage.getItem('phone');
    if (!phone) {
      navigate('/login');
      return;
    }

    // Fetch from YOUR backend /api/orders endpoint
    fetch('http://localhost:5000/api/orders')
      .then(res => res.json())
      .then(data => {
        setOrders(data.orders || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [navigate]);

  if (loading) {
    return <div className="page-content"><h2>🔄 Loading Orders...</h2></div>;
  }

  return (
    <div className="page-content">
      <div className="orders-page">
        <div className="cart-header">
          <h2 className="page-title">My Orders ({orders.length})</h2>
          <Link to="/menu" className="continue-shopping">← Continue Shopping</Link>
        </div>
        
        {orders.length === 0 ? (
          <div className="empty-cart">
            <div className="empty-icon">🧾</div>
            <h3>No orders yet</h3>
            <p>Your order history will appear here!</p>
          </div>
        ) : (
          orders.map(order => (
            <div key={order._id} className="order-card" style={{
              border: '1px solid #ddd', 
              margin: '1rem 0', 
              padding: '1rem', 
              borderRadius: '8px'
            }}>
              <div style={{display: 'flex', justifyContent: 'space-between'}}>
                <strong>Order #{order._id?.slice(-6)}</strong>
                <span>{new Date(order.timestamp).toLocaleDateString()}</span>
              </div>
              <div>Total: <strong>₹{order.total}</strong></div>
              <div>{order.items.length} items • {order.status}</div>
              <div style={{fontSize: '0.9rem', color: '#666'}}>
                {order.paymentMethod} • {new Date(order.timestamp).toLocaleTimeString()}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Orders;
