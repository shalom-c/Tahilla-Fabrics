import { collection, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db, isFirebaseConfigured } from "../firebase.js";
import { useCart } from "../context/CartContext.jsx";
import CategoryFilter from "./CategoryFilter.jsx";
import Loader from "./Loader.jsx";
import ProductCard from "./ProductCard.jsx";

export const formatPrice = (amount) =>
  `₦${new Intl.NumberFormat("en-NG", { maximumFractionDigits: 0 }).format(amount)}`;

export default function ProductGrid() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { add } = useCart();

  useEffect(() => {
    if (!db) {
      setLoading(false);
      return undefined;
    }
    return onSnapshot(
      collection(db, "products"),
      (snapshot) => {
        setProducts(snapshot.docs.map((product) => ({ id: product.id, ...product.data() })));
        setLoading(false);
        setError("");
      },
      (cause) => {
        console.error("Could not load products from Firestore.", cause);
        setError("We couldn’t load the fabrics. Please check back shortly.");
        setLoading(false);
      },
    );
  }, []);

  const categories = ["All", ...new Set(products.map((product) => product.category).filter(Boolean))];
  const visibleProducts = activeCategory === "All"
    ? products
    : products.filter((product) => product.category === activeCategory);

  return (
    <section className="shop-section section-wrap" id="shop">
      <div className="section-heading shop-heading">
        <div>
          <span className="eyebrow"><span className="eyebrow-line" /> The collection</span>
          <h2>Find your next <em>favourite.</em></h2>
        </div>
        <p>Thoughtfully picked fabrics for the moments that matter.</p>
      </div>
      {products.length > 0 && <CategoryFilter categories={categories} activeCategory={activeCategory} onCategoryChange={setActiveCategory} />}
      {loading ? (
        <div className="products-loading">
          <Loader size="sm" />
          <span aria-hidden="true">Loading fabrics…</span>
        </div>
      ) : error ? (
        <p className="products-message error" role="alert">{error}</p>
      ) : !isFirebaseConfigured ? (
        <p className="products-message">Connect Firebase to load the fabric collection. See <code>FIREBASE_SETUP.md</code> for setup instructions.</p>
      ) : visibleProducts.length ? (
        <div className="product-grid">
          {visibleProducts.map((product) => <ProductCard key={product.id} product={product} onAdd={add} />)}
        </div>
      ) : (
        <p className="products-message">No fabrics are listed yet. Please check back soon.</p>
      )}
      <p className="stock-note">Prices shown are in Nigerian Naira. Please message us to confirm availability.</p>
    </section>
  );
}
