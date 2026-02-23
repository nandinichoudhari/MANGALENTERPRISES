import "./Navbar.css";
import { Link, useNavigate } from "react-router-dom";
import { FiShoppingBag, FiPhone, FiSearch, FiX, FiUser } from "react-icons/fi";
import { useState, useEffect } from "react";

const Navbar = ({ cartCount }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [currentUserName, setCurrentUserName] = useState("User");  // ✅ NEW STATE
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);

  useEffect(() => {
    const savedProducts = localStorage.getItem('menuProducts');
    if (savedProducts) {
      setProducts(JSON.parse(savedProducts));
    }
  }, []);

  // ✅ NEW: Load user name on mount
  useEffect(() => {
    // login.js saves 'userName', EmailLogin.js saves 'currentUserName'
    const name = localStorage.getItem('userName') || localStorage.getItem('currentUserName') || 'User';
    setCurrentUserName(name);
  }, []);

  useEffect(() => {
    if (searchTerm.length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }
    const results = products.filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 5);
    setSearchResults(results);
    setShowResults(true);
  }, [searchTerm, products]);

  const handleSearchSelect = (item) => {
    setSearchTerm(item.name);
    setShowResults(false);
    navigate("/menu", { state: { searchTerm: item.name } });
  };

  // ✅ UPDATED LOGOUT - Email multi-user compatible
  const handleLogout = () => {
    localStorage.removeItem("currentUserEmail");    // ✅ Clear EMAIL ID
    localStorage.removeItem("currentUserName");     // ✅ Clear NAME
    localStorage.removeItem("loggedIn");
    localStorage.removeItem("phone");
    localStorage.removeItem("cart");
    localStorage.removeItem("selectedAddress");     // Clear temp checkout data
    // User-specific addresses stay safe! (addresses_john@gmail.com)
    window.location.reload();
  };

  const isLoggedIn = localStorage.getItem("loggedIn") === "true";

  return (
    <>
      <div className="logo-space">
        <img
          src={`${process.env.PUBLIC_URL}/logo-removebg-preview.png`}
          alt="Mangal Enterprises"
          className="logo-img"
        />
        <h1 className="brand-name">Mangal Enterprises</h1>
      </div>

      <div className="navbar">
        <div className="nav-left">
          <div className="search-container">
            <FiSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search Bhajni Chakli, Ladoo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
              onFocus={() => searchResults.length > 0 && setShowResults(true)}
            />
            {searchTerm && (
              <FiX
                className="search-clear"
                onClick={() => {
                  setSearchTerm("");
                  setShowResults(false);
                }}
              />
            )}
            {showResults && searchResults.length > 0 && (
              <div className="search-dropdown">
                {searchResults.map((item) => (
                  <div key={item.id} className="search-result" onClick={() => handleSearchSelect(item)}>
                    <div className="result-image" style={{ backgroundColor: '#e0cfb3' }} />
                    <div className="result-info">
                      <div className="result-name">{item.name}</div>
                      <div className="result-price">₹{item.price}/{item.unit}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Link to="/" className="nav-link nav-home">Home</Link>
          <Link to="/menu" className="nav-link">Menu</Link>
          <Link to="/about" className="nav-link">About</Link>
          <Link to="/contact" className="nav-link">Contact</Link>
        </div>

        <div className="nav-right">
          <Link to="/cart" className="nav-link cart-pill">
            <FiShoppingBag size={18} />
            Cart ({cartCount || 0})
          </Link>

          {/* ✅ PERFECT: Shows FIRST NAME instead of "User"! */}
          {isLoggedIn ? (
            <>
              <Link to="/user" className="nav-link user-name">
                <FiUser size={16} /> {currentUserName}  {/* ✅ John, Jane, etc! */}
              </Link>
              <Link to="/" className="nav-link logout-link" onClick={handleLogout}>
                Logout
              </Link>
            </>
          ) : (
            <Link to="/login" className="nav-link">Login</Link>
          )}

          <a href="tel:9876543210" className="nav-phone-link">
            <FiPhone size={18} />
            Call
          </a>
        </div>
      </div>
    </>
  );
};

export default Navbar;
