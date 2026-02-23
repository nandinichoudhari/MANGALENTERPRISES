import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiUrl } from '../api';

const STEPS = [
  { key: 'confirmed', label: 'Order Confirmed', icon: '✓' },
  { key: 'preparing', label: 'Preparing', icon: '◎' },
  { key: 'out', label: 'Out for Delivery', icon: '→' },
  { key: 'delivered', label: 'Delivered', icon: '★' },
];

function User() {
  const [userData, setUserData] = useState(null);
  const [orders, setOrders] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', phone: '' });
  const [saving, setSaving] = useState(false);
  const [trackingId, setTrackingId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const phone = localStorage.getItem('phone');
    if (!phone) { navigate('/login'); return; }

    const name = localStorage.getItem('userName') || localStorage.getItem('currentUserName') || '';
    const email = localStorage.getItem('userEmail') || localStorage.getItem('currentUserEmail') || '';
    setUserData({ phone, name, email });
    setEditForm({ name, phone });
    loadUserData(phone);
  }, [navigate]);

  const loadUserData = async (phone) => {
    setLoading(true);
    try {
      // Fetch orders from the Order collection (has full address + payment)
      const ordRes = await fetch(apiUrl(`/api/myorders?phone=${phone}`));
      const ordData = await ordRes.json();
      setOrders(ordData.orders || []);

      // Fetch saved addresses
      const addrRes = await fetch(apiUrl(`/api/user-addresses?phone=${phone}`));
      const addrData = await addrRes.json();
      setAddresses(addrData.addresses || []);
    } catch {
      console.log('API unavailable');
    }
    setLoading(false);
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      const oldPhone = userData.phone;
      const res = await fetch(apiUrl('/api/update-profile'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: oldPhone, name: editForm.name, newPhone: editForm.phone })
      });
      const result = await res.json();
      if (result.success) {
        localStorage.setItem('userName', editForm.name);
        if (editForm.phone) localStorage.setItem('phone', editForm.phone);
        setUserData(prev => ({ ...prev, name: editForm.name, phone: editForm.phone || prev.phone }));
        setEditing(false);
      } else {
        alert('Update failed: ' + (result.message || 'Unknown error'));
      }
    } catch {
      alert('Connection failed');
    }
    setSaving(false);
  };

  const getStepIndex = (status) => {
    const idx = STEPS.findIndex(s => s.key === (status || 'confirmed'));
    return idx >= 0 ? idx : 0;
  };

  if (loading) return (
    <div style={S.page}><div style={S.container}>
      <div style={S.loadingBar}><div style={S.loadingFill} /></div>
      <p style={{ textAlign: 'center', color: '#8B7355', marginTop: 16 }}>Loading your profile...</p>
    </div></div>
  );

  const totalSpent = orders.reduce((s, o) => s + (o.total || 0), 0);

  return (
    <div style={S.page}>
      <div style={S.container}>

        {/* ── PROFILE CARD ── */}
        <div style={S.profileCard}>
          <div style={S.avatar}>
            <span style={{ fontSize: 28, fontWeight: 800, color: '#fff' }}>
              {(userData?.name || '?').charAt(0).toUpperCase()}
            </span>
          </div>

          {editing ? (
            <div style={{ flex: 1 }}>
              <input value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))}
                placeholder="Full Name" style={S.editInput} />
              <input value={editForm.phone} onChange={e => setEditForm(p => ({ ...p, phone: e.target.value }))}
                placeholder="Phone Number" style={{ ...S.editInput, marginTop: 8 }} />
              {userData?.email && <p style={{ margin: '8px 0 0', fontSize: 12, color: '#B8A99A' }}>Email: {userData.email}</p>}
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button onClick={saveProfile} disabled={saving} style={S.btnPrimary}>
                  {saving ? 'Saving...' : 'Save'}
                </button>
                <button onClick={() => { setEditing(false); setEditForm({ name: userData.name, phone: userData.phone }); }} style={S.btnOutline}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div style={{ flex: 1 }}>
              <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#2C1810' }}>{userData?.name || 'Customer'}</h2>
              <p style={{ margin: '4px 0', fontSize: 14, color: '#8B7355' }}>{userData?.phone}</p>
              {userData?.email && <p style={{ margin: '2px 0', fontSize: 13, color: '#B8A99A' }}>{userData.email}</p>}
              <button onClick={() => setEditing(true)} style={S.editBtn}>Edit Profile</button>
            </div>
          )}
        </div>

        {/* ── STATS ── */}
        <div style={S.statsRow}>
          <div style={S.statCard}>
            <div style={S.statVal}>{orders.length}</div>
            <div style={S.statLabel}>Orders</div>
          </div>
          <div style={S.statCard}>
            <div style={S.statVal}>₹{totalSpent.toLocaleString('en-IN')}</div>
            <div style={S.statLabel}>Total Spent</div>
          </div>
          <div style={S.statCard}>
            <div style={S.statVal}>{addresses.length}</div>
            <div style={S.statLabel}>Addresses</div>
          </div>
        </div>

        {/* ── MY ORDERS ── */}
        <div style={S.section}>
          <div style={S.sectionHead}>
            <h3 style={S.sectionTitle}>My Orders</h3>
            <Link to="/menu" style={S.linkBtn}>Order More</Link>
          </div>

          {orders.length === 0 ? (
            <div style={S.empty}>
              <p>No orders placed yet</p>
              <Link to="/menu" style={S.btnPrimary}>Start Shopping</Link>
            </div>
          ) : (
            orders.map((order, i) => {
              const step = getStepIndex(order.status);
              const isTracking = trackingId === (order.orderId || order._id);

              return (
                <div key={i} style={S.orderCard}>
                  {/* order header */}
                  <div style={S.orderHead}>
                    <div>
                      <span style={S.orderId}>{order.orderId || `Order #${i + 1}`}</span>
                      <span style={S.orderDate}>
                        {order.timestamp ? new Date(order.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                      </span>
                    </div>
                    <span style={S.orderTotal}>₹{(order.total || 0).toLocaleString('en-IN')}</span>
                  </div>

                  {/* items */}
                  <div style={S.orderItems}>
                    {(order.items || []).map((it, j) => (
                      <span key={j} style={S.itemPill}>{it.name} x{it.quantity || 1}</span>
                    ))}
                  </div>

                  {/* address + payment */}
                  <div style={S.orderMeta}>
                    {order.address?.address1 && (
                      <span style={S.metaItem}>{order.address.address1}, {order.address.city}</span>
                    )}
                    <span style={S.payBadge}>{(order.paymentMethod || 'COD').toUpperCase()}</span>
                  </div>

                  {/* Track button */}
                  <button onClick={() => setTrackingId(isTracking ? null : (order.orderId || order._id))} style={S.trackBtn}>
                    {isTracking ? 'Hide Tracking' : 'Track Order'}
                  </button>

                  {/* ── TRACKING ANIMATION ── */}
                  {isTracking && (
                    <div style={S.tracker}>
                      <div style={S.trackLine}>
                        {/* progress fill */}
                        <div style={{
                          ...S.trackLineFill,
                          width: `${(step / (STEPS.length - 1)) * 100}%`
                        }} />
                      </div>
                      <div style={S.trackSteps}>
                        {STEPS.map((s, si) => (
                          <div key={si} style={S.trackStep}>
                            <div style={{
                              ...S.trackDot,
                              background: si <= step ? '#8B4513' : '#E8DFD5',
                              color: si <= step ? '#fff' : '#B8A99A',
                              transform: si === step ? 'scale(1.3)' : 'scale(1)',
                              boxShadow: si === step ? '0 0 0 4px rgba(139,69,19,.2)' : 'none',
                            }}>
                              {s.icon}
                            </div>
                            <span style={{
                              fontSize: 11,
                              fontWeight: si <= step ? 700 : 400,
                              color: si <= step ? '#2C1810' : '#B8A99A',
                              marginTop: 6,
                              textAlign: 'center',
                            }}>{s.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* ── ADDRESSES ── */}
        <div style={S.section}>
          <div style={S.sectionHead}>
            <h3 style={S.sectionTitle}>Saved Addresses</h3>
            <Link to="/address" style={S.linkBtn}>Add New</Link>
          </div>
          {addresses.length === 0 ? (
            <div style={S.empty}>
              <p>No addresses saved yet</p>
              <Link to="/address" style={S.btnPrimary}>Add Address</Link>
            </div>
          ) : (
            addresses.map((addr, i) => (
              <div key={i} style={S.addrCard}>
                <div style={{ flex: 1 }}>
                  <strong style={{ color: '#2C1810' }}>{addr.name}</strong>
                  <p style={{ margin: '4px 0 0', fontSize: 13, color: '#8B7355', lineHeight: 1.5 }}>
                    {addr.address1}{addr.address2 ? `, ${addr.address2}` : ''}, {addr.city}
                  </p>
                  <p style={{ margin: '2px 0 0', fontSize: 12, color: '#B8A99A' }}>Ph: {addr.phone}</p>
                </div>
                <button onClick={() => {
                  localStorage.setItem('selectedAddress', JSON.stringify(addr));
                  localStorage.setItem('deliveryAddress', JSON.stringify(addr));
                  alert('Address selected for next order!');
                }} style={S.useAddrBtn}>Use</button>
              </div>
            ))
          )}
        </div>

        {/* ── LOGOUT ── */}
        <button onClick={() => {
          ['loggedIn', 'phone', 'userName', 'userEmail', 'currentUserName', 'currentUserEmail',
            'token', 'cart', 'checkoutCart', 'selectedAddress', 'deliveryAddress', 'menuQuantities', 'emailVerified'
          ].forEach(k => localStorage.removeItem(k));
          navigate('/login');
        }} style={S.logoutBtn}>Sign Out</button>

      </div>
    </div>
  );
}

/* ─── styles ─── */
const S = {
  page: { minHeight: '100vh', background: '#F4F0EB', padding: '32px 16px', fontFamily: "'Inter','Segoe UI',system-ui,sans-serif" },
  container: { maxWidth: 640, margin: '0 auto' },

  loadingBar: { height: 4, background: '#E8DFD5', borderRadius: 4, overflow: 'hidden' },
  loadingFill: { height: '100%', width: '40%', background: '#8B4513', borderRadius: 4, animation: 'loading 1.2s ease infinite' },

  profileCard: { display: 'flex', alignItems: 'flex-start', gap: 20, background: '#fff', padding: '28px 24px', borderRadius: 16, border: '1px solid #E8DFD5', marginBottom: 16 },
  avatar: { width: 56, height: 56, borderRadius: '50%', background: '#8B4513', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  editBtn: { marginTop: 8, background: 'none', border: '1px solid #E8DFD5', padding: '6px 16px', borderRadius: 8, fontSize: 12, color: '#8B4513', fontWeight: 600, cursor: 'pointer' },
  editInput: { width: '100%', padding: '10px 14px', border: '1px solid #E8DFD5', borderRadius: 8, fontSize: 14, background: '#FFF8F0', outline: 'none', boxSizing: 'border-box' },

  btnPrimary: { padding: '10px 24px', background: '#8B4513', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', textDecoration: 'none', display: 'inline-block' },
  btnOutline: { padding: '10px 24px', background: '#fff', color: '#8B4513', border: '1px solid #E8DFD5', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' },

  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 24 },
  statCard: { background: '#fff', padding: '20px 16px', borderRadius: 12, border: '1px solid #E8DFD5', textAlign: 'center' },
  statVal: { fontSize: 22, fontWeight: 800, color: '#2C1810' },
  statLabel: { fontSize: 11, color: '#B8A99A', fontWeight: 600, textTransform: 'uppercase', letterSpacing: .5, marginTop: 4 },

  section: { background: '#fff', borderRadius: 16, border: '1px solid #E8DFD5', overflow: 'hidden', marginBottom: 16 },
  sectionHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 24px', borderBottom: '1px solid #E8DFD5' },
  sectionTitle: { margin: 0, fontSize: 16, fontWeight: 700, color: '#2C1810' },
  linkBtn: { fontSize: 13, fontWeight: 600, color: '#8B4513', textDecoration: 'none' },

  empty: { textAlign: 'center', padding: '40px 20px', color: '#B8A99A' },

  orderCard: { padding: '20px 24px', borderBottom: '1px solid #E8DFD5' },
  orderHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
  orderId: { fontSize: 13, fontWeight: 700, color: '#8B4513', fontFamily: 'monospace', background: '#FFF8F0', padding: '2px 10px', borderRadius: 6, marginRight: 10 },
  orderDate: { fontSize: 12, color: '#B8A99A' },
  orderTotal: { fontSize: 18, fontWeight: 800, color: '#2C1810' },
  orderItems: { display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 },
  itemPill: { background: '#FFF8F0', padding: '4px 12px', borderRadius: 6, fontSize: 12, color: '#8B7355' },
  orderMeta: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, fontSize: 13, color: '#8B7355' },
  metaItem: { fontSize: 12, color: '#B8A99A', maxWidth: '70%' },
  payBadge: { background: '#E8F5E9', color: '#2E7D32', padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 700 },

  trackBtn: { marginTop: 12, width: '100%', padding: '10px', background: '#FFF8F0', border: '1px solid #E8DFD5', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#8B4513', cursor: 'pointer', transition: 'background .15s' },

  tracker: { marginTop: 16, padding: '20px 0 8px', position: 'relative' },
  trackLine: { position: 'absolute', top: 36, left: 24, right: 24, height: 3, background: '#E8DFD5', borderRadius: 3 },
  trackLineFill: { height: '100%', background: '#8B4513', borderRadius: 3, transition: 'width .6s ease' },
  trackSteps: { display: 'flex', justifyContent: 'space-between', position: 'relative', zIndex: 1 },
  trackStep: { display: 'flex', flexDirection: 'column', alignItems: 'center', width: 72 },
  trackDot: { width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, transition: 'all .4s ease' },

  addrCard: { display: 'flex', alignItems: 'center', gap: 16, padding: '16px 24px', borderBottom: '1px solid #E8DFD5' },
  useAddrBtn: { padding: '8px 20px', background: '#8B4513', color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', flexShrink: 0 },

  logoutBtn: { width: '100%', padding: 14, background: 'none', border: '1px solid #E8DFD5', borderRadius: 12, fontSize: 14, fontWeight: 600, color: '#C62828', cursor: 'pointer', marginTop: 8, marginBottom: 32 },
};

export default User;
