import { ArrowDown, ArrowUpRight } from "lucide-react";

export default function Hero() {
  return (
    <section className="hero" id="home">
      <div className="hero-copy">
        <span className="eyebrow"><span className="eyebrow-line" /> A little beauty in every thread</span>
        <h1>Beautiful fabrics for <em>every occasion.</em></h1>
        <p>Find the perfect fabric for your next celebration, special moment or everyday style.</p>
        <div className="hero-actions">
          <a className="button button-primary" href="#shop">Shop fabrics <ArrowUpRight size={18} /></a>
          <a className="text-link" href="#how-to-order">How ordering works <ArrowDown size={16} /></a>
        </div>
        <div className="hero-note">
          <span className="hero-note-dot" />
          <span>Visit us in Birnin Kebbi <b>·</b> Open every day</span>
        </div>
      </div>
      <div className="hero-visual" aria-label="Colorful patterned fabrics">
        <div className="hero-image hero-image-main" role="img" aria-label="Colorful patterned fabric" />
        <div className="hero-image hero-image-detail" role="img" aria-label="Fabric texture detail" />
        <div className="hero-stamp"><span>Made for</span><strong>your<br />moments</strong><span className="stamp-star">✳</span></div>
        <div className="hero-image-caption"><span>01 / 04</span><span>Find a fabric to love</span></div>
      </div>
    </section>
  );
}
