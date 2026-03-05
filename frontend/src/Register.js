import { useEffect, useState } from "react";
import { getStreams, register } from "./api";

// Registration screen with role selection and basic validation.
function Register({ onClose, onSwitchLogin }) {
  const [role, setRole] = useState("student");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [streamId, setStreamId] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agree, setAgree] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [streams, setStreams] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadStreams() {
      try {
        const data = await getStreams();
        if (Array.isArray(data)) {
          setStreams(data);
        }
      } catch (err) {
        // Stream list is optional for registration submit.
      }
    }

    loadStreams();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();

    if (password.length < 8) {
      setMessage("Password must be at least 8 characters");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Passwords do not match");
      return;
    }

    if (!agree) {
      setMessage("Please accept terms and privacy policy");
      return;
    }

    setMessage("Creating account...");

    try {
      const result = await register({ name, email, password, role });

      if (result.message && !String(result.message).toLowerCase().includes("success")) {
        setMessage(result.message);
        return;
      }

      setMessage("Account created successfully. Please login.");
      setTimeout(() => {
        onSwitchLogin();
      }, 700);
    } catch (err) {
      setMessage("Cannot connect to server");
    }
  }

  return (
    <div className="login-page register-page">
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
        <div className="login-layout register-layout">
          <div className="login-headline">
            <h1>Create Your Account</h1>
            <p>Start your learning journey today</p>
          </div>

          <section className="login-card register-card">
            <h3>Register As</h3>
            <div className="register-role-switch" aria-label="Register role selector">
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
              <label htmlFor="register-name">Full Name</label>
              <div className="input-wrap">
                <input
                  id="register-name"
                  type="text"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="register-row-2">
                <div>
                  <label htmlFor="register-email">Email Address</label>
                  <div className="input-wrap">
                    <input
                      id="register-email"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="register-phone">Phone Number</label>
                  <div className="input-wrap">
                    <input
                      id="register-phone"
                      type="tel"
                      placeholder="07X XXX XXXX"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <label htmlFor="register-stream">Select Your Stream</label>
              <div className="input-wrap select-wrap">
                <select
                  id="register-stream"
                  value={streamId}
                  onChange={(e) => setStreamId(e.target.value)}
                >
                  <option value="">Choose your stream</option>
                  {streams.map((stream) => (
                    <option key={stream._id} value={stream._id}>
                      {stream.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="register-row-2">
                <div>
                  <label htmlFor="register-password">Password</label>
                  <div className="input-wrap">
                    <input
                      id="register-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Min. 8 characters"
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
                </div>

                <div>
                  <label htmlFor="register-confirm">Confirm Password</label>
                  <div className="input-wrap">
                    <input
                      id="register-confirm"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Re-enter password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="icon-btn"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    >
                      {showConfirmPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>
              </div>

              <label className="terms-check">
                <input
                  type="checkbox"
                  checked={agree}
                  onChange={(e) => setAgree(e.target.checked)}
                />
                <span>
                  I agree to the <a href="#home">Terms &amp; Conditions</a> and{" "}
                  <a href="#home">Privacy Policy</a>
                </span>
              </label>

              <button type="submit" className="sign-in-btn">
                Create Account
              </button>

              <p className="register-hint register-hint-login">
                Already have an account?{" "}
                <button type="button" onClick={onSwitchLogin}>
                  Login Now
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

export default Register;
