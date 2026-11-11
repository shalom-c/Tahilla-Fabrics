import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { WHATSAPP_NUMBER } from "../data/config.js";
import { useCart } from "../context/CartContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import formatPrice from "../utils/formatPrice.js";
import FabricImage from "./FabricImage.jsx";

export default function CartDrawer({ isOpen, onClose }) {
  const { items, increase, decrease, remove, total } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [deliveryArea, setDeliveryArea] = useState("");
  const [isClosing, setIsClosing] = useState(false);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const close = useCallback(() => {
    if (isClosing) return;
    setIsClosing(true);
  }, [isClosing]);

  useEffect(() => {
    if (user) setName(user.displayName || "");
  }, [user]);

  useEffect(() => {
    if (!isClosing) return undefined;
    const timeout = window.setTimeout(() => {
      onCloseRef.current();
    }, 200);
    return () => window.clearTimeout(timeout);
  }, [isClosing]);

  useEffect(() => {
    if (!isOpen) setIsClosing(false);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;
    function handleKeyDown(event) {
      if (event.key === "Escape") close();
    }
    document.addEventListener("keydown", handleKeyDown);
    document.body.classList.add("drawer-open");
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.classList.remove("drawer-open");
    };
  }, [isOpen, close]);

  if (!isOpen) return null;

  function sendOrder(event) {
    event.preventDefault();
    if (!user) {
      close();
      navigate("/login");
      return;
    }
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
    <div className={`drawer-overlay${isClosing ? " is-closing" : ""}`} onMouseDown={(event) => event.target === event.currentTarget && close()}>
      <aside className={`cart-drawer${isClosing ? " is-closing" : ""}`} role="dialog" aria-modal="true" aria-labelledby="cart-title">
        <div className="drawer-header">
          <div>
            <span className="eyebrow">Your selection</span>
            <h2 id="cart-title">Shopping cart</h2>
          </div>
          <button className="icon-button" onClick={close} aria-label="Close shopping cart"><X /></button>
        </div>
        {items.length === 0 ? (
          <div className="empty-cart">
            <span className="empty-cart-icon"><ShoppingBag size={25} /></span>
            <h3>Your cart is waiting</h3>
            <p>Add a fabric you love and it will appear here.</p>
            <button className="button button-primary" onClick={close}>Explore fabrics</button>
          </div>
        ) : (
          <>
            <div className="cart-items">
              {items.map((item) => (
                <article className="cart-item" key={item.id}>
                  <FabricImage className="cart-item-fabric-image" src={item.image} alt={`${item.name} fabric`} width={80} height={80} />
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
            {user ? (
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
            ) : (
              <div className="checkout-access">
                <p>Please sign in or create an account to check out.</p>
                <div className="checkout-access-actions">
                  <Link className="button button-primary" to="/login" onClick={close}>Log in</Link>
                  <Link className="button button-secondary" to="/signup" onClick={close}>Create account</Link>
                </div>
              </div>
            )}
          </>
        )}
      </aside>
    </div>
  );
}
