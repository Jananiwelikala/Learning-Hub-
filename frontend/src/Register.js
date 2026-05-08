import { useState } from "react";
import { register } from "./api";
import "./App.css";

// Registration screen with role selection and basic validation.
function Register({ role, onLogin, onClose, onSwitchLogin }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agree, setAgree] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Student specific fields
  const [stream, setStream] = useState("");
  const [alYear, setAlYear] = useState("");

  // Teacher specific fields
  const [subject, setSubject] = useState("");
  const [teachingMode, setTeachingMode] = useState("");
  const [institute, setInstitute] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();

    if (password.length < 8) {
      setMessageType("error");
      setMessage("Password must be at least 8 characters");
      return;
    }

    if (password !== confirmPassword) {
      setMessageType("error");
      setMessage("Passwords do not match");
      return;
    }

    if (!agree) {
      setMessageType("error");
      setMessage("Please accept terms and privacy policy");
      return;
    }

    setIsSubmitting(true);
    setMessageType("info");
    setMessage("Creating account...");

    try {
      const payload = {
        name,
        email,
        phone,
        password,
        role,
      };

      if (role === "student") {
        payload.stream = stream;
        payload.alYear = alYear;
      } else {
        payload.subject = subject;
        payload.teachingMode = teachingMode;
        payload.institute = institute;
      }

      const result = await register(payload);

      if (!result.success) {
        setMessageType("error");
        setMessage(result.error || "Registration failed");
        return;
      }

      if (result.token) {
        setMessageType("success");
        setMessage("Account created! Redirecting to your dashboard...");
        setTimeout(() => {
          onLogin(result);
        }, 800);
      } else {
        setMessageType("success");
        setMessage("Account created successfully. Please login.");
        setTimeout(() => {
          onSwitchLogin();
        }, 1500);
      }
    } catch (err) {
      setMessageType("error");
      setMessage("Cannot connect to server");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="login-page register-page">
      <header className="login-topbar">
        <button className="back-home" onClick={onClose}>
          &larr; Back to Home
        </button>
        <div className="login-brand">
          <span className="login-brand-mark login-brand-logo-shell">
            <img src="/logo1.png" alt="Learning Hub logo" className="login-brand-logo-image" />
          </span>
          <span className="login-brand-name">Learning Hub</span>
        </div>
      </header>

      <main className="login-main">
        <div className="login-layout register-layout">
          <div className="login-headline">
            <h2>Create {role === "teacher" ? "Teacher" : "Student"} Account</h2>
            <p>Start your learning journey today</p>
          </div>

          <section className="login-card register-card">
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
                      placeholder="07XXXXXXXX"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              {role === "student" ? (
                <div className="register-row-2">
                  <div>
                    <label htmlFor="register-stream">Select Your Stream</label>
                    <div className="input-wrap select-wrap">
                      <select
                        id="register-stream"
                        value={stream}
                        onChange={(e) => setStream(e.target.value)}
                        required
                      >
                        <option value="">Choose stream</option>
                        <option value="Science">Science</option>
                        <option value="Commerce">Commerce</option>
                        <option value="Arts">Arts</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label htmlFor="register-year">A/L Examination Year</label>
                    <div className="input-wrap select-wrap">
                      <select
                        id="register-year"
                        value={alYear}
                        onChange={(e) => setAlYear(e.target.value)}
                        required
                      >
                        <option value="">Choose year</option>
                        <option value="2026 A/L">2026 A/L</option>
                        <option value="2027 A/L">2027 A/L</option>
                        <option value="2028 A/L">2028 A/L</option>
                      </select>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="register-row-2">
                    <div>
                      <label htmlFor="register-subject">Main Subject</label>
                      <div className="input-wrap select-wrap">
                        <select
                          id="register-subject"
                          value={subject}
                          onChange={(e) => setSubject(e.target.value)}
                          required
                        >
                          <option value="">Choose subject</option>
                          <option value="Combined Maths">Combined Maths</option>
                          <option value="Biology">Biology</option>
                          <option value="Physics">Physics</option>
                          <option value="Chemistry">Chemistry</option>
                          <option value="Accounting">Accounting</option>
                          <option value="Economics">Economics</option>
                          <option value="ICT">ICT</option>
                          <option value="Business Studies">Business Studies</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label htmlFor="register-mode">Teaching Mode</label>
                      <div className="input-wrap select-wrap">
                        <select
                          id="register-mode"
                          value={teachingMode}
                          onChange={(e) => setTeachingMode(e.target.value)}
                          required
                        >
                          <option value="">Choose mode</option>
                          <option value="Online">Online</option>
                          <option value="Physical">Physical</option>
                          <option value="Both">Both</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  <label htmlFor="register-institute">Institute / Class Name</label>
                  <div className="input-wrap">
                    <input
                      id="register-institute"
                      type="text"
                      placeholder="Where do you teach?"
                      value={institute}
                      onChange={(e) => setInstitute(e.target.value)}
                      required
                    />
                  </div>
                </>
              )}

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

              <button type="submit" className="sign-in-btn" disabled={isSubmitting}>
                {isSubmitting ? <span className="btn-spinner" aria-hidden="true" /> : null}
                {isSubmitting ? "Creating Account..." : "Create Account"}
              </button>

              <p className="register-hint register-hint-login">
                Already have an account?{" "}
                <button type="button" onClick={onSwitchLogin}>
                  Login
                </button>
              </p>
            </form>

            {message ? <p className={`login-message ${messageType}`}>{message}</p> : null}
          </section>
        </div>
      </main>
    </div>
  );
}

export default Register;


