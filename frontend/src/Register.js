import { useState } from "react";
import { register } from "./api";
import "./App.css";

function Register({ role = "student", onLogin, onClose, onSwitchLogin }) {
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

  const [stream, setStream] = useState("");
  const [alYear, setAlYear] = useState("");

  const [subject, setSubject] = useState("");
  const [teachingMode, setTeachingMode] = useState("");
  const [institute, setInstitute] = useState("");

  const isTeacher = role === "teacher";

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

      if (isTeacher) {
        payload.subject = subject;
        payload.teachingMode = teachingMode;
        payload.institute = institute;
      } else {
        payload.stream = stream;
        payload.alYear = alYear;
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
        setTimeout(() => onLogin(result), 800);
      } else {
        setMessageType("success");
        setMessage("Account created successfully. Please login.");
        setTimeout(() => onSwitchLogin(), 1500);
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
      <div className="auth-v2-shell auth-v2-register-shell">
        <div className="auth-v2-crown" aria-hidden="true">♛</div>

        <div className="auth-v2-panel auth-v2-register-panel">
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

          <section className="auth-v2-form-side auth-v2-register-form-side">
            <div className="auth-v2-avatar" aria-hidden="true">🎓</div>
            <div className="auth-v2-title">
              <h1>Create {isTeacher ? "Teacher" : "Student"} Account</h1>
              <p>{isTeacher ? "Share your classes with A/L students." : "Start learning with organized lessons and practice."}</p>
            </div>

            <form className="auth-v2-form" onSubmit={handleSubmit}>
              <label htmlFor="register-name">Full Name</label>
              <div className="auth-v2-input">
                <input
                  id="register-name"
                  type="text"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
                <span aria-hidden="true">👤</span>
              </div>

              <div className="auth-v2-grid-2">
                <div>
                  <label htmlFor="register-email">Email Address</label>
                  <div className="auth-v2-input">
                    <input
                      id="register-email"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                    <span aria-hidden="true">✉</span>
                  </div>
                </div>

                <div>
                  <label htmlFor="register-phone">Phone Number</label>
                  <div className="auth-v2-input">
                    <input
                      id="register-phone"
                      type="tel"
                      placeholder="07XXXXXXXX"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                    />
                    <span aria-hidden="true">☎</span>
                  </div>
                </div>
              </div>

              {isTeacher ? (
                <>
                  <div className="auth-v2-grid-2">
                    <div>
                      <label htmlFor="register-subject">Main Subject</label>
                      <div className="auth-v2-input auth-v2-select">
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
                      <div className="auth-v2-input auth-v2-select">
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
                  <div className="auth-v2-input">
                    <input
                      id="register-institute"
                      type="text"
                      placeholder="Where do you teach?"
                      value={institute}
                      onChange={(e) => setInstitute(e.target.value)}
                      required
                    />
                    <span aria-hidden="true">🏫</span>
                  </div>
                </>
              ) : (
                <div className="auth-v2-grid-2">
                  <div>
                    <label htmlFor="register-stream">Select Your Stream</label>
                    <div className="auth-v2-input auth-v2-select">
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
                        <option value="Technology">Technology</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="register-year">A/L Examination Year</label>
                    <div className="auth-v2-input auth-v2-select">
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
              )}

              <div className="auth-v2-grid-2">
                <div>
                  <label htmlFor="register-password">Password</label>
                  <div className="auth-v2-input">
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
                      className="auth-v2-show-btn"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="register-confirm">Confirm Password</label>
                  <div className="auth-v2-input">
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
                      className="auth-v2-show-btn"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    >
                      {showConfirmPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>
              </div>

              <label className="auth-v2-check auth-v2-terms">
                <input
                  type="checkbox"
                  checked={agree}
                  onChange={(e) => setAgree(e.target.checked)}
                />
                <span>I agree to the Terms &amp; Conditions and Privacy Policy</span>
              </label>

              <button type="submit" className="auth-v2-primary" disabled={isSubmitting}>
                {isSubmitting ? <span className="btn-spinner" aria-hidden="true" /> : null}
                {isSubmitting ? "Creating Account..." : "Create Account"}
              </button>

              <p className="auth-v2-bottom-text">
                Already have an account?{" "}
                <button type="button" onClick={onSwitchLogin}>Login</button>
              </p>
            </form>

            {message ? <p className={`auth-v2-message ${messageType}`}>{message}</p> : null}
          </section>
        </div>
      </div>
    </div>
  );
}

export default Register;
