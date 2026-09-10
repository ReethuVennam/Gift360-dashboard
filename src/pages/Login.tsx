import { useState, type FormEvent } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../shared/AuthContext";

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const state = location.state as { from?: string; resetSuccess?: boolean } | null;
  const from = state?.from ?? "/";
  const resetSuccess = state?.resetSuccess ?? false;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(username, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="shell" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
      <form onSubmit={onSubmit} className="panel" style={{ width: 360, padding: "28px" }}>
        <div className="section-head" style={{ marginBottom: "18px" }}>
          <div>
            <h2>Gift360 Admin</h2>
            <div className="desc">Sign in to the admin console</div>
          </div>
        </div>
        <div className="field">
          <label>Username</label>
          <input
            className="input"
            style={{ width: "100%" }}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoFocus
            required
          />
        </div>
        <div className="field">
          <label>Password</label>
          <input
            className="input"
            style={{ width: "100%" }}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <div className="hint" style={{ textAlign: "right", marginTop: "6px" }}>
            <Link to="/forgot-password">Forgot password?</Link>
          </div>
        </div>
        {resetSuccess && !error && (
          <div className="impact-box success" style={{ marginBottom: "12px" }}>
            <span>Password reset successful. Please sign in with your new password.</span>
          </div>
        )}
        {error && (
          <div className="impact-box" style={{ marginBottom: "12px" }}>
            <span>{error}</span>
          </div>
        )}
        <button className="btn btn-primary" type="submit" disabled={submitting} style={{ width: "100%" }}>
          {submitting ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
