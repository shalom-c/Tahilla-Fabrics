import { useState } from "react";
import { products } from "../data/products.js";
import { useCart } from "../context/CartContext.jsx";
import CategoryFilter from "./CategoryFilter.jsx";
import ProductCard from "./ProductCard.jsx";

export const formatPrice = (amount) =>
  `₦${new Intl.NumberFormat("en-NG", { maximumFractionDigits: 0 }).format(amount)}`;

export default function ProductGrid() {
  const [activeCategory, setActiveCategory] = useState("All");
  const { add } = useCart();
  const visibleProducts =
    activeCategory === "All"
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
      <CategoryFilter activeCategory={activeCategory} onCategoryChange={setActiveCategory} />
      <div className="product-grid">
        {visibleProducts.map((product) => (
          <ProductCard key={product.id} product={product} onAdd={add} />
        ))}
      </div>
      <p className="stock-note">Prices shown are in Nigerian Naira. Please message us to confirm availability.</p>
    </section>
  );
}
