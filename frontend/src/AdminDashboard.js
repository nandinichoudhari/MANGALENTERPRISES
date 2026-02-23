import { useState, useEffect, useMemo } from 'react';
import { apiUrl } from './api';

/* ─── colour tokens ─── */
const C = {
  bg: '#F4F0EB',
  card: '#FFFFFF',
  sidebar: '#2C1810',
  accent: '#8B4513',
  accentLt: '#A0522D',
  badge: '#FFF8F0',
  border: '#E8DFD5',
  green: '#2E7D32',
  red: '#C62828',
  amber: '#F57F17',
  text: '#2C1810',
  sub: '#8B7355',
  light: '#B8A99A',
};

const font = "'Inter','Segoe UI',system-ui,sans-serif";

/* ─── tiny helpers ─── */
const rupee = n => '₹' + Number(n || 0).toLocaleString('en-IN');

const fmtTime = d => {
  if (!d) return '—';
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return '—';
  return dt.toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true });
};

/* ================================================================ */
function AdminDashboard() {
  const [auth, setAuth] = useState(false);
  const [pw, setPw] = useState('');
  const [tab, setTab] = useState('overview');
  const [data, setData] = useState({ orders: [], logins: [] });
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [dateRange, setDateRange] = useState('all');

  /* ── fetch ─────────────────────────────── */
  const fetchData = async () => {
    setLoading(true);
    try {
      const r = await fetch(apiUrl('/api/admin/data'));
      if (r.ok) setData(await r.json());
    } catch { /* backend offline */ }
    setLoading(false);
  };

  /* ── update order status ────────────────── */
  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const r = await fetch(apiUrl('/api/update-order-status'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status: newStatus })
      });
      const result = await r.json();
      if (result.success) {
        // Update local state immediately for responsive UI
        setData(prev => ({
          ...prev,
          orders: prev.orders.map(o => o.orderId === orderId ? { ...o, status: newStatus } : o)
        }));
      }
    } catch { /* silent */ }
  };

  useEffect(() => { if (auth) fetchData(); }, [auth]);

  /* ── build customers from ORDERS when users collection is empty ── */
  const customers = useMemo(() => {
    const registered = data.logins || [];
    const orders = data.orders || [];

    // If we have registered users, use them
    if (registered.length > 0) return registered;

    // Otherwise, derive customers from order data
    const map = {};
    orders.forEach(o => {
      const key = o.userPhone || o.userEmail || 'unknown';
      if (!map[key]) {
        map[key] = {
          name: o.userName || 'Unknown',
          phone: o.userPhone || '',
          email: o.userEmail || '',
          isVerified: false,
          orderCount: 0,
          totalSpent: 0,
          addressCount: o.address && o.address.address1 ? 1 : 0,
          lastOrder: o.timestamp || null,
        };
      }
      map[key].orderCount += 1;
      map[key].totalSpent += (o.total || 0);
      // keep latest timestamp
      if (o.timestamp && (!map[key].lastOrder || new Date(o.timestamp) > new Date(map[key].lastOrder))) {
        map[key].lastOrder = o.timestamp;
      }
      // update name if we have a better one
      if (o.userName && o.userName !== 'Unknown' && o.userName !== 'Customer') {
        map[key].name = o.userName;
      }
    });

    return Object.values(map).sort((a, b) => b.orderCount - a.orderCount);
  }, [data]);

  /* ── filtered orders (for Orders tab) ──── */
  const filteredOrders = useMemo(() => {
    let list = [...(data.orders || [])];
    // date filter
    if (dateRange !== 'all') {
      const now = new Date();
      const cutoff = new Date();
      if (dateRange === 'today') cutoff.setHours(0, 0, 0, 0);
      if (dateRange === 'week') cutoff.setDate(now.getDate() - 7);
      if (dateRange === 'month') cutoff.setMonth(now.getMonth() - 1);
      list = list.filter(o => {
        if (!o.timestamp) return false;
        return new Date(o.timestamp) >= cutoff;
      });
    }
    // search
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(o =>
        (o.userName || '').toLowerCase().includes(q) ||
        (o.userPhone || '').includes(q) ||
        (o.userEmail || '').toLowerCase().includes(q) ||
        (o.orderId || '').toLowerCase().includes(q) ||
        (o.address?.city || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [data.orders, dateRange, search]);

  /* ── metrics from filtered orders ──────── */
  const metrics = useMemo(() => {
    const all = data.orders || [];
    const filtered = filteredOrders;
    const revenue = filtered.reduce((s, x) => s + (x.total || 0), 0);
    const avgOrder = filtered.length ? Math.round(revenue / filtered.length) : 0;
    const codOrders = filtered.filter(x => (x.paymentMethod || 'cod').toLowerCase() === 'cod').length;

    const today = new Date(); today.setHours(0, 0, 0, 0);
    const todayOrders = all.filter(x => x.timestamp && new Date(x.timestamp) >= today).length;
    const todayRev = all.filter(x => x.timestamp && new Date(x.timestamp) >= today).reduce((s, x) => s + (x.total || 0), 0);

    return {
      totalAll: all.length,
      filtered: filtered.length,
      revenue, avgOrder, codOrders,
      todayOrders, todayRev,
      customers: customers.length,
    };
  }, [data.orders, filteredOrders, customers]);

  /* ── login ─────────────────────────────── */
  function tryLogin() {
    if (pw === 'mangal123') { setAuth(true); }
    else alert('Incorrect password');
  }

  if (!auth) return (
    <div style={loginWrap}>
      <div style={loginCard}>
        <div style={{ fontSize: 28, fontWeight: 800, color: C.accent, marginBottom: 4, fontFamily: font }}>Mangal Enterprises</div>
        <div style={{ fontSize: 13, color: C.sub, marginBottom: 32, letterSpacing: 2, textTransform: 'uppercase' }}>Admin Dashboard</div>
        <input
          type="password" value={pw} onChange={e => setPw(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && tryLogin()}
          placeholder="Enter admin password"
          style={inputStyle}
        />
        <button onClick={tryLogin} style={loginBtn}>Sign In</button>
      </div>
    </div>
  );

  /* ── SIDEBAR ITEMS ─────────────────────── */
  const tabs = [
    { id: 'overview', label: 'Overview', icon: '▦' },
    { id: 'orders', label: 'Orders', icon: '☰' },
    { id: 'customers', label: 'Customers', icon: '◉' },
  ];

  /* ════════════════════════════════════════
     MAIN RENDER
     ════════════════════════════════════════ */
  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: font, color: C.text, background: C.bg }}>

      {/* ── SIDEBAR ── */}
      <aside style={sidebar}>
        <div style={{ padding: '28px 24px 20px', borderBottom: '1px solid rgba(255,255,255,.08)' }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', letterSpacing: .5 }}>Mangal Enterprises</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,.45)', marginTop: 4, letterSpacing: 1, textTransform: 'uppercase' }}>Admin Panel</div>
        </div>
        <nav style={{ padding: '12px 10px', flex: 1 }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => { setTab(t.id); setDateRange('all'); setSearch(''); }} style={{
              ...navItem,
              background: tab === t.id ? 'rgba(255,255,255,.12)' : 'transparent',
              color: tab === t.id ? '#fff' : 'rgba(255,255,255,.55)',
            }}>
              <span style={{ fontSize: 16, marginRight: 10, opacity: .7 }}>{t.icon}</span>
              {t.label}
              {t.id === 'orders' && <span style={navBadge}>{(data.orders || []).length}</span>}
              {t.id === 'customers' && <span style={navBadge}>{customers.length}</span>}
            </button>
          ))}
        </nav>
        <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,.08)' }}>
          <button onClick={() => { setAuth(false); setPw(''); }} style={{
            ...navItem, color: 'rgba(255,255,255,.4)', fontSize: 13
          }}>Sign Out</button>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main style={{ flex: 1, padding: '28px 36px', overflowY: 'auto', maxHeight: '100vh' }}>

        {/* top bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>
              {tab === 'overview' ? 'Dashboard Overview' : tab === 'orders' ? 'Order Management' : 'Customer Management'}
            </h1>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: C.sub }}>
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <button onClick={fetchData} disabled={loading} style={refreshBtn}>
            {loading ? 'Syncing...' : 'Refresh'}
          </button>
        </div>

        {/* ═══════ OVERVIEW TAB ═══════ */}
        {tab === 'overview' && (
          <>
            {/* KPI CARDS */}
            <div style={kpiGrid}>
              <KPI label="Total Revenue" value={rupee(metrics.revenue)} sub={`${metrics.totalAll} orders total`} color={C.green} />
              <KPI label="Today's Revenue" value={rupee(metrics.todayRev)} sub={`${metrics.todayOrders} orders today`} color={C.accent} />
              <KPI label="Avg Order Value" value={rupee(metrics.avgOrder)} sub={`${metrics.codOrders} COD orders`} color={C.amber} />
              <KPI label="Customers" value={metrics.customers} sub="unique customers" color="#5C6BC0" />
            </div>

            {/* RECENT ORDERS */}
            <div style={cardStyle}>
              <div style={cardHeader}>
                <span style={{ fontWeight: 700, fontSize: 15 }}>Recent Orders</span>
                <button onClick={() => setTab('orders')} style={linkBtn}>View All →</button>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={tbl}>
                  <thead><tr style={thRow}>
                    <TH>Order ID</TH><TH>Customer</TH><TH>Items</TH><TH align="right">Total</TH><TH>Payment</TH><TH>Date & Time</TH>
                  </tr></thead>
                  <tbody>
                    {(data.orders || []).slice(0, 5).map((o, i) => (
                      <tr key={i} style={tdRow}>
                        <TD><span style={orderIdBadge}>{o.orderId || `#${i + 1}`}</span></TD>
                        <TD><strong>{o.userName || '—'}</strong><br /><small style={{ color: C.sub }}>{o.userPhone}</small></TD>
                        <TD>{(o.items || []).map(it => it.name).join(', ').substring(0, 40) || '—'}</TD>
                        <TD align="right" style={{ fontWeight: 700, color: C.accent }}>{rupee(o.total)}</TD>
                        <TD><PayBadge method={o.paymentMethod} /></TD>
                        <TD style={{ color: C.sub, fontSize: 12, whiteSpace: 'nowrap' }}>{fmtTime(o.timestamp)}</TD>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {(data.orders || []).length === 0 && <Empty msg="No orders yet" />}
            </div>

            {/* TOP CUSTOMERS mini-table */}
            <div style={cardStyle}>
              <div style={cardHeader}>
                <span style={{ fontWeight: 700, fontSize: 15 }}>Top Customers</span>
                <button onClick={() => setTab('customers')} style={linkBtn}>View All →</button>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={tbl}>
                  <thead><tr style={thRow}>
                    <TH>Name</TH><TH>Phone</TH><TH align="center">Orders</TH><TH align="right">Total Spent</TH><TH>Last Order</TH>
                  </tr></thead>
                  <tbody>
                    {customers.slice(0, 5).map((c, i) => (
                      <tr key={i} style={tdRow}>
                        <TD style={{ fontWeight: 600 }}>{c.name}</TD>
                        <TD style={{ color: C.sub }}>{c.phone}</TD>
                        <TD align="center"><span style={{ ...countBadge, background: C.accent, color: '#fff' }}>{c.orderCount}</span></TD>
                        <TD align="right" style={{ fontWeight: 700, color: C.accent }}>{rupee(c.totalSpent)}</TD>
                        <TD style={{ fontSize: 12, color: C.sub, whiteSpace: 'nowrap' }}>{fmtTime(c.lastOrder || c.updatedAt)}</TD>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {customers.length === 0 && <Empty msg="No customer data yet" />}
            </div>
          </>
        )}

        {/* ═══════ ORDERS TAB ═══════ */}
        {tab === 'orders' && (
          <div style={cardStyle}>
            {/* filters bar */}
            <div style={{ ...cardHeader, flexWrap: 'wrap', gap: 10 }}>
              <span style={{ fontWeight: 700, fontSize: 15 }}>
                Orders ({filteredOrders.length}{dateRange !== 'all' ? ` of ${(data.orders || []).length}` : ''})
              </span>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                {[
                  { key: 'all', label: 'All Time' },
                  { key: 'today', label: 'Today' },
                  { key: 'week', label: 'This Week' },
                  { key: 'month', label: 'This Month' },
                ].map(r => (
                  <button key={r.key} onClick={() => setDateRange(r.key)} style={{
                    ...filterBtn,
                    background: dateRange === r.key ? C.accent : C.badge,
                    color: dateRange === r.key ? '#fff' : C.text,
                    borderColor: dateRange === r.key ? C.accent : C.border,
                  }}>{r.label}</button>
                ))}
                <input
                  value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search name, phone, city..."
                  style={searchInput}
                />
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={tbl}>
                <thead><tr style={thRow}>
                  <TH>Order ID</TH><TH>Customer</TH><TH>Products</TH><TH>Delivery Address</TH><TH align="right">Total</TH><TH>Payment</TH><TH>Status</TH><TH>Date & Time</TH>
                </tr></thead>
                <tbody>
                  {filteredOrders.map((o, i) => (
                    <tr key={i} style={tdRow}>
                      <TD><span style={orderIdBadge}>{o.orderId || `#${i + 1}`}</span></TD>
                      <TD>
                        <strong>{o.userName || '—'}</strong>
                        <br /><small style={{ color: C.sub }}>{o.userPhone}</small>
                        {o.userEmail && <><br /><small style={{ color: C.light, fontSize: 11 }}>{o.userEmail}</small></>}
                      </TD>
                      <TD>
                        <div style={{ maxWidth: 180 }}>
                          {(o.items || []).map((it, j) => (
                            <div key={j} style={itemPill}>{it.name} x{it.quantity || 1}</div>
                          ))}
                        </div>
                      </TD>
                      <TD>
                        {o.address && o.address.address1 ? (
                          <div style={{ maxWidth: 200, fontSize: 13, lineHeight: 1.5 }}>
                            <strong>{o.address.name}</strong><br />
                            {o.address.address1}<br />
                            {o.address.address2 && <>{o.address.address2}<br /></>}
                            {o.address.city}
                            {o.address.phone && <><br /><small style={{ color: C.sub }}>Ph: {o.address.phone}</small></>}
                          </div>
                        ) : <span style={{ color: C.light }}>—</span>}
                      </TD>
                      <TD align="right" style={{ fontWeight: 700, color: C.accent, fontSize: 15 }}>{rupee(o.total)}</TD>
                      <TD><PayBadge method={o.paymentMethod} /></TD>
                      <TD>
                        <select
                          value={o.status || 'confirmed'}
                          onChange={e => updateOrderStatus(o.orderId, e.target.value)}
                          style={{
                            ...statusSelect,
                            background: statusColors[o.status || 'confirmed']?.bg || '#E8F5E9',
                            color: statusColors[o.status || 'confirmed']?.fg || C.green,
                          }}
                        >
                          <option value="confirmed">Confirmed</option>
                          <option value="preparing">Preparing</option>
                          <option value="out">Out for Delivery</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </TD>
                      <TD style={{ fontSize: 12, color: C.sub, whiteSpace: 'nowrap' }}>{fmtTime(o.timestamp)}</TD>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredOrders.length === 0 && <Empty msg={dateRange !== 'all' ? `No orders found for "${dateRange}" filter` : 'No orders yet'} />}
          </div>
        )}

        {/* ═══════ CUSTOMERS TAB ═══════ */}
        {tab === 'customers' && (
          <div style={cardStyle}>
            <div style={cardHeader}>
              <span style={{ fontWeight: 700, fontSize: 15 }}>All Customers ({customers.length})</span>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={tbl}>
                <thead><tr style={thRow}>
                  <TH>#</TH><TH>Name</TH><TH>Phone</TH><TH>Email</TH><TH align="center">Orders</TH><TH align="right">Total Spent</TH><TH align="center">Addresses</TH><TH>Last Order</TH>
                </tr></thead>
                <tbody>
                  {customers.map((u, i) => (
                    <tr key={i} style={tdRow}>
                      <TD style={{ color: C.light, fontSize: 12 }}>{i + 1}</TD>
                      <TD style={{ fontWeight: 600 }}>{u.name || '—'}</TD>
                      <TD>{u.phone || '—'}</TD>
                      <TD style={{ color: C.sub, fontSize: 13 }}>{u.email || '—'}</TD>
                      <TD align="center"><span style={{ ...countBadge, background: C.accent, color: '#fff' }}>{u.orderCount || 0}</span></TD>
                      <TD align="right" style={{ fontWeight: 700, color: C.accent }}>{rupee(u.totalSpent || 0)}</TD>
                      <TD align="center"><span style={{ ...countBadge, background: C.badge, color: C.accent }}>{u.addressCount || 0}</span></TD>
                      <TD style={{ fontSize: 12, color: C.sub, whiteSpace: 'nowrap' }}>{fmtTime(u.lastOrder || u.updatedAt)}</TD>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {customers.length === 0 && <Empty msg="No customer data yet" />}
          </div>
        )}
      </main>
    </div>
  );
}

/* ─── tiny components ─── */
function KPI({ label, value, sub, color }) {
  return (
    <div style={{ ...cardStyle, padding: '24px 28px', borderLeft: `4px solid ${color}` }}>
      <div style={{ fontSize: 12, color: C.sub, fontWeight: 600, textTransform: 'uppercase', letterSpacing: .8 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 800, marginTop: 6, color: C.text }}>{value}</div>
      <div style={{ fontSize: 12, color: C.light, marginTop: 4 }}>{sub}</div>
    </div>
  );
}

function PayBadge({ method }) {
  const m = (method || 'cod').toUpperCase();
  const bg = m === 'COD' ? '#E8F5E9' : '#E3F2FD';
  const fg = m === 'COD' ? C.green : '#1565C0';
  return <span style={{ background: bg, color: fg, padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>{m}</span>;
}



function Empty({ msg }) {
  return <div style={{ textAlign: 'center', padding: '48px 20px', color: C.light, fontSize: 14 }}>{msg}</div>;
}

function TH({ children, align }) {
  return <th style={{ padding: '12px 16px', textAlign: align || 'left', fontSize: 11, fontWeight: 700, color: C.sub, textTransform: 'uppercase', letterSpacing: .5, whiteSpace: 'nowrap' }}>{children}</th>;
}
function TD({ children, align, style }) {
  return <td style={{ padding: '14px 16px', textAlign: align || 'left', verticalAlign: 'top', ...style }}>{children}</td>;
}

/* ─── style objects ─── */
const loginWrap = { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.bg, fontFamily: font };
const loginCard = { padding: '48px 36px', background: '#fff', borderRadius: 16, boxShadow: '0 20px 60px rgba(44,24,16,.08)', width: '100%', maxWidth: 380, textAlign: 'center', border: `1px solid ${C.border}` };
const inputStyle = { width: '100%', padding: '14px 18px', border: `1px solid ${C.border}`, borderRadius: 10, fontSize: 15, background: C.badge, outline: 'none', fontFamily: font, boxSizing: 'border-box', marginBottom: 16 };
const loginBtn = { width: '100%', padding: 14, background: C.accent, color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: font };

const sidebar = { width: 240, background: C.sidebar, display: 'flex', flexDirection: 'column', flexShrink: 0, minHeight: '100vh' };
const navItem = { display: 'flex', alignItems: 'center', width: '100%', padding: '12px 18px', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: 'pointer', textAlign: 'left', background: 'transparent', fontFamily: font, transition: 'background .15s' };
const navBadge = { marginLeft: 'auto', background: 'rgba(255,255,255,.15)', color: 'rgba(255,255,255,.7)', padding: '2px 10px', borderRadius: 12, fontSize: 11, fontWeight: 700 };

const refreshBtn = { padding: '10px 24px', background: C.accent, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: font };
const linkBtn = { background: 'none', border: 'none', color: C.accent, fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: font };

const kpiGrid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 16, marginBottom: 24 };
const cardStyle = { background: '#fff', borderRadius: 14, border: `1px solid ${C.border}`, overflow: 'hidden', marginBottom: 20 };
const cardHeader = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 24px', borderBottom: `1px solid ${C.border}` };

const tbl = { width: '100%', borderCollapse: 'collapse' };
const thRow = { background: '#FAFAFA', borderBottom: `2px solid ${C.border}` };
const tdRow = { borderBottom: `1px solid ${C.border}` };

const orderIdBadge = { background: C.badge, padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600, color: C.accent, fontFamily: 'monospace', whiteSpace: 'nowrap' };
const countBadge = { display: 'inline-block', minWidth: 28, padding: '3px 10px', borderRadius: 20, fontSize: 13, fontWeight: 700, textAlign: 'center' };
const itemPill = { display: 'inline-block', padding: '3px 10px', background: C.badge, borderRadius: 6, fontSize: 12, marginRight: 4, marginBottom: 4 };
const filterBtn = { padding: '6px 16px', border: '1px solid', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: font, transition: 'all .15s' };
const searchInput = { padding: '7px 16px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: font, minWidth: 200 };

const statusColors = {
  confirmed: { bg: '#E8F5E9', fg: '#2E7D32' },
  preparing: { bg: '#FFF3E0', fg: '#E65100' },
  out: { bg: '#E3F2FD', fg: '#1565C0' },
  delivered: { bg: '#E8F5E9', fg: '#1B5E20' },
  cancelled: { bg: '#FFEBEE', fg: '#C62828' },
};
const statusSelect = { padding: '5px 10px', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: font, outline: 'none' };

export default AdminDashboard;
