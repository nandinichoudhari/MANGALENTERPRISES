import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiMapPin, FiNavigation, FiCheckCircle, FiRefreshCw, FiShoppingBag, FiAlertCircle, FiArrowRight } from "react-icons/fi";
import { apiUrl } from "../api";

// Dombivli East coordinates
const BASE_LAT = 19.2183;
const BASE_LNG = 73.0867;

// Haversine formula — distance between two GPS points in km
function getDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Delivery charge rules
function calcDeliveryCharge(distKm) {
  if (distKm <= 3) return 60;
  return 60 + Math.ceil(distKm - 3) * 11;
}

function Cart({ items, setItems }) {
  const navigate = useNavigate();
  const [deliveryCharge, setDeliveryCharge] = useState(null);
  const [distance, setDistance] = useState(null);
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState("");
  const [offerInfo, setOfferInfo] = useState(null);

  // ✅ Check offer eligibility on mount
  useEffect(() => {
    const checkOffer = async () => {
      const email = localStorage.getItem('userEmail') || localStorage.getItem('currentUserEmail');
      const phone = localStorage.getItem('phone');
      if (!email && !phone) return;

      try {
        const res = await fetch(apiUrl(`/api/check-offer-eligibility?email=${email || ''}&phone=${phone || ''}`));
        const data = await res.json();
        if (data.eligible) {
          setOfferInfo(data);
        }
      } catch (err) {
        console.error("Failed to check offer:", err);
      }
    };
    checkOffer();
  }, []);

  const validItems = Array.isArray(items)
    ? items.filter(item => item && item.id && item.price > 0 && item.name)
    : [];

  if (validItems.length === 0) {
    return (
      <div className="cart-page">
        <div className="empty-cart">
          <div className="empty-icon"><FiShoppingBag size={64} color="#e0cfb3" /></div>
          <h2 className="page-title">Your Cart is Empty</h2>
          <p className="empty-text">Add delicious items from the menu!</p>
          <Link to="/menu" className="cta-btn">Shop Now</Link>
        </div>
      </div>
    );
  }

  const updateQuantity = (id, change) => {
    setItems(prev => prev.map(item =>
      item.id === id
        ? { ...item, quantity: Math.max(1, (item.quantity || 1) + change) }
        : item
    ));
  };

  const removeItem = (id) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const totalItems = validItems.reduce((sum, item) => sum + (item.quantity || 1), 0);
  const subtotal = validItems.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
  
  // Calculate discount if eligible
  const discountAmount = offerInfo ? Math.round(subtotal * (offerInfo.discountPercentage / 100)) : 0;
  const finalTotal = subtotal - discountAmount + (deliveryCharge || 0);

  const detectLocation = () => {
    setLocating(true);
    setLocError("");

    if (!navigator.geolocation) {
      setLocError("Your browser doesn't support GPS. Please use a modern browser.");
      setLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const dist = getDistanceKm(BASE_LAT, BASE_LNG, latitude, longitude);
        const charge = calcDeliveryCharge(dist);
        setDistance(Math.round(dist * 10) / 10);
        setDeliveryCharge(charge);
        localStorage.setItem('deliveryCharge', charge.toString());
        localStorage.setItem('deliveryDistance', dist.toFixed(1));
        setLocating(false);
      },
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocError("Location access denied. Please allow location in your browser settings.");
            break;
          case error.POSITION_UNAVAILABLE:
            setLocError("Location unavailable. Please try again.");
            break;
          default:
            setLocError("Could not detect location. Please try again.");
        }
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleCheckout = () => {
    const phone = localStorage.getItem('phone');
    if (!phone) {
      navigate("/login");
      return;
    }
    if (validItems.length === 0) {
      alert("Your cart is empty!");
      return;
    }
    if (deliveryCharge === null) {
      alert("Please detect your location first to calculate delivery charges.");
      return;
    }

    localStorage.setItem('checkoutCart', JSON.stringify(validItems));
    localStorage.setItem('checkoutTotal', finalTotal.toString());
    localStorage.setItem('deliveryCharge', deliveryCharge.toString());
    localStorage.setItem('applyOffer', offerInfo ? 'true' : 'false');
    navigate("/address");
  };

  return (
    <div className="cart-page">
      <div className="cart-header">
        <h2 className="page-title">Shopping Cart ({totalItems} items)</h2>
        <Link to="/menu" className="continue-shopping">← Continue Shopping</Link>
      </div>

      <div className="cart-items">
        {validItems.map((item) => {
          const qty = item.quantity || 1;
          const itemTotal = item.price * qty;

          return (
            <div key={item.id} className="cart-item-row">
              <div 
                className="cart-item-image" 
                style={{ 
                  backgroundImage: item.image ? `url(${process.env.PUBLIC_URL}${item.image})` : 'none',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              >
                {!item.image && <span>🍽️</span>}
              </div>
              <div className="cart-item-details">
                <h3 className="cart-item-name">{item.name}</h3>
                <p className="cart-item-price">₹{item.price} / {item.unit || 'unit'}</p>
              </div>

              <div className="cart-item-controls">
                <div className="quantity-controls">
                  <button className="qty-btn" onClick={() => updateQuantity(item.id, -1)} disabled={qty <= 1}>−</button>
                  <span className="qty-display">{qty}</span>
                  <button className="qty-btn" onClick={() => updateQuantity(item.id, 1)}>+</button>
                </div>
                <div className="item-total">₹{itemTotal}</div>
                <button className="remove-btn" onClick={() => removeItem(item.id)}>✕</button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Delivery Location Detection */}
      <div className="cart-summary" style={{ marginBottom: '16px' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontWeight: '700', marginBottom: '12px', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}><FiMapPin size={18} /> Delivery Location</p>

          {deliveryCharge === null ? (
            <>
              <button
                onClick={detectLocation}
                disabled={locating}
                style={{
                  padding: '12px 28px',
                  background: locating ? '#ccc' : 'linear-gradient(135deg, #f97316, #ea580c)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '999px',
                  fontWeight: '700',
                  fontSize: '15px',
                  cursor: locating ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 15px rgba(249, 115, 22, 0.3)',
                  transition: 'all 0.2s'
                }}
              >
                {locating ? <><FiNavigation size={14} style={{animation: 'spin 1s linear infinite'}} /> Detecting...</> : <><FiNavigation size={14} /> Detect My Location</>}
              </button>
              <p style={{ color: '#888', fontSize: '13px', marginTop: '8px' }}>
                We need your location to calculate delivery charges
              </p>
              {locError && (
                <p style={{ color: '#e23744', fontSize: '14px', marginTop: '8px', fontWeight: '600' }}>
                   <FiAlertCircle size={14} style={{marginRight: '4px', verticalAlign: 'middle'}} /> {locError}
                </p>
              )}
            </>
          ) : (
            <div style={{ 
              background: '#e8f5e9', 
              padding: '16px', 
              borderRadius: '12px',
              border: '1px solid #c8e6c9'
            }}>
              <p style={{ color: '#2e7d32', fontWeight: '700', fontSize: '15px' }}>
                <FiCheckCircle size={16} style={{marginRight: '6px', verticalAlign: 'middle'}} /> Location detected!
              </p>
              <p style={{ color: '#555', fontSize: '14px', marginTop: '4px' }}>
                You are ~{distance} km from Dombivli East
              </p>
              <button
                onClick={detectLocation}
                style={{
                  marginTop: '8px',
                  padding: '6px 16px',
                  background: 'transparent',
                  color: '#f97316',
                  border: '1px solid #f97316',
                  borderRadius: '999px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                <FiRefreshCw size={12} style={{marginRight: '4px'}} /> Re-detect
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Order Summary */}
      <div className="cart-summary">
        <div className="summary-row">
          <span>Subtotal ({totalItems} items):</span>
          <span>₹{subtotal}</span>
        </div>
        <div className="summary-row">
          <span>Delivery{distance ? ` (~${distance} km)` : ''}:</span>
          <span style={{ color: deliveryCharge !== null ? '#4a1e0e' : '#888', fontWeight: '600' }}>
            {deliveryCharge !== null ? `₹${deliveryCharge}` : 'Detect location ↑'}
          </span>
        </div>
        <div className="summary-row">
          <span>Taxes:</span>
          <span>₹0</span>
        </div>
        {offerInfo && (
          <div className="summary-row" style={{ color: '#2e7d32', fontWeight: '600' }}>
            <span>Discount ({offerInfo.discountPercentage}% Off - 1st Order):</span>
            <span>−₹{discountAmount}</span>
          </div>
        )}
        <div className="summary-total">
          <span>Total:</span>
          <strong>₹{deliveryCharge !== null ? finalTotal : subtotal}</strong>
        </div>
      </div>

      <div className="cart-actions">
        <button className="checkout-btn" onClick={handleCheckout}>
          Place Order Now — ₹{deliveryCharge !== null ? finalTotal : subtotal} <FiArrowRight size={16} style={{marginLeft: '6px', verticalAlign: 'middle'}} />
        </button>
      </div>
    </div>
  );
}

export default Cart;
