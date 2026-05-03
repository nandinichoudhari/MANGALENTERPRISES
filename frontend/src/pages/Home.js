import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { FiStar, FiHome, FiShield, FiClock, FiHeart, FiTruck, FiTag } from "react-icons/fi";

function useCountUp(target, duration, active) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!active) return;
    const t0 = Date.now();
    const id = setInterval(() => {
      const p = Math.min((Date.now() - t0) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setCount(Math.floor(eased * target));
      if (p >= 1) { setCount(target); clearInterval(id); }
    }, 16);
    return () => clearInterval(id);
  }, [active, target, duration]);
  return count;
}

function Home() {
  const [statsVisible, setStatsVisible] = useState(false);
  const statsRef = useRef(null);

  const orders = useCountUp(1200, 2000, statsVisible);
  const customers = useCountUp(850, 2200, statsVisible);
  const years = useCountUp(8, 1500, statsVisible);
  const items = useCountUp(25, 1800, statsVisible);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setStatsVisible(true); },
      { threshold: 0.3 }
    );
    if (statsRef.current) obs.observe(statsRef.current);
    return () => obs.disconnect();
  }, []);

  const STATS = [
    { num: orders, suffix: "+", label: "Orders Delivered" },
    { num: customers, suffix: "+", label: "Satisfied Customers" },
    { num: years, suffix: " yrs", label: "Years of Tradition" },
    { num: items, suffix: "+", label: "Menu Items" },
  ];

  const FEATURES = [
    { title: "Made at Home", icon: <FiHome />, desc: "Lovingly prepared in our home kitchen. No factory processes, no shortcuts." },
    { title: "No Preservatives", icon: <FiShield />, desc: "100% natural ingredients. No artificial colours, flavours, or chemicals added." },
    { title: "Fresh Every Day", icon: <FiClock />, desc: "Prepared fresh every morning. We never sell stale or day-old products." },
    { title: "Authentic Recipes", icon: <FiHeart />, desc: "Traditional Maharashtrian recipes passed down across three generations." },
    { title: "Mumbai Delivery", icon: <FiTruck />, desc: "Same-day delivery across Mumbai. Order before 10 AM for today's batch." },
    { title: "Fair Pricing", icon: <FiTag />, desc: "Quality food at honest prices. No markups — just home-cooked goodness." },
  ];

  const STEPS = [
    { step: "01", title: "Browse the Menu", desc: "Explore our selection of namkin, ladoos, and traditional sweets." },
    { step: "02", title: "Add to Cart", desc: "Select quantities and add your favourite items to the cart." },
    { step: "03", title: "Enter Address", desc: "Provide your delivery address anywhere in Mumbai." },
    { step: "04", title: "Receive Fresh", desc: "Your freshly prepared order arrives at your doorstep." },
  ];

  const SPECIALTIES = [
    { name: "Authentic Puranpoli", desc: "Melt-in-mouth sweet flatbread", image: "puranpoli.jpeg" },
    { name: "Ukadiche Modak", desc: "Steamed sweet coconut dumplings", image: "modak.jpeg" },
    { name: "Crispy Chakli", desc: "Crunchy & perfectly spiced", image: "chakli.jpeg" },
    { name: "Spicy Bhakarwadi", desc: "Tangy and sweet crispy rolls", image: "bhakarwadi.jpeg" },
    { name: "Kothimbir Vadi", desc: "Crispy coriander snack", image: "kothimbirvadi.jpeg" },
    { name: "Besan Ladoo", desc: "Rich roasted gram flour sweets", image: "besanladoo.jpeg" },
    { name: "Khajur Pak", desc: "Healthy dates & dry fruit sweet", image: "khajurpak.jpeg" },
    { name: "Crunchy Shev", desc: "Spicy and savory snack", image: "shev.jpeg" },
  ];

  return (
    <div className="home-page">

      {/* ── HERO ── */}
      <section className="hero">
        <div className="hero-text">
          <span className="hero-label">Mangal Enterprises · Mumbai</span>
          <h1 className="hero-headline">
            Authentic Maharashtrian Food,<br />Prepared Fresh Daily
          </h1>
          <p className="hero-desc">
            Traditional recipes passed down through generations. Perfect for tiffin,
            festival faral, and everyday home-style meals. No preservatives, ever.
          </p>
          <div className="hero-actions">
            <Link to="/menu" className="btn-primary">View Menu &amp; Order</Link>
            <a href="https://wa.me/919892512137" target="_blank" rel="noopener noreferrer" className="btn-secondary">Call / WhatsApp to Order</a>
          </div>
          <div className="delivery-partners" style={{ justifyContent: 'flex-start', marginTop: '24px' }}>
            <p style={{ width: '100%', fontWeight: '700', fontSize: '14px', marginBottom: '8px', color: '#6b2f1a' }}>Or order via:</p>
            <a href="https://www.swiggy.com/direct/brand/370609?source=swiggy-direct&subSource=generic" className="btn-swiggy" target="_blank" rel="noopener noreferrer">Swiggy</a>
            <a href="https://zomato.onelink.me/xqzv/9t209xqk" className="btn-zomato" target="_blank" rel="noopener noreferrer">Zomato</a>
          </div>
        </div>
        <div className="hero-image-wrapper">
          <div
            className="hero-image"
            style={{ backgroundImage: `url(${process.env.PUBLIC_URL}/products/puranpoli.jpeg)` }}
          />
          <div className="hero-floating-badge">
            <FiStar size={24} color="#f97316" />
            <div>100% Homemade<br/>Maharashtrian</div>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="home-stats" ref={statsRef}>
        {STATS.map(({ num, suffix, label }) => (
          <div key={label} className="home-stat">
            <div className="home-stat-num">{num.toLocaleString()}{suffix}</div>
            <div className="home-stat-label">{label}</div>
          </div>
        ))}
      </section>

      {/* ── OUR SPECIALTIES ── */}
      <section className="section specialties-section">
        <h2 className="section-title">Drool-Worthy Delicacies</h2>
        <p className="section-subtitle-center">Taste the authentic flavours of Maharashtra</p>
        <div className="specialties-grid">
          {SPECIALTIES.map((item) => (
            <div key={item.name} className="specialty-card">
              <div 
                className="specialty-image" 
                style={{ backgroundImage: `url(${process.env.PUBLIC_URL}/products/${item.image})` }}
              >
                <div className="specialty-overlay">
                  <Link to="/menu" className="specialty-btn">Order Now</Link>
                </div>
              </div>
              <div className="specialty-info">
                <h4 className="specialty-name">{item.name}</h4>
                <p className="specialty-desc">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── WHY CHOOSE US ── */}
      <section className="section">
        <h2 className="section-title">Why Families Choose Us</h2>
        <div className="feature-grid">
          {FEATURES.map(({ title, icon, desc }) => (
            <div key={title} className="feature-card card">
              <div className="feature-icon-wrapper" style={{ fontSize: '24px', color: '#ea580c', marginBottom: '12px' }}>
                {icon}
              </div>
              <h4 className="feature-title">{title}</h4>
              <p className="feature-desc">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW TO ORDER ── */}
      <section className="section how-section">
        <h2 className="section-title">How to Order</h2>
        <div className="steps-row">
          {STEPS.map(({ step, title, desc }) => (
            <div key={step} className="step-item">
              <div className="step-num">{step}</div>
              <h4 className="step-title">{title}</h4>
              <p className="step-desc">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="home-cta">
        <h2>Ready to order?</h2>
        <p>Browse our full menu and place your order today. Fresh batches every morning.</p>
        <Link to="/menu" className="btn-primary">View Full Menu</Link>
      </section>

      {/* ── CONTACT STRIP ── */}
      <div className="home-contact-strip">
        Call or WhatsApp: <strong><a href="https://wa.me/919892512137" target="_blank" rel="noopener noreferrer" style={{color: 'inherit', textDecoration: 'none'}}>98925 12137</a></strong>
      </div>

    </div>
  );
}

export default Home;
