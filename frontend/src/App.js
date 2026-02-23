// src/App.js - ADMIN NO NAVBAR + ALL ROUTES PERFECT
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Menu from "./pages/Menu";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Cart from "./pages/Cart";
import Login from "./pages/login";
import Order from "./pages/OrderConfirmation";
import Payment from "./pages/Payment";
import Address from "./pages/Address";
import OrderConfirmed from "./pages/OrderConfirmed";
import User from './pages/User';
import EmailLogin from './pages/EmailLogin';
import AdminDashboard from './AdminDashboard';

// 🔥 NAVBAR WRAPPER - HIDES ON ADMIN
function Layout({ children, cartCount, addToCart, cartItems, setCartItems }) {
  const location = useLocation();
  const hideNavbar = location.pathname === '/admin-panel';

  return (
    <div className="app-container">
      {!hideNavbar && <Navbar cartCount={cartCount()} />}
      <main className="page-content">{children}</main>
      {!hideNavbar && (
        <footer className="site-footer">
          © {new Date().getFullYear()} Mangal Enterprises – Authentic Maharashtrian Food
        </footer>
      )}
    </div>
  );
}

function App() {
  const [cartItems, setCartItems] = useState([]);

  // 🔥 LOAD cart from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('cart');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const validCart = Array.isArray(parsed)
          ? parsed.filter(item => item.id && item.price > 0 && item.name)
          : [];
        setCartItems(validCart);
        if (parsed.length !== validCart.length) {
          localStorage.setItem('cart', JSON.stringify(validCart));
        }
      } catch (e) {
        localStorage.removeItem('cart');
      }
    }
  }, []);

  // Sync cart state when another tab or login.js clears localStorage
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === 'cart') {
        const newVal = e.newValue ? JSON.parse(e.newValue) : [];
        setCartItems(Array.isArray(newVal) ? newVal : []);
      }
      if (e.key === null) {
        // localStorage.clear() was called — clear cart state too
        setCartItems([]);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // Sync cart state → localStorage (only save, never delete — deletion is handled by placeOrder)
  useEffect(() => {
    if (cartItems.length > 0) {
      localStorage.setItem('cart', JSON.stringify(cartItems));
    }
    // NOTE: Do NOT remove 'cart' here when cartItems is empty.
    // On first render cartItems is [] before the load effect runs,
    // which would wipe valid cart data that other pages (Payment) need.
  }, [cartItems]);

  const addToCart = (newItem) => {
    const existingItem = cartItems.find(item => item.id === newItem.id);
    if (existingItem) {
      setCartItems(prev => prev.map(item =>
        item.id === newItem.id
          ? { ...item, quantity: item.quantity + newItem.quantity }
          : item
      ));
    } else {
      setCartItems(prev => [...prev, { ...newItem, quantity: newItem.quantity || 1 }]);
    }
  };

  const getCartCount = () => {
    return cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0);
  };

  return (
    <BrowserRouter>
      <Routes>
        {/* 🔥 ALL WEBSITE PAGES WITH NAVBAR */}
        <Route path="/" element={
          <Layout cartCount={getCartCount} addToCart={addToCart} cartItems={cartItems} setCartItems={setCartItems}>
            <Home />
          </Layout>
        } />
        <Route path="/menu" element={
          <Layout cartCount={getCartCount} addToCart={addToCart} cartItems={cartItems} setCartItems={setCartItems}>
            <Menu addToCart={addToCart} />
          </Layout>
        } />
        <Route path="/about" element={
          <Layout cartCount={getCartCount} addToCart={addToCart} cartItems={cartItems} setCartItems={setCartItems}>
            <About />
          </Layout>
        } />
        <Route path="/contact" element={
          <Layout cartCount={getCartCount} addToCart={addToCart} cartItems={cartItems} setCartItems={setCartItems}>
            <Contact />
          </Layout>
        } />
        <Route path="/cart" element={
          <Layout cartCount={getCartCount} addToCart={addToCart} cartItems={cartItems} setCartItems={setCartItems}>
            <Cart items={cartItems} setItems={setCartItems} />
          </Layout>
        } />
        <Route path="/login" element={
          <Layout cartCount={getCartCount} addToCart={addToCart} cartItems={cartItems} setCartItems={setCartItems}>
            <Login />
          </Layout>
        } />
        <Route path="/user" element={
          <Layout cartCount={getCartCount} addToCart={addToCart} cartItems={cartItems} setCartItems={setCartItems}>
            <User />
          </Layout>
        } />
        <Route path="/address" element={
          <Layout cartCount={getCartCount} addToCart={addToCart} cartItems={cartItems} setCartItems={setCartItems}>
            <Address />
          </Layout>
        } />
        <Route path="/payment" element={
          <Layout cartCount={getCartCount} addToCart={addToCart} cartItems={cartItems} setCartItems={setCartItems}>
            <Payment />
          </Layout>
        } />
        <Route path="/order-confirmed" element={
          <Layout cartCount={getCartCount} addToCart={addToCart} cartItems={cartItems} setCartItems={setCartItems}>
            <OrderConfirmed />
          </Layout>
        } />
        <Route path="/order-confirmation" element={
          <Layout cartCount={getCartCount} addToCart={addToCart} cartItems={cartItems} setCartItems={setCartItems}>
            <Order />
          </Layout>
        } />
        <Route path="/email-login" element={
          <Layout cartCount={getCartCount} addToCart={addToCart} cartItems={cartItems} setCartItems={setCartItems}>
            <EmailLogin />
          </Layout>
        } />

        {/* 🔥 ADMIN PANEL - NO NAVBAR/FOOTER */}
        <Route path="/admin-panel" element={<AdminDashboard />} />

        {/* 🔥 CATCH-ALL */}
        <Route path="*" element={<Home />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
