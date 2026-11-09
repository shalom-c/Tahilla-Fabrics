import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { WHATSAPP_NUMBER } from "../data/config.js";
import { useCart } from "../context/CartContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { formatPrice } from "./ProductGrid.jsx";

export default function CartDrawer({ isOpen, onClose }) {
  const { items, increase, decrease, remove, total } = useCart();
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [deliveryArea, setDeliveryArea] = useState("");

  useEffect(() => {
    if (user) setName(user.displayName || "");
  }, [user]);

  useEffect(() => {
    if (!isOpen) return undefined;
    function handleKeyDown(event) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    document.body.classList.add("drawer-open");
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.classList.remove("drawer-open");
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  function sendOrder(event) {
    event.preventDefault();
    const lines = items.map(
      (item) =>
        `• ${item.name} (${item.unit}) x${item.quantity} — ${formatPrice(item.price * item.quantity)}`,
    );
    const message = [
      "Hello Tehilla Fabrics! I'd like to place an order:",
      "",
      ...lines,
      "",
      `Total: ${formatPrice(total)}`,
      `Name: ${name.trim()}`,
      `Delivery area / pickup: ${deliveryArea.trim()}`,
    ].join("\n");
    window.open(
      `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`,
      "_blank",
      "noopener,noreferrer",
    );
  }

  return (
    <div className="drawer-overlay" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <aside className="cart-drawer" role="dialog" aria-modal="true" aria-labelledby="cart-title">
        <div className="drawer-header">
          <div>
            <span className="eyebrow">Your selection</span>
            <h2 id="cart-title">Shopping cart</h2>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Close shopping cart"><X /></button>
        </div>
        {items.length === 0 ? (
          <div className="empty-cart">
            <span className="empty-cart-icon"><ShoppingBag size={25} /></span>
            <h3>Your cart is waiting</h3>
            <p>Add a fabric you love and it will appear here.</p>
            <button className="button button-primary" onClick={onClose}>Explore fabrics</button>
          </div>
        ) : (
          <>
            <div className="cart-items">
              {items.map((item) => (
                <article className="cart-item" key={item.id}>
                  <img src={item.image} alt="" />
                  <div className="cart-item-info">
                    <h3>{item.name}</h3>
                    <span>{formatPrice(item.price)} · {item.unit}</span>
                    <div className="quantity-control" aria-label={`Quantity for ${item.name}`}>
                      <button onClick={() => decrease(item.id)} aria-label={`Decrease ${item.name} quantity`}><Minus size={14} /></button>
                      <span aria-live="polite">{item.quantity}</span>
                      <button onClick={() => increase(item.id)} aria-label={`Increase ${item.name} quantity`}><Plus size={14} /></button>
                    </div>
                  </div>
                  <div className="cart-item-end">
                    <strong>{formatPrice(item.price * item.quantity)}</strong>
                    <button className="remove-button" onClick={() => remove(item.id)} aria-label={`Remove ${item.name}`}><Trash2 size={16} /></button>
                  </div>
                </article>
              ))}
            </div>
            <form className="order-form" onSubmit={sendOrder}>
              <label>
                Your name
                <input value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" required />
              </label>
              <label>
                Delivery area or “Pickup”
                <input value={deliveryArea} onChange={(event) => setDeliveryArea(event.target.value)} required />
              </label>
              <div className="cart-total"><span>Order total</span><strong>{formatPrice(total)}</strong></div>
              <p className="checkout-note">We’ll confirm fabric availability and delivery details with you on WhatsApp.</p>
              <button className="button button-primary checkout-button" type="submit">Send order on WhatsApp</button>
            </form>
          </>
        )}
      </aside>
    </div>
  );
}
