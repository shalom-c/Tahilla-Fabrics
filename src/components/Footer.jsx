export default function Footer() {
  return (
    <footer className="site-footer">
      <a className="brand footer-brand" href="#home">
        <span className="brand-mark" aria-hidden="true">T</span>
        <span className="brand-name">Tehilla <span>Fabrics</span></span>
      </a>
      <p>Beautiful fabrics for every occasion.</p>
      <span className="footer-copy">© {new Date().getFullYear()} Tehilla Fabrics · Birnin Kebbi, Nigeria</span>
      <a className="back-to-top" href="#home">Back to top ↑</a>
    </footer>
  );
}
