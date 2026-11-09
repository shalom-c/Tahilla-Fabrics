import { Link } from "react-router-dom";
import { SHOP_ADDRESS, SHOP_PHONE_DISPLAY } from "../data/config.js";

export default function WelcomePage() {
  return (
    <main className="welcome-page">
      <section className="welcome-card" aria-labelledby="welcome-title">
        <Link className="brand welcome-brand" to="/" aria-label="Tehilla Fabrics home">
          <span className="brand-mark" aria-hidden="true">T</span>
          <span className="brand-name">Tehilla <span>Fabrics</span></span>
        </Link>
        <span className="eyebrow"><span className="eyebrow-line" /> A little beauty in every thread</span>
        <h1 id="welcome-title">Welcome to <em>Tehilla Fabrics</em></h1>
        <p>Quality fabrics in Birnin Kebbi. Choose, order and pay easily.</p>
        <div className="welcome-actions">
          <Link className="button button-outline" to="/login">Login</Link>
          <Link className="button button-primary" to="/signup">Get Started</Link>
        </div>
        <Link className="guest-link" to="/shop">Continue as guest to browse fabrics</Link>
      </section>
      <footer className="welcome-footer">
        <span>{SHOP_ADDRESS}</span>
        <a href={`tel:${SHOP_PHONE_DISPLAY.replace(/[^\d+]/g, "")}`}>{SHOP_PHONE_DISPLAY}</a>
      </footer>
    </main>
  );
}
