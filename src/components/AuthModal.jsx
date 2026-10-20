import React, { useState } from "react";
import { ArrowRight, Mail } from "lucide-react";
import { useRates } from "../context/RatesContext";
import { requireBackend, unwrap } from "../lib/supabase";
import { Modal } from "../ui/Modal";
export function AuthModal() {
  const {
    authDialog: mode,
    setAuthDialog,
    login,
    signup,
    isConfigured,
    notify,
  } = useRates();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  if (!mode) return null;
  function changeMode(next) {
    setError("");
    setMessage("");
    setPassword("");
    setAuthDialog(next);
  }
  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      if (mode === "login") await login(email, password);
      if (mode === "signup") {
        const signedIn = await signup({ email, password, name, company });
        if (!signedIn)
          setMessage(
            "Check your inbox for a confirmation link. After confirming your email, return here to sign in. If you already have an account, sign in instead.",
          );
      }
      if (mode === "reset") {
        unwrap(
          await requireBackend().auth.resetPasswordForEmail(email.trim(), {
            redirectTo: `${window.location.origin}${window.location.pathname}`,
          }),
        );
        setMessage(
          "If an account exists for this email, a password reset link will arrive shortly.",
        );
      }
      if (mode === "recovery") {
        unwrap(await requireBackend().auth.updateUser({ password }));
        setAuthDialog(null);
        notify("Your password has been updated.");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      title={
        mode === "signup"
          ? "Create your exporter account"
          : mode === "reset"
            ? "Reset your password"
            : mode === "recovery"
              ? "Choose a new password"
              : "Welcome back"
      }
      onClose={() => !busy && setAuthDialog(null)}
    >
      <p className="muted">
        {mode === "signup"
          ? "Save your shipments and keep your export documents together."
          : "Continue to your shipments and documents."}
      </p>
      {!isConfigured && (
        <div className="notice warning">
          Accounts are not available in this preview. The project needs a
          Supabase connection before you can register or sign in.
        </div>
      )}
      <form onSubmit={submit} className="form-stack">
        {mode === "signup" && (
          <>
            <label>
              Full name
              <input
                required
                autoComplete="name"
                maxLength={120}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            <label>
              Company or farm
              <input
                required
                autoComplete="organization"
                maxLength={160}
                value={company}
                onChange={(e) => setCompany(e.target.value)}
              />
            </label>
          </>
        )}
        {mode !== "recovery" && (
          <label>
            Email address
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
            />
          </label>
        )}
        {mode !== "reset" && (
          <label>
            Password
            <input
              type="password"
              required
              minLength={mode === "login" ? 1 : 10}
              maxLength={128}
              autoComplete={
                mode === "login" ? "current-password" : "new-password"
              }
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {mode !== "login" && (
              <span className="field-hint">Use at least 10 characters.</span>
            )}
          </label>
        )}
        {error && (
          <p className="notice error" role="alert">
            {error}
          </p>
        )}
        {message && (
          <p className="notice success" role="status">
            <Mail size={18} />
            {message}
          </p>
        )}
        <button
          className="button primary full"
          disabled={busy || !isConfigured || Boolean(message)}
        >
          {busy
            ? "Please wait…"
            : mode === "signup"
              ? "Create account"
              : mode === "reset"
                ? "Send reset link"
                : mode === "recovery"
                  ? "Update password"
                  : "Sign in"}
          <ArrowRight size={17} />
        </button>
      </form>
      {mode !== "recovery" && (
        <div className="auth-links">
          {mode === "login" ? (
            <>
              <button
                className="text-button"
                onClick={() => changeMode("reset")}
              >
                Forgot password?
              </button>
              <button
                className="text-button"
                onClick={() => changeMode("signup")}
              >
                Create an account
              </button>
            </>
          ) : (
            <button className="text-button" onClick={() => changeMode("login")}>
              Back to sign in
            </button>
          )}
        </div>
      )}
    </Modal>
  );
}
