import { Check, Eye, EyeOff, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import Header from "../components/Header.jsx";
import Loader from "../components/Loader.jsx";
import NoIndexMeta from "../components/NoIndexMeta.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { getFirebaseFirestore } from "../firebase.js";
import validateNigerianPhone from "../utils/validateNigerianPhone.js";
import validatePassword from "../utils/validatePassword.js";

function authMessage(error) {
  const messages = {
    "auth/invalid-email": "Please enter a valid email address.",
    "auth/user-not-found": "We couldn’t find an account with that email.",
    "auth/wrong-password": "That password doesn’t match this account.",
    "auth/invalid-credential": "The email or password is incorrect.",
    "auth/email-already-in-use": "An account already exists with this email. Try logging in.",
    "auth/weak-password": "Password must be 8 to 16 characters and include an uppercase letter, a lowercase letter, a number and a symbol.",
    "auth/too-many-requests": "Please wait a few minutes before trying again.",
    "auth/network-request-failed": "Network issue. Check your connection and try again.",
  };
  return messages[error.code] || error.message || "Something went wrong. Please try again.";
}

function AuthLayout({ title, children, footer }) {
  return (
    <>
      <Header />
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
    </>
  );
}

export function SignupPage() {
  const { user, signup } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", confirmPassword: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [phoneTouched, setPhoneTouched] = useState(false);
  const passwordValidation = validatePassword(form.password);
  const phoneValidation = validateNigerianPhone(form.phone);
  const phoneError = phoneTouched && !phoneValidation.valid ? phoneValidation.error : "";

  if (user) return <Navigate to={user.emailVerified ? "/shop" : "/verify-email"} replace />;

  function update(event) {
    const value = event.target.name === "phone"
      ? event.target.value.replace(/[^\d+\s-]/g, "").slice(0, 17)
      : event.target.value;
    setForm((current) => ({ ...current, [event.target.name]: value }));
    if (event.target.name === "phone") setPhoneTouched(true);
    setError("");
  }

  async function submit(event) {
    event.preventDefault();
    setPhoneTouched(true);
    if (!phoneValidation.valid) return;
    if (!passwordValidation.valid) {
      return setError("Password must be 8 to 16 characters and include an uppercase letter, a lowercase letter, a number and a symbol.");
    }
    if (form.password !== form.confirmPassword) return setError("Your passwords don’t match.");
    setBusy(true);
    try {
      await signup({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: phoneValidation.normalized,
        password: form.password,
      });
      navigate("/verify-email", { replace: true });
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
        <label>
          Phone number
          <input
            name="phone"
            type="tel"
            inputMode="tel"
            value={form.phone}
            onChange={update}
            onBlur={() => setPhoneTouched(true)}
            autoComplete="tel"
            placeholder="0812 042 2386"
            maxLength={17}
            aria-invalid={Boolean(phoneError)}
            aria-describedby={phoneError ? "signup-phone-error" : undefined}
            required
          />
          {phoneError && <span className="field-error" id="signup-phone-error">{phoneError}</span>}
        </label>
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
  const { user, role, roleLoading, login, resetPassword } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  if (user && !roleLoading) {
    return <Navigate to={role === "admin" ? "/admin" : user.emailVerified ? "/shop" : "/verify-email"} replace />;
  }

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const { user: signedInUser } = await login(email.trim(), password);
      navigate(signedInUser.emailVerified ? "/admin" : "/verify-email", { replace: true });
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

export function VerifyEmailPage() {
  const { user, role, loading, roleLoading, logout, refreshUser, sendVerificationEmail } = useAuth();
  const navigate = useNavigate();
  const [cooldown, setCooldown] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const checkVerification = useCallback(async () => {
    setBusy(true);
    setError("");
    try {
      const refreshedUser = await refreshUser();
      if (refreshedUser?.emailVerified) navigate("/shop", { replace: true });
      else if (!refreshedUser) navigate("/login", { replace: true });
    } catch (cause) {
      setError(authMessage(cause));
    } finally {
      setBusy(false);
    }
  }, [navigate, refreshUser]);

  useEffect(() => {
    if (!user || user.emailVerified) return undefined;
    const interval = window.setInterval(checkVerification, 5000);
    return () => window.clearInterval(interval);
  }, [checkVerification, user?.uid, user?.emailVerified]);

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const timeout = window.setTimeout(() => setCooldown((remaining) => remaining - 1), 1000);
    return () => window.clearTimeout(timeout);
  }, [cooldown]);

  if (loading || (user && roleLoading)) return <Loader />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.emailVerified) return <Navigate to={role === "admin" ? "/admin" : "/shop"} replace />;

  async function resendEmail() {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await sendVerificationEmail(user);
      setCooldown(60);
      setNotice("Email sent again.");
    } catch (cause) {
      setError(authMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  async function useDifferentEmail() {
    setBusy(true);
    setError("");
    try {
      await logout();
      navigate("/signup", { replace: true });
    } catch (cause) {
      setError(authMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout title="Verify your email" footer={<>Need help? <Link to="/login">Return to login</Link></>}>
      <div className="verification-panel">
        <p className="verification-reminder" role="status">Please verify your email to continue.</p>
        <p>We sent a verification link to <strong>{user.email}</strong>. Open your email and tap the link. Check your spam folder too.</p>
        {error && <p className="form-status error" role="alert">{error}</p>}
        {notice && <p className="form-status success" role="status">{notice}</p>}
        <button className="button button-primary auth-submit" onClick={checkVerification} disabled={busy}>
          {busy ? <><Loader size="sm" /> Checking…</> : "I have verified, continue"}
        </button>
        <button className="button button-secondary auth-submit" onClick={resendEmail} disabled={busy || cooldown > 0}>
          {cooldown > 0 ? `Resend email in ${cooldown}s` : "Resend email"}
        </button>
        <button className="verification-change-email" onClick={useDifferentEmail} disabled={busy}>Use a different email</button>
      </div>
    </AuthLayout>
  );
}

export function AdminLoginPage() {
  const { user, role, roleLoading, login, logout, resetPassword } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [resetBusy, setResetBusy] = useState(false);

  if (user && !roleLoading && role === "admin") return <Navigate to="/admin" replace />;

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");

    let signedInUser;
    try {
      ({ user: signedInUser } = await login(email.trim(), password));
    } catch (cause) {
      setError(authMessage(cause));
      setBusy(false);
      return;
    }

    try {
      const database = await getFirebaseFirestore();
      if (!database) throw new Error("Firebase Firestore is not configured.");
      const { doc, getDoc } = await import("firebase/firestore");
      const profile = await getDoc(doc(database, "users", signedInUser.uid));
      if (profile.exists() && profile.data().role === "admin") {
        navigate("/admin", { replace: true });
        return;
      }

      try {
        await logout();
      } catch (cause) {
        console.error("Could not sign out an account without admin access.", cause);
      }
      setError("This account does not have admin access.");
    } catch (cause) {
      console.error("Could not verify the staff user's Firestore role.", cause);
      try {
        await logout();
      } catch (signOutError) {
        console.error("Could not sign out after staff access verification failed.", signOutError);
      }
      setError("We couldn’t verify staff access. Please try again.");
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
    setResetBusy(true);
    try {
      await resetPassword(email.trim());
      setNotice("If an account exists for that email, a password reset link is on its way.");
    } catch (cause) {
      setError(authMessage(cause));
    } finally {
      setResetBusy(false);
    }
  }

  return (
    <>
      <NoIndexMeta />
      <AuthLayout title="Staff login" footer={<>Customer? <Link to="/login">Login here</Link></>}>
        <form className="account-form" onSubmit={submit}>
          <label>Email address<input type="email" value={email} onChange={(event) => { setEmail(event.target.value); setError(""); }} autoComplete="email" required /></label>
          <label>Password
            <span className="password-input">
              <input type={showPassword ? "text" : "password"} value={password} onChange={(event) => { setPassword(event.target.value); setError(""); }} autoComplete="current-password" required />
              <button type="button" className="password-toggle" onClick={() => setShowPassword((shown) => !shown)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
            </span>
          </label>
          <button className="forgot-link" type="button" onClick={forgotPassword} disabled={resetBusy}>
            {resetBusy ? <><Loader size="sm" /> Sending…</> : "Forgot password?"}
          </button>
          {error && <p className="form-status error" role="alert">{error}</p>}
          {notice && <p className="form-status success" role="status">{notice}</p>}
          <button className="button button-primary auth-submit" disabled={busy}>
            {busy ? <><Loader size="sm" /> Checking access…</> : "Login"}
          </button>
        </form>
      </AuthLayout>
    </>
  );
}
