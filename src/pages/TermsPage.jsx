import { Link } from "react-router-dom";
import Header from "../components/Header.jsx";

const orderSteps = [
  "Browse fabrics in the Shop section and select the items you prefer.",
  "Add your selected items to the shopping cart and review the items and quantities.",
  "Proceed to checkout, enter your delivery address details, and select a payment method.",
  "Confirm your payment to place the order. You will receive an order confirmation receipt.",
];

export default function TermsPage() {
  return (
    <>
      <Header />
      <main className="terms-page">
        <article className="terms-card">
          <Link className="terms-back-link" to="/signup">Back to sign up</Link>
          <span className="eyebrow"><span className="eyebrow-line" /> Shopping with Tehilla Fabrics</span>
          <h1>Terms and Conditions</h1>
          <p className="terms-intro">
            These terms explain how to use our website and what to expect when placing an order.
            By creating an account or placing an order, you agree to follow them.
          </p>

          <section className="terms-section" aria-labelledby="how-to-order-heading">
            <h2 id="how-to-order-heading">How to Order</h2>
            <ol className="terms-order-steps">
              {orderSteps.map((step) => <li key={step}>{step}</li>)}
            </ol>
          </section>

          <section className="terms-section" aria-labelledby="account-security-heading">
            <h2 id="account-security-heading">Account Security</h2>
            <p>
              Keep your sign-in details private and use accurate account information. You are
              responsible for activity carried out through your account. Contact us promptly if
              you believe your account has been accessed without permission.
            </p>
          </section>

          <section className="terms-section" aria-labelledby="orders-payments-heading">
            <h2 id="orders-payments-heading">Orders &amp; Payments</h2>
            <p>
              An order request is subject to product availability and confirmation. Review your
              fabrics, quantities, delivery details, and total before confirming payment. Prices
              and payment options are shown during checkout; an order is placed once payment is
              confirmed and you receive an order confirmation receipt.
            </p>
          </section>

          <section className="terms-section" aria-labelledby="deliveries-heading">
            <h2 id="deliveries-heading">Deliveries</h2>
            <p>
              Provide a complete and accurate delivery address and contact number at checkout.
              Delivery timing and charges depend on the destination and will be presented or
              confirmed as part of your order. We will contact you if delivery details need to
              be clarified.
            </p>
          </section>

          <section className="terms-section" aria-labelledby="returns-heading">
            <h2 id="returns-heading">Returns &amp; Refunds</h2>
            <p>
              If an item arrives damaged or differs from your confirmed order, contact us with
              your order details as soon as possible so we can review the issue. Returns,
              exchanges, and refunds are assessed based on the circumstances and applicable
              consumer protection requirements. Custom-cut or used fabric may not be eligible
              for return unless required by law.
            </p>
          </section>

          <section className="terms-section" aria-labelledby="acceptable-use-heading">
            <h2 id="acceptable-use-heading">Acceptable Use</h2>
            <p>
              Use the website lawfully and respectfully. Do not misuse the website, interfere
              with its operation, attempt unauthorized access, submit false order information,
              or use another person’s account without permission.
            </p>
          </section>

          <p className="terms-contact">
            Need help with an order? Visit our <Link to="/shop#contact">Contact section</Link>.
          </p>
        </article>
      </main>
    </>
  );
}
