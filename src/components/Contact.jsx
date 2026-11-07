import { Clock3, Facebook, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import {
  SHOP_ADDRESS,
  SHOP_EMAIL,
  SHOP_PHONE_DISPLAY,
  WHATSAPP_NUMBER,
} from "../data/config.js";

export default function Contact() {
  return (
    <section className="contact-section section-wrap" id="contact">
      <div className="contact-intro">
        <span className="eyebrow"><span className="eyebrow-line" /> Come say hello</span>
        <h2>Good fabrics.<br /><em>Good people.</em></h2>
        <p>We’d love to help you find just the right thing. Visit our shop or get in touch.</p>
        <a className="button button-primary" href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noreferrer">
          <MessageCircle size={18} /> Chat on WhatsApp
        </a>
      </div>
      <div className="contact-details">
        <a className="contact-row" href={`https://maps.google.com/?q=${encodeURIComponent(SHOP_ADDRESS)}`} target="_blank" rel="noreferrer">
          <span className="contact-icon"><MapPin /></span>
          <span><small>Find our shop</small><strong>{SHOP_ADDRESS}</strong></span>
        </a>
        <a className="contact-row" href="tel:+2348120422386">
          <span className="contact-icon"><Phone /></span>
          <span><small>Call or WhatsApp</small><strong>{SHOP_PHONE_DISPLAY}</strong></span>
        </a>
        <a className="contact-row" href={`mailto:${SHOP_EMAIL}`}>
          <span className="contact-icon"><Mail /></span>
          <span><small>Send us an email</small><strong>{SHOP_EMAIL}</strong></span>
        </a>
        <div className="contact-row">
          <span className="contact-icon"><Clock3 /></span>
          <span><small>Opening hours</small><strong>Open every day</strong></span>
        </div>
        <a className="contact-row" href="https://www.facebook.com/search/top?q=Fabric%20Vendor%20in%20Kebbi" target="_blank" rel="noreferrer">
          <span className="contact-icon"><Facebook /></span>
          <span><small>Follow our Facebook page</small><strong>Fabric Vendor in Kebbi</strong></span>
        </a>
      </div>
    </section>
  );
}
