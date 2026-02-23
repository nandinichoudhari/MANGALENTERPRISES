import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiUrl } from '../api';

function Address() {
  const [address, setAddress] = useState({
    name: "", phone: "", address1: "", address2: "", city: ""
  });
  const [errors, setErrors] = useState({});
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const isLoggedIn = localStorage.getItem("loggedIn") === "true";
    const phone = localStorage.getItem('phone');
    const name = localStorage.getItem('userName') || localStorage.getItem('currentUserName') || '';

    if (!isLoggedIn || !phone) {
      navigate("/login");
      return;
    }

    // Pre-fill form with logged-in user's details so validation passes for new users
    setAddress(prev => ({ ...prev, phone, name }));
    fetchUserAddresses(phone);
  }, [navigate]);

  const fetchUserAddresses = async (phone, autoSelectLatest = false) => {
    setLoadingAddresses(true);
    try {
      const response = await fetch(apiUrl(`/api/user-addresses?phone=${phone}`));
      const result = await response.json();

      if (result.success) {
        const addrs = result.addresses || [];
        setSavedAddresses(addrs);
        if (addrs.length > 0) {
          // Auto-select either the newest (after a save) or the first
          const toSelect = autoSelectLatest ? addrs[addrs.length - 1] : addrs[0];
          setSelectedAddress(toSelect);
          // Write BOTH keys so Payment.js always finds a valid address
          localStorage.setItem('selectedAddress', JSON.stringify(toSelect));
          localStorage.setItem('deliveryAddress', JSON.stringify(toSelect));
        }
      }
    } catch (error) {
      console.log('⚠️ Could not load addresses:', error.message);
    } finally {
      setLoadingAddresses(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!address.name.trim()) newErrors.name = "Name required";
    if (!address.phone.trim() || address.phone.length !== 10) newErrors.phone = "10-digit phone required";
    if (!address.address1.trim()) newErrors.address1 = "Street address required";
    if (!address.city.trim()) newErrors.city = "City required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const saveAddress = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      alert("Please fill all required fields");
      return;
    }

    const loggedInPhone = localStorage.getItem('phone');

    if (!loggedInPhone) {
      alert("User phone not found. Please login again.");
      navigate("/login");
      return;
    }

    try {
      console.log("📱 Sending address for phone:", loggedInPhone);

      const response = await fetch(apiUrl('/api/save-address'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: address.name,
          phone: loggedInPhone,  // 🔥 Always use logged-in phone
          address1: address.address1,
          address2: address.address2,
          city: address.city
        })
      });

      const result = await response.json();

      if (result.success) {
        // Refresh list and auto-select the newest address (last one saved)
        await fetchUserAddresses(loggedInPhone, true);
        setShowForm(false);
        setAddress({ name: '', phone: localStorage.getItem('phone') || '', address1: '', address2: '', city: '' });
      } else {
        alert('❌ Save failed: ' + (result.message || 'User not found'));
      }

    } catch (error) {
      console.error("❌ Save error:", error);
      alert('❌ Backend connection failed');
    }
  };

  const selectAddress = (addr) => {
    setSelectedAddress(addr);
    localStorage.setItem('selectedAddress', JSON.stringify(addr));
    localStorage.setItem('deliveryAddress', JSON.stringify(addr));
  };

  const continueToPayment = () => {
    if (!selectedAddress) {
      alert("Please select an address!");
      return;
    }


    // 🔥 FIX: SAVE CART DATA BEFORE PAYMENT
    const cartItems = JSON.parse(localStorage.getItem('cart') || '[]');
    const totalAmount = cartItems.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);

    localStorage.setItem('checkoutCart', JSON.stringify(cartItems));
    localStorage.setItem('checkoutTotal', totalAmount.toString());
    localStorage.setItem('deliveryAddress', JSON.stringify(selectedAddress));  // 🔥 ADD THIS
    localStorage.setItem('selectedAddress', JSON.stringify(selectedAddress));


    navigate("/payment");
  };


  return (
    <>


      <div style={{ padding: '40px 20px', maxWidth: '600px', margin: '0 auto' }}>
        <div style={{
          background: 'white',
          padding: '40px',
          borderRadius: '16px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
          border: '1px solid #eee'
        }}>
          <h2 style={{ marginBottom: '10px', color: '#333' }}>📍 Delivery Address</h2>
          <p style={{ color: '#666', marginBottom: '30px' }}>
            {loadingAddresses
              ? 'Loading your addresses...'
              : savedAddresses.length > 0
                ? 'Choose from saved addresses or add new'
                : 'Add your delivery address'
            }
          </p>

          {/* Loading spinner while fetching addresses */}
          {loadingAddresses && <div className="spinner" />}

          {!loadingAddresses && savedAddresses.length > 0 && (
            <div style={{ marginBottom: '30px' }}>
              <h4 style={{ marginBottom: '15px', color: '#333' }}>Saved Addresses:</h4>
              {savedAddresses.map((addr, index) => (
                <div
                  key={index}
                  style={{
                    padding: '20px',
                    border: '1px solid #ddd',
                    borderRadius: '12px',
                    marginBottom: '15px',
                    background: selectedAddress === addr ? '#e3f2fd' : 'white',
                    cursor: 'pointer'
                  }}
                  onClick={() => selectAddress(addr)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <strong>{addr.name}</strong> | {addr.phone}
                      <br />
                      {addr.address1}, {addr.address2 || ''} {addr.city}
                    </div>
                    {selectedAddress === addr && <span style={{ color: '#4CAF50' }}>✅ Selected</span>}
                  </div>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={continueToPayment}
            disabled={!selectedAddress}
            style={{
              width: '100%', padding: '15px', marginBottom: '15px',
              background: selectedAddress ? '#8B4513' : '#ccc',
              color: 'white', border: 'none', borderRadius: '8px',
              fontSize: '16px', fontWeight: '600',
              cursor: selectedAddress ? 'pointer' : 'not-allowed'
            }}
          >
            {selectedAddress ? '🚚 Continue to Payment' : 'Select Address First'}
          </button>

          <button
            type="button"
            onClick={() => setShowForm(true)}
            style={{
              width: '100%', padding: '15px',
              background: '#f8f9fa', color: '#333',
              border: '1px solid #ddd', borderRadius: '8px',
              fontSize: '16px'
            }}
          >
            ➕ {savedAddresses.length > 0 ? 'Add New Address' : 'Add Address'}
          </button>
        </div>

        {/* FORM MODAL */}
        {showForm && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center',
            alignItems: 'center', zIndex: 1000, padding: '20px'
          }}>
            <div style={{
              background: 'white', padding: '40px', borderRadius: '16px',
              maxWidth: '500px', width: '100%', maxHeight: '90vh', overflowY: 'auto'
            }}>
              <h3 style={{ marginBottom: '20px', color: '#333' }}>Add New Address</h3>
              <form onSubmit={saveAddress}>
                <div style={{ marginBottom: '20px' }}>
                  <input
                    placeholder="Full Name *"
                    value={address.name}
                    onChange={(e) => setAddress({ ...address, name: e.target.value })}
                    style={{
                      width: '100%', padding: '15px', borderRadius: '8px',
                      border: errors.name ? '2px solid #f44336' : '1px solid #ddd',
                      fontSize: '16px'
                    }}
                    required
                  />
                  {errors.name && <span style={{ color: '#f44336', fontSize: '14px' }}>{errors.name}</span>}
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <input
                    placeholder="Phone (10 digits) *"
                    value={address.phone}
                    maxLength="10"
                    onChange={(e) => setAddress({ ...address, phone: e.target.value.replace(/\D/g, '') })}
                    style={{
                      width: '100%', padding: '15px', borderRadius: '8px',
                      border: errors.phone ? '2px solid #f44336' : '1px solid #ddd',
                      fontSize: '16px'
                    }}
                    required
                  />
                  {errors.phone && <span style={{ color: '#f44336', fontSize: '14px' }}>{errors.phone}</span>}
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <input
                    placeholder="House No, Street *"
                    value={address.address1}
                    onChange={(e) => setAddress({ ...address, address1: e.target.value })}
                    style={{
                      width: '100%', padding: '15px', borderRadius: '8px',
                      border: errors.address1 ? '2px solid #f44336' : '1px solid #ddd',
                      fontSize: '16px'
                    }}
                    required
                  />
                  {errors.address1 && <span style={{ color: '#f44336', fontSize: '14px' }}>{errors.address1}</span>}
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <input
                    placeholder="Area/Locality"
                    value={address.address2}
                    onChange={(e) => setAddress({ ...address, address2: e.target.value })}
                    style={{
                      width: '100%', padding: '15px', borderRadius: '8px',
                      border: '1px solid #ddd', fontSize: '16px'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <input
                    placeholder="City *"
                    value={address.city}
                    onChange={(e) => setAddress({ ...address, city: e.target.value })}
                    style={{
                      width: '100%', padding: '15px', borderRadius: '8px',
                      border: errors.city ? '2px solid #f44336' : '1px solid #ddd',
                      fontSize: '16px'
                    }}
                    required
                  />
                  {errors.city && <span style={{ color: '#f44336', fontSize: '14px' }}>{errors.city}</span>}
                </div>

                <div style={{ display: 'flex', gap: '15px' }}>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    style={{
                      flex: 1, padding: '15px', background: '#f8f9fa',
                      color: '#333', border: '1px solid #ddd', borderRadius: '8px',
                      fontSize: '16px', cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{
                      flex: 1, padding: '15px', background: '#8B4513',
                      color: 'white', border: 'none', borderRadius: '8px',
                      fontSize: '16px', fontWeight: '600', cursor: 'pointer'
                    }}
                  >
                    Save Address
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      <footer style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
        © 2026 Mangal Enterprises
      </footer>
    </>
  );
}

export default Address;
