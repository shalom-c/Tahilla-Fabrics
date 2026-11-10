import { useState } from "react";
import { FORM_ENDPOINT, SHOP_EMAIL } from "../data/config.js";
import validateNigerianPhone from "../utils/validateNigerianPhone.js";

const initialForm = { name: "", email: "", phone: "", message: "" };

export default function MessageForm() {
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState({ type: "", message: "" });
  const [isSending, setIsSending] = useState(false);
  const [phoneTouched, setPhoneTouched] = useState(false);
  const phoneValidation = validateNigerianPhone(form.phone);
  const phoneError = form.phone.trim() && phoneTouched && !phoneValidation.valid
    ? phoneValidation.error
    : "";

  function updateField(event) {
    const value = event.target.name === "phone"
      ? event.target.value.replace(/[^\d+\s-]/g, "").slice(0, 17)
      : event.target.value;
    setForm((current) => ({ ...current, [event.target.name]: value }));
    if (event.target.name === "phone") setPhoneTouched(true);
    setStatus({ type: "", message: "" });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus({ type: "", message: "" });

    setPhoneTouched(true);
    if (form.phone.trim() && !phoneValidation.valid) return;
    if (!event.currentTarget.reportValidity()) return;

    if (!FORM_ENDPOINT) {
      const subject = `Website enquiry from ${form.name.trim()}`;
      const body = [
        `Name: ${form.name.trim()}`,
        `Email: ${form.email.trim()}`,
        `Phone: ${form.phone.trim() ? phoneValidation.normalized : "Not provided"}`,
        "",
        form.message.trim(),
      ].join("\n");
      window.location.href = `mailto:${SHOP_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      setStatus({ type: "success", message: "Your email app is opening with your message ready to send." });
      return;
    }

    setIsSending(true);
    try {
      const response = await fetch(FORM_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim() ? phoneValidation.normalized : "",
          message: form.message.trim(),
        }),
      });
      if (!response.ok) throw new Error(`Message submission failed (${response.status}).`);
      setForm(initialForm);
      setStatus({ type: "success", message: "Thank you! Your message has been sent." });
    } catch (error) {
      console.error("Could not send the contact form.", error);
      setStatus({ type: "error", message: "We couldn’t send your message. Please try again or contact us on WhatsApp." });
    } finally {
      setIsSending(false);
    }
  }

  return (
    <section className="message-section" id="message">
      <div className="message-inner section-wrap">
        <div className="message-copy">
          <span className="eyebrow"><span className="eyebrow-line" /> We’re listening</span>
          <h2>Send us a <em>message.</em></h2>
          <p>Questions about a fabric or need a little help? Leave us a note and we’ll be happy to help.</p>
        </div>
        <form className="message-form" onSubmit={handleSubmit}>
          <div className="form-grid">
            <label>
              Your name
              <input name="name" value={form.name} onChange={updateField} autoComplete="name" required />
            </label>
            <label>
              Email address
              <input name="email" type="email" value={form.email} onChange={updateField} autoComplete="email" required />
            </label>
          </div>
          <label>
            Phone number <span className="optional-label">(optional)</span>
            <input
              name="phone"
              type="tel"
              inputMode="tel"
              value={form.phone}
              onChange={updateField}
              onBlur={() => setPhoneTouched(true)}
              autoComplete="tel"
              placeholder="0812 042 2386"
              maxLength={17}
              aria-invalid={Boolean(phoneError)}
              aria-describedby={phoneError ? "message-phone-error" : undefined}
            />
            {phoneError && <span className="field-error" id="message-phone-error">{phoneError}</span>}
          </label>
          <label>
            Your message
            <textarea name="message" rows="4" value={form.message} onChange={updateField} required minLength="8" />
          </label>
          <button className="button button-primary" type="submit" disabled={isSending}>
            {isSending ? "Sending…" : "Send message"}
          </button>
          {status.message && <p className={`form-status ${status.type}`} role="status">{status.message}</p>}
        </form>
      </div>
    </section>
  );
}
