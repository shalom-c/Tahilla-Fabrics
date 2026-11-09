import { useState } from "react";
import CartDrawer from "../components/CartDrawer.jsx";
import Contact from "../components/Contact.jsx";
import Footer from "../components/Footer.jsx";
import Header from "../components/Header.jsx";
import Hero from "../components/Hero.jsx";
import HowToOrder from "../components/HowToOrder.jsx";
import MessageForm from "../components/MessageForm.jsx";
import ProductGrid from "../components/ProductGrid.jsx";
import TrustStrip from "../components/TrustStrip.jsx";
import WhatsAppButton from "../components/WhatsAppButton.jsx";

export default function ShopPage() {
  const [isCartOpen, setIsCartOpen] = useState(false);
  return (
    <>
      <Header onCartOpen={() => setIsCartOpen(true)} />
      <main>
        <Hero />
        <TrustStrip />
        <ProductGrid />
        <HowToOrder />
        <Contact />
        <MessageForm />
      </main>
      <Footer />
      <WhatsAppButton />
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  );
}
