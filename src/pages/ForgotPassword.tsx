import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../lib/api";

function generatePassword(): string {
  const lower = "abcdefghijkmnopqrstuvwxyz";
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const digits = "23456789";
  const symbols = "!@#$%&*";
  const all = lower + upper + digits + symbols;

  const pick = (chars: string) => chars[Math.floor(Math.random() * chars.length)];
  const required = [pick(lower), pick(upper), pick(digits), pick(symbols)];
  const rest = Array.from({ length: 8 }, () => pick(all));
  const combined = [...required, ...rest];

  for (let i = combined.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [combined[i], combined[j]] = [combined[j], combined[i]];
  }
  return combined.join("");
}

export function ForgotPassword() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function onGeneratePassword() {
    const generated = generatePassword();
    setNewPassword(generated);
    setConfirmPassword(generated);
    setShowPassword(true);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New password and confirmation do not match");
      return;
    }

    setSubmitting(true);
    try {
      await api.post<{ message: string }>("/auth/change-password", {
        username,
        oldPassword,
        newPassword,
      });
      navigate("/login", { replace: true, state: { resetSuccess: true } });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to change password");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="shell" style={{ minHeight: "100vh", display: "flex", justifyContent: "center", padding: "48px 16px" }}>
      <div style={{ width: "100%", maxWidth: 640 }}>
        <h1 style={{ fontSize: "28px", fontWeight: 800, color: "var(--text)", margin: 0 }}>Change Password</h1>
        <div className="crumb" style={{ marginTop: "6px", marginBottom: "20px" }}>
          <Link to="/login">Home</Link> / <span style={{ color: "var(--accent)" }}>Change Password</span>
        </div>

        <form onSubmit={onSubmit} className="panel" style={{ padding: "24px" }}>
          <div className="field">
            <label>Username</label>
            <input
              className="input"
              style={{ width: "100%" }}
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
              required
            />
          </div>

          <div className="field">
            <label>Existing Password</label>
            <input
              className="input"
              style={{ width: "100%" }}
              type={showPassword ? "text" : "password"}
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              required
            />
          </div>

          <div className="field">
            <label>New Password</label>
            <input
              className="input"
              style={{ width: "100%" }}
              type={showPassword ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>

          <div className="impact-box info" style={{ display: "block", marginBottom: "14px", lineHeight: 1.6 }}>
            <strong>Tips for a Secure Password</strong>
            <div>Use both uppercase and lowercase characters.</div>
            <div>Include at least one symbol (for example, #, $, !, %, or &amp;).</div>
            <div>Do not use dictionary words.</div>
            <div>Passwords can contain up to 64 characters.</div>
          </div>

          <button type="button" className="btn" onClick={onGeneratePassword} style={{ marginBottom: "14px" }}>
            Generate Password
          </button>

          <div className="field">
            <label>Confirm New Password</label>
            <input
              className="input"
              style={{ width: "100%" }}
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11.5px", marginBottom: "14px" }}>
            <input type="checkbox" checked={showPassword} onChange={(e) => setShowPassword(e.target.checked)} />
            Show passwords
          </label>

          {error && (
            <div className="impact-box" style={{ marginBottom: "14px" }}>
              <span>{error}</span>
            </div>
          )}

          <div style={{ borderTop: "1px solid var(--border, #E3E7EC)", margin: "8px 0 16px" }} />

          <div style={{ display: "flex", gap: "10px" }}>
            <button className="btn btn-primary" type="submit" disabled={submitting}>
              {submitting ? "Saving…" : "Save Changes"}
            </button>
            <button type="button" className="btn" onClick={() => navigate("/login")}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
