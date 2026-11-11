import { Menu, ShoppingBag, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";

function AccountLinks({ user, displayName, isAdmin, logout, onNavigate }) {
  if (user) {
    return (
      <>
        <span className="header-greeting">Hi, {displayName.split(" ")[0].split("@")[0]}</span>
        {isAdmin && <Link className="header-link" to="/admin" onClick={onNavigate}>Admin</Link>}
        <button
          className="header-auth-button"
          onClick={() => {
            onNavigate?.();
            logout().catch((error) => console.error("Could not log out.", error));
          }}
        >
          Logout
        </button>
      </>
    );
  }

  return (
    <>
      <Link className="header-auth-button" to="/login" onClick={onNavigate}>Login</Link>
      <Link className="button button-primary header-signup" to="/signup" onClick={onNavigate}>Get Started</Link>
    </>
  );
}

export default function Header({ onCartOpen }) {
  const { itemCount } = useCart();
  const { user, role, cachedProfile, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuClosing, setMenuClosing] = useState(false);
  const displayName = user?.displayName || cachedProfile?.name || user?.email || "there";
  const isAdmin = Boolean(user) && role === "admin";

  useEffect(() => {
    if (!menuClosing) return undefined;
    const timeout = window.setTimeout(() => {
      setMenuOpen(false);
      setMenuClosing(false);
    }, 160);
    return () => window.clearTimeout(timeout);
  }, [menuClosing]);

  function closeMenu() {
    if (menuOpen && !menuClosing) setMenuClosing(true);
  }

  function toggleMenu() {
    if (menuOpen && !menuClosing) {
      setMenuClosing(true);
      return;
    }
    setMenuClosing(false);
    setMenuOpen(true);
  }

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
        <div className="header-account-links">
          <AccountLinks user={user} displayName={displayName} isAdmin={isAdmin} logout={logout} />
        </div>
        {onCartOpen && (
          <button className="cart-button" onClick={onCartOpen} aria-label={`Open cart, ${itemCount} items`}>
            <ShoppingBag size={20} aria-hidden="true" />
            <span className="cart-button-label">Cart</span>
            <span className="cart-count" aria-live="polite">{itemCount}</span>
          </button>
        )}
        <button
          className="mobile-menu-toggle"
          type="button"
          onClick={toggleMenu}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
        >
          {menuOpen ? <X size={21} aria-hidden="true" /> : <Menu size={21} aria-hidden="true" />}
        </button>
      </div>
      {menuOpen && (
        <nav className={`mobile-menu${menuClosing ? " is-closing" : ""}`} id="mobile-menu" aria-label="Mobile navigation">
          <Link to="/shop#shop" onClick={closeMenu}>Shop</Link>
          <Link to="/shop#how-to-order" onClick={closeMenu}>How to order</Link>
          <Link to="/shop#contact" onClick={closeMenu}>Contact</Link>
          <div className="mobile-menu-account">
            <AccountLinks user={user} displayName={displayName} isAdmin={isAdmin} logout={logout} onNavigate={closeMenu} />
          </div>
        </nav>
      )}
    </header>
  );
}
