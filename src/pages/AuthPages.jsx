import { Check, Eye, EyeOff, X } from "lucide-react";
import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import Loader from "../components/Loader.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import validatePassword from "../utils/validatePassword.js";

function authMessage(error) {
  const messages = {
    "auth/invalid-email": "Please enter a valid email address.",
    "auth/user-not-found": "We couldn’t find an account with that email.",
    "auth/wrong-password": "That password doesn’t match this account.",
    "auth/invalid-credential": "The email or password is incorrect.",
    "auth/email-already-in-use": "An account already exists with this email. Try logging in.",
    "auth/weak-password": "Password must be 8 to 16 characters and include an uppercase letter, a lowercase letter, a number and a symbol.",
    "auth/too-many-requests": "Too many attempts. Please wait a moment and try again.",
    "auth/network-request-failed": "Network issue. Check your connection and try again.",
  };
  return messages[error.code] || error.message || "Something went wrong. Please try again.";
}

function AuthLayout({ title, children, footer }) {
  return (
    <main className="auth-page">
      <section className="auth-card" aria-labelledby="auth-title">
        <Link className="brand auth-brand" to="/">
          <span className="brand-mark" aria-hidden="true">T</span>
          <span className="brand-name">Tehilla <span>Fabrics</span></span>
        </Link>
        <span className="eyebrow"><span className="eyebrow-line" /> Your fabric journey starts here</span>
        <h1 id="auth-title">{title}</h1>
        {children}
        <p className="auth-footer">{footer}</p>
      </section>
    </main>
  );
}

export function SignupPage() {
  const { user, loading, signup } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", confirmPassword: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const passwordValidation = validatePassword(form.password);

  if (loading) return <Loader />;
  if (user) return <Navigate to="/shop" replace />;

  function update(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
    setError("");
  }

  async function submit(event) {
    event.preventDefault();
    if (!passwordValidation.valid) {
      return setError("Password must be 8 to 16 characters and include an uppercase letter, a lowercase letter, a number and a symbol.");
    }
    if (form.password !== form.confirmPassword) return setError("Your passwords don’t match.");
    setBusy(true);
    try {
      await signup({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        password: form.password,
      });
      navigate("/shop", { replace: true });
    } catch (cause) {
      setError(authMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout title="Create your account" footer={<>Already have an account? <Link to="/login">Login</Link></>}>
      <form className="account-form" onSubmit={submit}>
        <label>Full name<input name="name" value={form.name} onChange={update} autoComplete="name" required /></label>
        <label>Email address<input name="email" type="email" value={form.email} onChange={update} autoComplete="email" required /></label>
        <label>Phone number<input name="phone" type="tel" value={form.phone} onChange={update} autoComplete="tel" required /></label>
        <label>Password
          <span className="password-input">
            <input name="password" type={showPassword ? "text" : "password"} value={form.password} onChange={update} autoComplete="new-password" maxLength={16} required />
            <button type="button" className="password-toggle" onClick={() => setShowPassword((shown) => !shown)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
          </span>
        </label>
        <div className="password-guidance" aria-live="polite">
          <ul className="password-checklist">
            {passwordValidation.rules.map((rule) => (
              <li className={rule.passed ? "rule-passed" : "rule-failed"} key={rule.id}>
                {rule.passed ? <Check size={14} aria-hidden="true" /> : <X size={14} aria-hidden="true" />}
                <span>{rule.label}</span>
              </li>
            ))}
          </ul>
          <div className={`password-strength strength-${passwordValidation.strength}`}>
            <span className="password-strength-track"><span style={{ width: `${passwordValidation.passed.length * 20}%` }} /></span>
            <span>Password strength: {passwordValidation.strength}</span>
          </div>
        </div>
        <label>Confirm password
          <span className="password-input">
            <input name="confirmPassword" type={showConfirmPassword ? "text" : "password"} value={form.confirmPassword} onChange={update} autoComplete="new-password" maxLength={16} required />
            <button type="button" className="password-toggle" onClick={() => setShowConfirmPassword((shown) => !shown)} aria-label={showConfirmPassword ? "Hide password" : "Show password"}>{showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
          </span>
        </label>
        {error && <p className="form-status error" role="alert">{error}</p>}
        <button className="button button-primary auth-submit" disabled={busy}>{busy ? <><Loader size="sm" /> Creating account…</> : "Get Started"}</button>
      </form>
    </AuthLayout>
  );
}

export function LoginPage() {
  const { user, role, loading, login, resetPassword } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  if (loading) return <Loader />;
  if (user) return <Navigate to={role === "admin" ? "/admin" : "/shop"} replace />;

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result = await login(email.trim(), password);
      navigate(result.role === "admin" ? "/admin" : "/shop", { replace: true });
    } catch (cause) {
      setError(authMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  async function forgotPassword() {
    if (!email.trim()) {
      setError("Enter your email address first, then choose Forgot password.");
      return;
    }
    setError("");
    setNotice("");
    try {
      await resetPassword(email.trim());
      setNotice("If an account exists for that email, a password reset link is on its way.");
    } catch (cause) {
      setError(authMessage(cause));
    }
  }

  return (
    <AuthLayout title="Welcome back" footer={<>New here? <Link to="/signup">Get Started</Link></>}>
      <form className="account-form" onSubmit={submit}>
        <label>Email address<input type="email" value={email} onChange={(event) => { setEmail(event.target.value); setError(""); }} autoComplete="email" required /></label>
        <label>Password
          <span className="password-input">
            <input type={showPassword ? "text" : "password"} value={password} onChange={(event) => { setPassword(event.target.value); setError(""); }} autoComplete="current-password" required />
            <button type="button" className="password-toggle" onClick={() => setShowPassword((shown) => !shown)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
          </span>
        </label>
        <button className="forgot-link" type="button" onClick={forgotPassword}>Forgot password?</button>
        {error && <p className="form-status error" role="alert">{error}</p>}
        {notice && <p className="form-status success" role="status">{notice}</p>}
        <button className="button button-primary auth-submit" disabled={busy}>{busy ? <><Loader size="sm" /> Logging in…</> : "Login"}</button>
      </form>
    </AuthLayout>
  );
}
