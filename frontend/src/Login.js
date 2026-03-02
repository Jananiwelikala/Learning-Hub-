import { useState } from "react";
import { login } from "./api";

// Styled login screen matching the dashboard theme.
function Login({ onLogin, onClose }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [role, setRole] = useState("student");
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage("Signing in...");

    try {
      const result = await login({ email, password });

      if (result.token) {
        onLogin(result.token);
        setMessage("Login successful");
      } else {
        setMessage(result.message || "Login failed");
      }
    } catch (err) {
      setMessage("Cannot connect to server");
    }
  }

  return (
    <div className="login-page">
      <header className="login-topbar">
        <div className="login-brand">
          <span className="login-brand-mark">AL</span>
          <span className="login-brand-name">Learning Hub</span>
        </div>

        <button className="back-home" onClick={onClose}>
          &larr; Back to Home
        </button>
      </header>

      <main className="login-main">
        <div className="login-layout">
          <div className="login-headline">
            <h1>Welcome Back!</h1>
            <p>ආයුබෝවන්! Sign in to continue learning</p>
          </div>

          <section className="login-card">
            <h3>Login As</h3>
            <div className="role-switch" aria-label="Login role selector">
              <button
                type="button"
                className={`role-btn ${role === "student" ? "active" : ""}`}
                onClick={() => setRole("student")}
              >
                Student
              </button>
              <button
                type="button"
                className={`role-btn ${role === "teacher" ? "active" : ""}`}
                onClick={() => setRole("teacher")}
              >
                Teacher
              </button>
            </div>

            <form className="login-form" onSubmit={handleSubmit}>
              <label htmlFor="login-email">Email or Phone Number</label>
              <div className="input-wrap">
                <input
                  id="login-email"
                  type="email"
                  placeholder="Enter email or phone number"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <label htmlFor="login-password">Password</label>
              <div className="input-wrap">
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
                <span />
                <button type="button" className="forgot-link">
                  Forgot Password?
                </button>
              </div>

              <button type="submit" className="sign-in-btn">
                Sign In
              </button>

              <div className="login-divider">
                <span>or</span>
              </div>

              <p className="register-hint">
                Don&apos;t have an account? <button type="button">Register Now</button>
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
