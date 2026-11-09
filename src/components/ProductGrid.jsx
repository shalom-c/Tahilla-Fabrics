import { useEffect, useState } from "react";
import { getFirebaseFirestore, isFirebaseConfigured } from "../firebase.js";
import { useCart } from "../context/CartContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { sampleProducts } from "../data/sampleProducts.js";
import CategoryFilter from "./CategoryFilter.jsx";
import Loader from "./Loader.jsx";
import ProductCard from "./ProductCard.jsx";

const PRODUCTS_CACHE_KEY = "tehilla-products-v1";

function readCachedProducts() {
  try {
    const cached = JSON.parse(window.localStorage.getItem(PRODUCTS_CACHE_KEY) || "null");
    return Array.isArray(cached) &&
      cached.every((product) => product && typeof product.id === "string")
      ? cached
      : null;
  } catch (error) {
    console.warn("Could not read the cached fabric collection.", error);
    return null;
  }
}

export default function ProductGrid() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [cachedProducts] = useState(readCachedProducts);
  const [products, setProducts] = useState(() => cachedProducts || []);
  const [loading, setLoading] = useState(() => cachedProducts === null);
  const [error, setError] = useState("");
  const [showingSamples, setShowingSamples] = useState(false);
  const { add } = useCart();
  const { role } = useAuth();

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setProducts(sampleProducts);
      setShowingSamples(true);
      setLoading(false);
      return undefined;
    }

    let cancelled = false;
    let unsubscribe;
    Promise.all([
      getFirebaseFirestore(),
      import("firebase/firestore"),
    ])
      .then(([database, { collection, onSnapshot }]) => {
        if (cancelled) return;
        if (!database) {
          setProducts(sampleProducts);
          setShowingSamples(true);
          setLoading(false);
          return;
        }
        unsubscribe = onSnapshot(
          collection(database, "products"),
          (snapshot) => {
            const nextProducts = snapshot.docs.map((product) => ({ id: product.id, ...product.data() }));
            setProducts(nextProducts.length ? nextProducts : sampleProducts);
            setShowingSamples(nextProducts.length === 0);
            try {
              window.localStorage.setItem(PRODUCTS_CACHE_KEY, JSON.stringify(nextProducts));
            } catch (error) {
              console.warn("Could not cache the fabric collection.", error);
            }
            setLoading(false);
            setError("");
          },
          (cause) => {
            console.error("Could not load products from Firestore.", cause);
            setProducts(sampleProducts);
            setShowingSamples(true);
            setError("We couldn’t load the fabrics. Please check back shortly.");
            setLoading(false);
          },
        );
      })
      .catch((cause) => {
        if (cancelled) return;
        console.error("Could not connect to Firestore.", cause);
        setProducts(sampleProducts);
        setShowingSamples(true);
        setError("We couldn’t load the fabrics. Please check back shortly.");
        setLoading(false);
      });

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [cachedProducts]);

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
      ) : (
        <>
          {error && <p className="products-message error" role="status">{error}</p>}
          {showingSamples && role === "admin" && (
            <p className="sample-products-note">Showing sample fabrics. Go to Admin to import and edit them.</p>
          )}
          <div className="product-grid">
            {visibleProducts.map((product) => <ProductCard key={product.id} product={product} onAdd={add} />)}
          </div>
        </>
      )}
      <p className="stock-note">Prices shown are in Nigerian Naira. Please message us to confirm availability.</p>
    </section>
  );
}
