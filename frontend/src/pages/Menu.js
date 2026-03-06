import { useState, useEffect } from "react";

const PRODUCTS = [
  // NAMKIN
  { id: 1, name: "Bhajni Chakli", price: 650, unit: "1 KG", section: "NAMKIN", image: "/products/chakli.jpeg" },
  { id: 2, name: "Pohe Chivda", price: 450, unit: "1 KG", section: "NAMKIN", image: "/products/pohe.jpeg" },
  { id: 3, name: "Sadhi Shev", price: 420, unit: "1 KG", section: "NAMKIN", image: "/products/shev.jpeg" },
  { id: 4, name: "Tikhat Shev", price: 420, unit: "1 KG", section: "NAMKIN", image: "/products/shev.jpeg" },
  { id: 5, name: "Maka Chivda", price: 450, unit: "1 KG", section: "NAMKIN", image: "/products/maka.jpeg" },
  { id: 6, name: "Bhajke Pohe Chivda", price: 500, unit: "1 KG", section: "NAMKIN", image: "/products/pohe.jpeg" },
  { id: 7, name: "Shankar Pali", price: 500, unit: "1 KG", section: "NAMKIN", image: "/products/shankarpali.jpeg" },
  { id: 8, name: "Namkin Shankar Pali", price: 450, unit: "1 KG", section: "NAMKIN", image: "/products/shankarpali.jpeg" },
  { id: 9, name: "Garlic Shev", price: 500, unit: "1 KG", section: "NAMKIN", image: "/products/shev.jpeg" },

  // SWEET LADOO
  { id: 10, name: "Besan Ladoo Organic Gul", price: 800, unit: "1 KG", section: "SWEET LADOO", image: "/products/besanladoo.jpeg" },
  { id: 11, name: "Besan Ladoo Sakhar", price: 750, unit: "1 KG", section: "SWEET LADOO", image: "/products/besan-sakhar.jpeg" },
  { id: 12, name: "Rava Ladoo", price: 700, unit: "1 KG", section: "SWEET LADOO", image: "/products/ravaladoo.jpeg" },
  { id: 13, name: "Daraba Ladoo", price: 800, unit: "1 KG", section: "SWEET LADOO", image: "products/ravaladoo.jpeg" },

  // HEALTH SPECIAL LADOO
  { id: 14, name: "Dink Dryfruits Ladoo", price: 1050, unit: "1 KG", section: "HEALTH SPECIAL LADOO", image: "products/dinkdryfruit.jpeg" },
  { id: 15, name: "Methi Dink Dryfruits Ladoo", price: 1050, unit: "1 KG", section: "HEALTH SPECIAL LADOO", image: "products/dinkdryfruit.jpeg" },
  { id: 16, name: "Nachni Ladoo", price: 800, unit: "1 KG", section: "HEALTH SPECIAL LADOO", image: "products/nachniladoo.jpeg" },
  { id: 18, name: "Aliv Ladoo", price: 700, unit: "1 KG", section: "HEALTH SPECIAL LADOO", image: "products/ravaladoo.jpeg" },
  { id: 19, name: "Makhana Oats Dryfruits Ladoo", price: 1100, unit: "1 KG", section: "HEALTH SPECIAL LADOO", image: "products/makhanaladoo.jpeg" },

  // TRADITIONAL
  { id: 20, name: "Ukadiche Modak", price: 35, unit: "1 Piece", section: "TRADITIONAL", image: "products/modak.jpeg" },
  { id: 21, name: "Puran Poli", price: 40, unit: "1 Piece", section: "TRADITIONAL", image: "products/puranpoli.jpeg" },
  { id: 22, name: "Tilgul Poli", price: 40, unit: "1 Piece", section: "TRADITIONAL", image: "products/tilpoli.jpeg" },
  { id: 23, name: "Karanji", price: 800, unit: "1 KG", section: "TRADITIONAL", image: "products/karanji.jpeg" },
  { id: 24, name: "Home-made Cow Ghee", price: 1100, unit: "1 KG", section: "TRADITIONAL", image: "products/tup.jpeg" },
  { id: 25, name: "Anarse", price: 300, unit: "Pav KG", section: "TRADITIONAL", image: "products/anarase.jpeg" },
];

const SECTIONS = {
  NAMKIN: PRODUCTS.filter(p => p.section === "NAMKIN"),
  "SWEET LADOO": PRODUCTS.filter(p => p.section === "SWEET LADOO"),
  "HEALTH SPECIAL LADOO": PRODUCTS.filter(p => p.section === "HEALTH SPECIAL LADOO"),
  TRADITIONAL: PRODUCTS.filter(p => p.section === "TRADITIONAL"),
};

