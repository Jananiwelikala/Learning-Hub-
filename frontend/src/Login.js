import { useState } from "react";
import { login } from "./api";

// Styled login screen matching the dashboard theme.
function Login({ onLogin, onClose, onSwitchRegister }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage("Signing in...");

    try {
      const result = await login({ email, password });

      if (result.success && result.token) {
        onLogin(result);
        setMessage("Login successful");
      } else {
        setMessage(result.error || "Login failed");
      }
    } catch (err) {
      setMessage("Cannot connect to server");
    }
  }

  return (
    <div className="login-page">
      <header className="login-topbar">
        <div className="login-brand">
          <span className="login-brand-mark login-brand-logo-shell">
            <img src="/logo1.png" alt="Learning Hub logo" className="login-brand-logo-image" />
          </span>
          <span className="login-brand-name">Learning Hub</span>
        </div>

        <button className="back-home" onClick={onClose}>
          &larr; Back to Home
        </button>
      </header>

      <main className="login-main">
        <div className="login-layout">
          <section className="login-card">
            <div className="login-icon-badge">👤</div>

            <div className="login-headline">
              <h1>Welcome Back!</h1>
              <p>Sign in to continue your learning journey</p>
              <p className="login-accent-text">
                Continue your Learning Hub journey with confidence.
              </p>
            </div>

            <form className="login-form" onSubmit={handleSubmit}>
              <label htmlFor="login-email">Email Address</label>
              <div className="input-wrap">
                <span className="input-symbol">✉</span>
                <input
                  id="login-email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <label htmlFor="login-password">Password</label>
              <div className="input-wrap">
                <span className="input-symbol">🔒</span>
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>

              <div className="login-row">
                <label className="remember-check">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span>Remember me</span>
                </label>
                <button type="button" className="forgot-link">
                  Forgot Password?
                </button>
              </div>

              <button type="submit" className="sign-in-btn">
                Sign In
              </button>

              <div className="login-divider">
                <span>or continue with</span>
              </div>

              <p className="register-hint">
                Don&apos;t have an account?{" "}
                <button type="button" onClick={onSwitchRegister}>
                  Register Now
                </button>
              </p>
            </form>

            {message ? <p className="login-message">{message}</p> : null}
          </section>
        </div>
      </main>
    </div>
  );
}

export default Login;
