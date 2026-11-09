import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <main className="not-found-page">
      <span className="eyebrow">404 · Page not found</span>
      <h1>This page isn’t in our collection.</h1>
      <p>The address may be outdated, or the page may have moved.</p>
      <Link to="/" className="button button-primary">Back to welcome page</Link>
    </main>
  );
}
