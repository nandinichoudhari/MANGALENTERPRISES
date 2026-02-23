import { useLocation } from "react-router-dom";
import Menu from "../components/Menu";
import { useState } from "react";
import { addToCart } from "../components/cart"; // Adjust path to your cart.js

function MenuPage() {
  const location = useLocation();
  const searchTerm = location.state?.searchTerm || "";
  const [cart, setCart] = useState([]); // Local cart state for menu

  // 🔥 Proper addToCart handler that saves to localStorage
  const handleAddToCart = (newItem) => {
    // Load current cart from localStorage
    const currentCart = JSON.parse(localStorage.getItem('cart') || '[]');
    const updatedCart = addToCart(currentCart, newItem);
    
    // Save to localStorage and show confirmation
    localStorage.setItem('cart', JSON.stringify(updatedCart));
    alert(`${newItem.quantity} x ${newItem.name} added to cart!`);
  };

  return (
    <div className="page-content">
      <Menu addToCart={handleAddToCart} searchTerm={searchTerm} />
    </div>
  );
}

export default MenuPage;
