import { ShoppingBag } from "lucide-react";
import { useCart } from "../context/CartContext.jsx";

export default function Header({ onCartOpen }) {
  const { itemCount } = useCart();

  return (
    <header className="site-header">
      <a className="brand" href="#home" aria-label="Tehilla Fabrics home">
        <span className="brand-mark" aria-hidden="true">T</span>
        <span className="brand-name">Tehilla <span>Fabrics</span></span>
      </a>
      <nav className="main-nav" aria-label="Main navigation">
        <a href="#shop">Shop</a>
        <a href="#how-to-order">How to order</a>
        <a href="#contact">Contact</a>
      </nav>
      <button className="cart-button" onClick={onCartOpen} aria-label={`Open cart, ${itemCount} items`}>
        <ShoppingBag size={20} aria-hidden="true" />
        <span className="cart-button-label">Cart</span>
        <span className="cart-count" aria-live="polite">{itemCount}</span>
      </button>
    </header>
  );
}
