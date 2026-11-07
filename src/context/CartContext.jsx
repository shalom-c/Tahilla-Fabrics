import { createContext, useContext, useEffect, useMemo, useReducer } from "react";

const CartContext = createContext(null);
const STORAGE_KEY = "tehilla-fabrics-cart";

function readStoredCart() {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed)
      ? parsed.filter(
          (item) =>
            item &&
            typeof item.id === "string" &&
            typeof item.name === "string" &&
            Number.isFinite(item.price) &&
            Number.isInteger(item.quantity) &&
            item.quantity > 0,
        )
      : [];
  } catch (error) {
    console.error("Could not read the saved cart.", error);
    return [];
  }
}

function cartReducer(state, action) {
  switch (action.type) {
    case "add": {
      const existing = state.find((item) => item.id === action.product.id);
      return existing
        ? state.map((item) =>
            item.id === action.product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item,
          )
        : [...state, { ...action.product, quantity: 1 }];
    }
    case "increase":
      return state.map((item) =>
        item.id === action.id ? { ...item, quantity: item.quantity + 1 } : item,
      );
    case "decrease":
      return state
        .map((item) =>
          item.id === action.id ? { ...item, quantity: item.quantity - 1 } : item,
        )
        .filter((item) => item.quantity > 0);
    case "remove":
      return state.filter((item) => item.id !== action.id);
    case "clear":
      return [];
    default:
      return state;
  }
}

export function CartProvider({ children }) {
  const [items, dispatch] = useReducer(cartReducer, undefined, readStoredCart);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (error) {
      console.error("Could not save the cart to this browser.", error);
    }
  }, [items]);

  const value = useMemo(
    () => ({
      items,
      add: (product) => dispatch({ type: "add", product }),
      increase: (id) => dispatch({ type: "increase", id }),
      decrease: (id) => dispatch({ type: "decrease", id }),
      remove: (id) => dispatch({ type: "remove", id }),
      clear: () => dispatch({ type: "clear" }),
      total: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
      itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    }),
    [items],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside CartProvider.");
  return context;
}
