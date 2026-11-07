import { Check, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { formatPrice } from "./ProductGrid.jsx";

export default function ProductCard({ product, onAdd }) {
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (!added) return undefined;
    const timeout = window.setTimeout(() => setAdded(false), 1400);
    return () => window.clearTimeout(timeout);
  }, [added]);

  function handleAdd() {
    onAdd(product);
    setAdded(true);
  }

  return (
    <article className="product-card">
      <div className="product-image-wrap">
        <img className="product-image" src={product.image} alt={`${product.name} fabric`} loading="lazy" />
        {product.tag && <span className="product-tag">{product.tag}</span>}
        <span className="product-category">{product.category}</span>
      </div>
      <div className="product-details">
        <h3>{product.name}</h3>
        <div className="product-price">
          <strong>{formatPrice(product.price)}</strong>
          <span>{product.unit}</span>
        </div>
        <button className={`add-button${added ? " added" : ""}`} onClick={handleAdd} aria-label={`Add ${product.name} to cart`}>
          {added ? <><Check size={17} /> Added ✓</> : <><Plus size={17} /> Add to cart</>}
        </button>
      </div>
    </article>
  );
}
