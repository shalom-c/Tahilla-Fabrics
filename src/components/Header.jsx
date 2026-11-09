import { ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export default function Header({ onCartOpen }) {
  const { itemCount } = useCart();
  const { user, role, cachedProfile, logout } = useAuth();
  const displayName = user?.displayName || cachedProfile?.name || user?.email || "there";
  const isAdmin = role === "admin" || (!user && cachedProfile?.role === "admin");

  return (
    <header className="site-header">
      <Link className="brand" to="/shop" aria-label="Tehilla Fabrics home">
        <span className="brand-mark" aria-hidden="true">T</span>
        <span className="brand-name">Tehilla <span>Fabrics</span></span>
      </Link>
      <nav className="main-nav" aria-label="Main navigation">
        <Link to="/shop#shop">Shop</Link>
        <Link to="/shop#how-to-order">How to order</Link>
        <Link to="/shop#contact">Contact</Link>
      </nav>
      <div className="header-actions">
        {user || cachedProfile ? (
          <>
            <span className="header-greeting">Hi, {displayName.split(" ")[0].split("@")[0]}</span>
            {isAdmin && <Link className="header-link" to="/admin">Admin</Link>}
            <button className="header-auth-button" onClick={() => logout().catch((error) => console.error("Could not log out.", error))}>Logout</button>
          </>
        ) : (
          <>
            <Link className="header-auth-button" to="/login">Login</Link>
            <Link className="button button-primary header-signup" to="/signup">Get Started</Link>
          </>
        )}
        <button className="cart-button" onClick={onCartOpen} aria-label={`Open cart, ${itemCount} items`}>
          <ShoppingBag size={20} aria-hidden="true" />
          <span className="cart-button-label">Cart</span>
          <span className="cart-count" aria-live="polite">{itemCount}</span>
        </button>
      </div>
    </header>
  );
}
