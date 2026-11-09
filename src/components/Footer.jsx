import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="site-footer">
      <Link className="brand footer-brand" to="/">
        <span className="brand-mark" aria-hidden="true">T</span>
        <span className="brand-name">Tehilla <span>Fabrics</span></span>
      </Link>
      <p>Beautiful fabrics for every occasion.</p>
      <nav className="footer-nav" aria-label="Footer navigation">
        <Link to="/shop#shop">Shop</Link>
        <Link to="/login">Login</Link>
        <Link to="/signup">Get Started</Link>
        <Link to="/shop#contact">Contact</Link>
        <Link className="staff-login-link" to="/admin-login">Staff login</Link>
      </nav>
      <span className="footer-copy">© {new Date().getFullYear()} Tehilla Fabrics · Birnin Kebbi, Nigeria</span>
      <a className="back-to-top" href="#home">Back to top ↑</a>
    </footer>
  );
}