function Menu({ addToCart, searchTerm = "" }) {
  const [activeTab, setActiveTab] = useState("NAMKIN");
  const [quantities, setQuantities] = useState({});
  const [loading, setLoading] = useState(true);
  const [visibleCards, setVisibleCards] = useState([]);

  // Load quantities from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('menuQuantities');
    if (saved) setQuantities(JSON.parse(saved));
  }, []);

  // Save quantities to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('menuQuantities', JSON.stringify(quantities));
  }, [quantities]);

  // Load saved tab from localStorage
  useEffect(() => {
    const savedTab = localStorage.getItem('menuActiveTab');
    if (savedTab && SECTIONS[savedTab]) setActiveTab(savedTab);
  }, []);

  // Stagger-animate cards whenever active tab changes
  useEffect(() => {
    setLoading(true);
    setVisibleCards([]);
    const timer = setTimeout(() => {
      setLoading(false);
      const count = (SECTIONS[activeTab] || []).length;
      [...Array(count)].forEach((_, i) => {
        setTimeout(() => setVisibleCards(prev => [...prev, i]), i * 65);
      });
    }, 180);
    return () => clearTimeout(timer);
  }, [activeTab]);

  const updateActiveTab = (tab) => {
    setActiveTab(tab);
    localStorage.setItem('menuActiveTab', tab);
  };

  const updateQuantity = (id, change) => {
    setQuantities(prev => {
      const newQty = Math.max(0, (prev[id] || 0) + change);
      const updated = { ...prev, [id]: newQty };
      localStorage.setItem('menuQuantities', JSON.stringify(updated));
      return updated;
    });
  };

  // Filter for search or show active tab
  const allProducts = Object.values(SECTIONS).flat();
  const products = searchTerm
    ? allProducts.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
    : SECTIONS[activeTab] || [];

  return (
    <>
      <h2 className="page-title">Our Menu</h2>

      {/* Category tabs — hidden while searching */}
      {!searchTerm && (
        <div className="menu-tabs">
          {Object.keys(SECTIONS).map(tab => (
            <button
              key={tab}
              className={`tab-btn ${activeTab === tab ? "active" : ""}`}
              onClick={() => updateActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
      )}

      {/* Search result count */}
      {searchTerm && (
        <div className="search-results-info">
          Found {products.length} item{products.length !== 1 ? "s" : ""} matching &ldquo;{searchTerm}&rdquo;
        </div>
      )}

      {/* Spinner during tab transition */}
      {loading && !searchTerm && <div className="spinner" />}

      {/* Products grid */}
      {(!loading || searchTerm) && (
        <div className="grid">
          {products.map((item, idx) => {
            const qty = quantities[item.id] || 0;
            const visible = searchTerm ? true : visibleCards.includes(idx);
            return (
              <div
                key={item.id}
                className="card menu-card"
                style={{
                  opacity: visible ? 1 : 0,
                  transform: visible ? "translateY(0)" : "translateY(20px)",
                  transition: "opacity 0.4s ease, transform 0.4s ease",
                  transitionDelay: `${idx * 0.04}s`,
                }}
              >
                {item.image ? (
                  <div
                    className="menu-card-image"
                    style={{
                      backgroundImage: `url(${item.image})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      backgroundColor: 'transparent'
                    }}
                  />
                ) : (
                  <div className="menu-card-image" />
                )}
                <div className="menu-item-name">{item.name}</div>
                <div className="menu-item-price">
                  ₹{item.price} <span className="unit">/ {item.unit}</span>
                </div>

                <div className="quantity-controls">
                  <button className="qty-btn" onClick={() => updateQuantity(item.id, -1)} disabled={qty <= 0}>−</button>
                  <span className="qty-display">{qty}</span>
                  <button className="qty-btn" onClick={() => updateQuantity(item.id, 1)}>+</button>
                </div>

                <button
                  className="menu-add-btn"
                  onClick={() => qty > 0 && addToCart({ ...item, quantity: qty })}
                  disabled={qty === 0}
                >
                  {qty > 0 ? `Add ${qty} to Cart` : "Add to Cart"}
                </button>
              </div>
            );
          })}
        </div>
      )}

      <div className="text-box">
        <p><strong>📞 Contact:</strong> 98251 21370 | WhatsApp for bulk orders</p>
      </div>
    </>
  );
}

export default Menu;
