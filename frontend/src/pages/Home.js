import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";

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
    { title: "Made at Home", desc: "Lovingly prepared in our home kitchen. No factory processes, no shortcuts." },
    { title: "No Preservatives", desc: "100% natural ingredients. No artificial colours, flavours, or chemicals added." },
    { title: "Fresh Every Day", desc: "Prepared fresh every morning. We never sell stale or day-old products." },
    { title: "Authentic Recipes", desc: "Traditional Maharashtrian recipes passed down across three generations." },
    { title: "Mumbai Delivery", desc: "Same-day delivery across Mumbai. Order before 10 AM for today's batch." },
    { title: "Fair Pricing", desc: "Quality food at honest prices. No markups — just home-cooked goodness." },
  ];

  const STEPS = [
    { step: "01", title: "Browse the Menu", desc: "Explore our selection of namkin, ladoos, and traditional sweets." },
    { step: "02", title: "Add to Cart", desc: "Select quantities and add your favourite items to the cart." },
    { step: "03", title: "Enter Address", desc: "Provide your delivery address anywhere in Mumbai." },
    { step: "04", title: "Receive Fresh", desc: "Your freshly prepared order arrives at your doorstep." },
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
            <a href="tel:9825121370" className="btn-secondary">Call to Order</a>
          </div>
        </div>
        <div
          className="hero-image"
          style={{ backgroundImage: `url(${process.env.PUBLIC_URL}/fire.jpg)` }}
        />
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

      {/* ── WHY CHOOSE US ── */}
      <section className="section">
        <h2 className="section-title">Why Families Choose Us</h2>
        <div className="feature-grid">
          {FEATURES.map(({ title, desc }) => (
            <div key={title} className="feature-card card">
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
        Call or WhatsApp: <strong>98251 21370</strong>
      </div>

    </div>
  );
}

export default Home;
