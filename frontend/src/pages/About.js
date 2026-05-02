import React from 'react';
import { Link } from 'react-router-dom';

const STORY_CHAPTERS = [
  { year: "2016", title: "A Small Order That Started It All", desc: "It started with just a handful of Methi Dink Ladoos — made by hand, packed with love, delivered to a neighbour. Word spread quietly, the way good food always does." },
  { year: "2017–19", title: "The Kitchen Everyone Talked About", desc: "Mangal Choudhari had always been the best cook in the neighbourhood. Her chakli, her ladoos, her modak — every dish became a signature. Neighbours would find any excuse to come over. Soon they started asking: 'Can we order this?'" },
  { year: "2020", title: "When the World Stopped, We Kept Going", desc: "Mumbai locked down. Shops closed. And one elderly man — sick, alone, COVID-positive — had no one to bring him food. Mangal tai and her husband Dnyandeo didn't hesitate. They put on their masks, picked up the food, and went. Because some things are bigger than fear.", highlight: "Those customers from 2020 still call — not to order, just to give blessings." },
  { year: "After 2020", title: "A Real Purpose Found Us", desc: "The real motto found Mangal tai — not the other way around. She wanted to help people eat better. Replace oily, preserved, junk food with something wholesome, homemade, and honest. Reasonably priced. Made with the same care she'd give her own family." },
  { year: "Growing", title: "20 People. Real Income. Real Lives.", desc: "We didn't just grow a business — we created a livelihood for nearly 20 people. Every team member is trained in hygiene and food safety. And even today, Mangal tai is personally in the kitchen for almost every batch." },
  { year: "Today", title: "100s to 1000s of Customers", desc: "From a first-floor kitchen in Mumbai to thousands of homes — every order is still made the same way. Mangal tai's way. We're not a factory. We're a family. And now we're bringing this family online." },
];

function About() {
  return (
    <div className="about-page">

      {/* ── HEADER ── */}
      <section className="about-header">
        <h1 className="about-main-title">About Mangal Mahila Gruha Udyog</h1>
        <p className="about-tagline">पौष्टिक खा, निरोगी राहा — Eat Nutritious, Stay Healthy</p>
      </section>

      {/* ── FOUNDER ── */}
      <section className="founder-section section">
        <div className="founder-card">
          <div className="founder-avatar-photo" style={{ backgroundImage: `url(${process.env.PUBLIC_URL}/aboutus/mangal-profile.jpg)` }} />
          <div className="founder-text">
            <p className="founder-label">The Heart Behind Every Dish</p>
            <h2 className="founder-name">Mangal Choudhari</h2>
            <p className="founder-desc">
              She never learned cooking from a book — it came from her mother, who learned from hers. Every chakli she rolls, every ladoo she shapes, carries that same thread of heritage. Her husband, <strong>Dnyandeo Choudhari</strong>, has stood beside her through every order, every delivery, every late night in the kitchen.
            </p>
            <p className="founder-desc">Together, they've built not just a business — but a household name in their community.</p>
            <ul className="founder-bullets">
              <li>Homemade — every item from our own kitchen</li>
              <li>No preservatives, no artificial colours or flavours</li>
              <li>Prepared fresh daily, never sold stale</li>
              <li>Mangal tai personally oversees every batch</li>
            </ul>
          </div>
        </div>
      </section>

      {/* ── STORY CHAPTERS ── */}
      <section className="about-timeline section story-journey-section">
        <div className="story-journey-header">
          <h2 className="section-title">Our Journey</h2>
          <p className="section-subtitle">A heritage of taste, built step by step</p>
        </div>
        <div className="story-chapters">
          {STORY_CHAPTERS.map((chapter, i) => (
            <div key={i} className="story-chapter">
              <div className="chapter-year-block">
                <span className="chapter-year">{chapter.year}</span>
              </div>
              <div className="chapter-content">
                <h4 className="chapter-title">{chapter.title}</h4>
                <p className="chapter-desc">{chapter.desc}</p>
                {chapter.highlight && <div className="chapter-highlight">"{chapter.highlight}"</div>}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── ACHIEVEMENTS ── */}
      <section className="about-achievements section">
        <h2 className="section-title">Achievements</h2>

        {/* The numeric stats without photos */}
        <div className="achieve-grid" style={{ marginBottom: '32px' }}>
          <div className="achieve-card">
            <span className="achieve-num">1000+</span>
            <span className="achieve-label">Happy Customers</span>
          </div>
          <div className="achieve-card">
            <span className="achieve-num">8 yrs</span>
            <span className="achieve-label">Years in Business</span>
          </div>
          <div className="achieve-card">
            <span className="achieve-num">20+</span>
            <span className="achieve-label">People Employed</span>
          </div>
          <div className="achieve-card">
            <span className="achieve-num">50+</span>
            <span className="achieve-label">Menu Items</span>
          </div>
        </div>

        {/* The proud moments & awards photos */}
        <div className="media-grid">
          <div className="media-card">
            <img className="media-element" src={`${process.env.PUBLIC_URL}/aboutus/proud_moment.png`} alt="A Proud Moment" />
            <div className="media-overlay"><span>A Proud Moment</span></div>
          </div>
          <div className="media-card">
            <img className="media-element" src={`${process.env.PUBLIC_URL}/aboutus/poud_moment2.png`} alt="Recognition & Joy" />
            <div className="media-overlay"><span>Recognition & Joy</span></div>
          </div>
          <div className="media-card">
            <img className="media-element" src={`${process.env.PUBLIC_URL}/aboutus/maharashtra_ratna.jpg`} alt="Maharashtra Ratna" />
            <div className="media-overlay"><span>Maharashtra Ratna</span></div>
          </div>
        </div>
      </section>

      {/* ── A GLIMPSE INTO OUR KITCHEN (Merged with BTS) ── */}
      <section className="about-glimpse section">
        <h2 className="section-title">A Glimpse Into Our Kitchen</h2>
        <div className="media-grid">
          <div className="media-card">
            <img className="media-element" src={`${process.env.PUBLIC_URL}/aboutus/methidinkladoo.jpg`} alt="Methi Dink Ladoo" />
            <div className="media-overlay"><span>Methi Dink Ladoo</span></div>
          </div>
          <div className="media-card">
            <img className="media-element" src={`${process.env.PUBLIC_URL}/aboutus/puranpoli.jpg`} alt="Puran Poli Prep" />
            <div className="media-overlay"><span>Puran Poli Prep</span></div>
          </div>
          <div className="media-card">
            <video
              className="media-element"
              autoPlay
              muted
              loop
              playsInline
              src={`${process.env.PUBLIC_URL}/aboutus/prep.mp4`}
            >
              Your browser does not support the video tag.
            </video>
            <div className="media-overlay"><span>Kitchen Prep</span></div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="about-cta">
        <div className="about-cta-inner">
          <h2>You're not just ordering food. You're becoming family.</h2>
          <p>Every order is a blessing we receive. Thank you for being here.</p>
          <div className="about-cta-actions">
            <Link to="/menu" className="btn-primary">Browse the Menu</Link>
            <a href="https://wa.me/919892512137" target="_blank" rel="noopener noreferrer" className="btn-secondary">WhatsApp Us</a>
          </div>
        </div>
      </section>

    </div>
  );
}

export default About;
