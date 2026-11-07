import { MessageCircle } from "lucide-react";
import { WHATSAPP_NUMBER } from "../data/config.js";

export default function WhatsAppButton() {
  return (
    <a
      className="whatsapp-float"
      href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Hello Tehilla Fabrics! I'd like to ask about your fabrics.")}`}
      target="_blank"
      rel="noreferrer"
      aria-label="Chat with Tehilla Fabrics on WhatsApp"
    >
      <MessageCircle size={23} aria-hidden="true" />
      <span>Chat with us</span>
    </a>
  );
}
