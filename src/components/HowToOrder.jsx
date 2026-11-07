import { ArrowUpRight } from "lucide-react";

const steps = [
  { number: "01", title: "Choose", text: "Browse the collection and add your favourite fabrics to the cart." },
  { number: "02", title: "Check your cart", text: "Review your fabrics, quantities and order total." },
  { number: "03", title: "Send on WhatsApp", text: "Share your order and delivery details with our friendly team." },
  { number: "04", title: "Pay & receive", text: "We’ll confirm availability, payment and delivery with you." },
];

export default function HowToOrder() {
  return (
    <section className="how-section" id="how-to-order">
      <div className="section-wrap">
        <div className="section-heading how-heading">
          <div>
            <span className="eyebrow"><span className="eyebrow-line" /> Simple from start to finish</span>
            <h2>A lovely order,<br /><em>in four easy steps.</em></h2>
          </div>
          <p>Shopping with us is personal, simple and just a message away.</p>
        </div>
        <div className="steps-grid">
          {steps.map((step) => (
            <article className="step-card" key={step.number}>
              <span className="step-number">{step.number}</span>
              <span className="step-dash" />
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </article>
          ))}
        </div>
        <a className="how-link" href="#shop">Explore the collection <ArrowUpRight size={17} /></a>
      </div>
    </section>
  );
}
