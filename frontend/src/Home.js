import { useState } from "react";

function Home({ token, onLoginClick, onRegisterClick, onViewAllSubjects, onLogout }) {
  const [activeNav, setActiveNav] = useState("home");

  return (
    <div className="home">
      {/* Top navigation */}
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">AL</span>
          <span className="brand-name">Learning Hub</span>
        </div>

        <nav className="nav">
          <a
            href="#home"
            className={activeNav === "home" ? "active" : ""}
            onClick={() => setActiveNav("home")}
          >
            Home
          </a>
          <a
            href="#subjects"
            className={activeNav === "subjects" ? "active" : ""}
            onClick={(event) => {
              event.preventDefault();
              setActiveNav("subjects");
              onViewAllSubjects();
            }}
          >
            Subjects
          </a>
          <a
            href="#about"
            className={activeNav === "about" ? "active" : ""}
            onClick={() => setActiveNav("about")}
          >
            About Us
          </a>
        </nav>

        {/* Auth actions change by login state */}
        <div className="nav-actions">
          {token ? (
            <button className="btn outline" onClick={onLogout}>
              Logout
            </button>
          ) : (
            <>
              <button className="btn ghost" onClick={onLoginClick}>
                Login
              </button>
              <button className="btn solid" onClick={onRegisterClick}>
                Register
              </button>
            </>
          )}
        </div>
      </header>

      <main>
        {/* Hero section */}
        <section id="home" className="hero">
          <div className="hero-left">
            <span className="pill">Learning Hub for AL students</span>
            <h1>
              Make <span>AL Learning</span>
              <br />
              Easy with AI
            </h1>
            <p>
              The modern AI learning platform designed for GCE Advanced Level
              students in Sri Lanka. Practice with past papers and get AI
              chatbot support to ensure your success.
            </p>
            <p className="accent-line">AI මගින් AL ඉගෙනීම දැන් පහසුයි!</p>
            <div className="hero-actions">
              <button className="btn solid" onClick={onRegisterClick}>Get Started Now</button>
              <button className="btn outline">Try AI Chatbot</button>
            </div>
            
            </div>
          

          <div className="hero-right">
            {/* Dashboard illustration image */}
            <div className="image-card">
              <img src="/dashboard-image.png" alt="Students learning" />
            </div>
          </div>
        </section>

        {/* Product feature cards */}
        <section className="section key-features">
          <div className="section-header">
            <h2>Key Features</h2>
            <p>
              Features designed to make your AL learning more effective and
              enjoyable
            </p>
          </div>
          <div className="feature-grid">
            <div className="feature-card blue">
              <div className="feature-icon">🤖</div>
              <h3>AI Chatbot</h3>
              <p>
                Ask any question in Sinhala or English. Our AI tutor provides
                detailed explanations and examples to help you understand
                better.
              </p>
              <p className="feature-accent blue-text">
                සිංහලෙන් ප්‍රශ්න අසන්න!
              </p>
              <button className="link-btn blue-text">Learn More →</button>
            </div>

            <div className="feature-card green">
              <div className="feature-icon">📄</div>
              <h3>Past Papers</h3>
              <p>
                Practice with 5 years of past papers including MCQ, Structured,
                and Essay questions. Track your progress over time.
              </p>
              <p className="feature-accent green-text">
                පහසුවෙන් පසු ප්‍රශ්න පත්‍ර පුහුණු වන්න
              </p>
              <button className="link-btn green-text">Learn More →</button>
            </div>

            <div className="feature-card purple">
              <div className="feature-icon">📈</div>
              <h3>AI Marking</h3>
              <p>
                Get your answers automatically marked by AI with detailed
                feedback and improvement suggestions in Sinhala.
              </p>
              <p className="feature-accent purple-text">
                AI ඇගයීම් තුළින් නිවැරදි කිරීම
              </p>
              <button className="link-btn purple-text">Learn More →</button>
            </div>
          </div>
        </section>

        {/* 3-step usage flow */}
        <section className="section how-it-works">
          <div className="section-header">
            <h2>How It Works</h2>
            <p>Start your AL learning journey in 3 simple steps</p>
          </div>
          <div className="steps">
            <div className="step-card">
              <div className="step-badge blue">1</div>
              <h3>Register</h3>
              <p>
                Choose your stream and subjects, then create a free account to
                get started.
              </p>
              <p className="step-accent blue-text">
                නොමිලේ ලියාපදිංචි වන්න
              </p>
            </div>

            <div className="step-card">
              <div className="step-badge green">2</div>
              <h3>Practice</h3>
              <p>
                Improve your knowledge using past papers and the AI chatbot for
                guidance.
              </p>
              <p className="step-accent green-text">පුහුණු වී දැනුම වැඩි කරගන්න</p>
            </div>

            <div className="step-card">
              <div className="step-badge purple">3</div>
              <h3>Track Progress</h3>
              <p>
                Analyze your results and improve your weak areas with AI
                recommendations.
              </p>
              <p className="step-accent purple-text">
                ප්‍රගතිය නිවැරදිව තක්සේරු කරන්න
              </p>
            </div>
          </div>
        </section>

        {/* Stream and subject overview */}
        <section id="subjects" className="section streams">
          <div className="section-header">
            <h2>Streams &amp; Subjects</h2>
            <p>Choose your stream and start learning the relevant subjects</p>
          </div>

          <div className="stream-grid">
            <div className="stream-card green">
              <div className="stream-icon">🧪</div>
              <h3>Biology Stream</h3>
              <p className="stream-accent green-text">ජීව විද්‍යා ධාරාව</p>
              <p>Biology, Chemistry, Physics</p>
              <div className="tag-row green-text">
                <span className="tag">Biology</span>
                <span className="tag">Chemistry</span>
                <span className="tag">Physics</span>
              </div>
            </div>

            <div className="stream-card blue">
              <div className="stream-icon">🧮</div>
              <h3>Mathematics Stream</h3>
              <p className="stream-accent blue-text">ගණිත ධාරාව</p>
              <p>Combined Maths, Physics, Chemistry</p>
              <div className="tag-row blue-text">
                <span className="tag">Combined Maths</span>
                <span className="tag">Physics</span>
                <span className="tag">Chemistry</span>
              </div>
            </div>

            <div className="stream-card orange">
              <div className="stream-icon">📊</div>
              <h3>Commerce Stream</h3>
              <p className="stream-accent orange-text">වාණිජ ධාරාව</p>
              <p>Accounting, Business Studies, Economics</p>
              <div className="tag-row orange-text">
                <span className="tag">Accounting</span>
                <span className="tag">Business</span>
                <span className="tag">Economics</span>
              </div>
            </div>
          </div>

          <div className="center-cta">
            <button className="btn solid" onClick={onViewAllSubjects}>
              View All Subjects
            </button>
          </div>
        </section>

        {/* Short project introduction */}
        <section id="about" className="section">
          <h2>About Us</h2>
          <p>
            We help AL students learn faster with smart practice, AI help, and
            a simple study path.
          </p>
        </section>

        {/* Final call-to-action */}
        <section className="cta">
          <div className="cta-content">
            <h2>Start Your AL Success Journey Today</h2>
            <p>Make your learning more effective with AI technology.</p>
            <p className="cta-accent">
              ඔබේ AL සාර්ථකත්වය අද ආරම්භ කරන්න!
            </p>
            <div className="cta-actions">
              <button className="btn solid">Register for Free</button>
              <button className="btn outline light">Learn More</button>
            </div>
          </div>
        </section>

        {/* Footer links and contact */}
        <footer className="site-footer">
          <div className="footer-grid">
            <div>
              <div className="brand footer-brand">
                <span className="brand-mark">AL</span>
                <span className="brand-name">AL Learning</span>
              </div>
              <p>
                AI-powered learning platform for GCE Advanced Level students in
                Sri Lanka.
              </p>
              <p className="footer-accent">අදම AL ඉගෙනීම අරඹන්න</p>
            </div>

            <div>
              <h4>Quick Links</h4>
              <ul>
                <li>Home</li>
                <li>Subjects</li>
                <li>About Us</li>
                <li>Help</li>
              </ul>
            </div>

            <div>
              <h4>Account</h4>
              <ul>
                <li>Login</li>
                <li>Register</li>
                <li>Dashboard</li>
              </ul>
            </div>

            <div>
              <h4>Contact Us</h4>
              <ul>
                <li>info@allearning.lk</li>
                <li>+94 11 234 5678</li>
              </ul>
              <div className="socials">
                <span>f</span>
                <span>yt</span>
                <span>wa</span>
              </div>
            </div>
          </div>
          <div className="footer-divider"></div>
          <p className="footer-copy">© 2026 AL Learning. All rights reserved.</p>
        </footer>
      </main>
    </div>
  );
}

export default Home;


