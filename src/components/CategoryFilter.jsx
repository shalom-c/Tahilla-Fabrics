const categories = ["All", "Ankara", "Lace", "Brocade", "Premium", "Plain"];

export default function CategoryFilter({ activeCategory, onCategoryChange }) {
  return (
    <div className="category-filter" aria-label="Filter products by category">
      {categories.map((category) => (
        <button
          className={`filter-button${activeCategory === category ? " is-active" : ""}`}
          key={category}
          type="button"
          aria-pressed={activeCategory === category}
          onClick={() => onCategoryChange(category)}
        >
          {category}
        </button>
      ))}
    </div>
  );
}
