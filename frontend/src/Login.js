import { useState } from "react";
import { login } from "./api";

function Login({ onLogin, onClose, onSwitchRegister }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setIsSubmitting(true);
    setMessageType("info");
    setMessage("Signing in...");

    try {
      const result = await login({ email, password });

      if (result.success && result.token) {
        setMessageType("success");
        setMessage("Login successful");
        onLogin(result);
      } else {
        setMessageType("error");
        setMessage(result.error || "Login failed");
      }
    } catch (err) {
      setMessageType("error");
      setMessage("Cannot connect to server");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="auth-v2-page">
      <div className="auth-v2-shell auth-v2-login-shell">
        <div className="auth-v2-crown" aria-hidden="true">♛</div>

        <div className="auth-v2-panel">
          <button type="button" className="auth-v2-close" onClick={onClose} aria-label="Back to home">
            ×
          </button>

          <section className="auth-v2-visual" aria-label="Learning Hub illustration">
            <div className="auth-v2-mini-nav">
              <div className="auth-v2-logo-wrap">
                <img src="/logo1.png" alt="Learning Hub" />
                <strong>Learning Hub</strong>
              </div>
            </div>

            <div className="auth-v2-paper-plane" aria-hidden="true">
              <span className="plane-wing plane-wing-one" />
              <span className="plane-wing plane-wing-two" />
            </div>

            <div className="auth-v2-study-scene" aria-hidden="true">
              <span className="leaf leaf-one" />
              <span className="leaf leaf-two" />
              <span className="leaf leaf-three" />
              <span className="student-head" />
              <span className="student-hair" />
              <span className="student-body" />
              <span className="student-laptop" />
            </div>

            <span className="auth-v2-shape plus-one">+</span>
            <span className="auth-v2-shape plus-two">+</span>
            <span className="auth-v2-shape dot-one" />
            <span className="auth-v2-shape dot-two" />
          </section>

          <section className="auth-v2-form-side">
            <div className="auth-v2-avatar" aria-hidden="true">👤</div>
            <div className="auth-v2-title">
              <h1>Welcome Back</h1>
              <p>Login to continue your A/L learning journey.</p>
            </div>

            <form className="auth-v2-form" onSubmit={handleSubmit}>
              <label htmlFor="login-email">Email Address</label>
              <div className="auth-v2-input">
                <input
                  id="login-email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <span aria-hidden="true">✉</span>
              </div>

              <label htmlFor="login-password">Password</label>
              <div className="auth-v2-input">
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
                  className="auth-v2-show-btn"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>

              <div className="auth-v2-options">
                <label className="auth-v2-check">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span>Remember me</span>
                </label>
                <button type="button" className="auth-v2-link-btn">Forgot Password?</button>
              </div>

              <button type="submit" className="auth-v2-primary" disabled={isSubmitting}>
                {isSubmitting ? <span className="btn-spinner" aria-hidden="true" /> : null}
                {isSubmitting ? "Logging in..." : "Login"}
              </button>

              <p className="auth-v2-bottom-text">
                Don&apos;t have an account?{" "}
                <button type="button" onClick={onSwitchRegister}>Create an account</button>
              </p>
            </form>

            {message ? <p className={`auth-v2-message ${messageType}`}>{message}</p> : null}
          </section>
        </div>
      </div>
    </div>
  );
}

export default Login;
