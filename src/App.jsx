import { useState } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import CartDrawer from "./components/CartDrawer.jsx";
import Contact from "./components/Contact.jsx";
import Footer from "./components/Footer.jsx";
import Header from "./components/Header.jsx";
import Hero from "./components/Hero.jsx";
import HowToOrder from "./components/HowToOrder.jsx";
import MessageForm from "./components/MessageForm.jsx";
import ProductGrid from "./components/ProductGrid.jsx";
import TrustStrip from "./components/TrustStrip.jsx";
import WhatsAppButton from "./components/WhatsAppButton.jsx";
import { AdminRoute, ProtectedRoute } from "./components/ProtectedRoute.jsx";
import AdminPage from "./pages/AdminPage.jsx";
import { LoginPage, SignupPage } from "./pages/AuthPages.jsx";
import NotFoundPage from "./pages/NotFoundPage.jsx";
import WelcomePage from "./pages/WelcomePage.jsx";

function ShopPage() {
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

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<WelcomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/shop" element={<ShopPage />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<AdminRoute />}>
            <Route path="/admin" element={<AdminPage />} />
          </Route>
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
