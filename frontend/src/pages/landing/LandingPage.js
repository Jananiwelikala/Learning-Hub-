import { useState } from "react";
import "./LandingPage.css";

function LandingPage({
  token,
  onLoginClick,
  onRegisterClick,
  onViewAllSubjects,
  onAboutClick,
  onLogout
}) {
  const [activeNav, setActiveNav] = useState("home");

  return (
    <div className="home">
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
            onClick={(event) => {
              event.preventDefault();
              setActiveNav("about");
              onAboutClick();
            }}
          >
            About Us
          </a>
        </nav>

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
        <section id="home" className="hero">
          <div className="hero-left">
            <span className="pill">Smart learning platform for AL students</span>

            <h1>
              Make <span>AL Learning</span>
              <br />
              Easy with Learning Hub
            </h1>

            <p>
              The modern AI-powered learning platform for GCE Advanced Level students in Sri Lanka.
              Watch lesson videos, explore notes, past papers, practice past papers, discover classes shared by
              teachers, and get instant AI support to improve your learning faster.
            </p>

            <p className="accent-line">
              Learning Hub මගින් උසස් පෙළ අධ්‍යාපනය පහසු කරමු! 🎓
            </p>

            <div className="hero-actions">
              <button className="btn solid" onClick={onRegisterClick}>
                Get Started Now
              </button>
              <button className="btn outline" onClick={onLoginClick}>
                Try AI Chatbot
              </button>
            </div>
          </div>

          <div className="hero-right">
            <div className="image-card">
              <img src="/dashboard-image.png" alt="Students learning" />
            </div>
          </div>
        </section>

        <section className="section key-features">
          <div className="section-header">
            <h2>Key Features</h2>
            <p>
              Everything students need to learn clearly, practice confidently, and improve effectively
            </p>
          </div>

          <div className="feature-grid">
  <div className="feature-card blue">
    <div className="feature-icon">🎥</div>
    <h3>Lesson Videos</h3>
    <p>
      Students can watch lesson-based videos to understand each topic clearly and build
      strong subject knowledge.
    </p>
    <p className="feature-accent blue-text">
      පාඩම් වීඩියෝ මඟින් ඉගෙන ගන්න
    </p>
  </div>

  <div className="feature-card green">
    <div className="feature-icon">📘</div>
    <h3>Notes & Resources</h3>
    <p>
      Explore and download theory notes and learning materials provided for each lesson
      to support self-study.
    </p>
    <p className="feature-accent green-text">
      සටහන් සහ ඉගෙනුම් සම්පත් ලබාගන්න
    </p>
  </div>

  <div className="feature-card purple">
    <div className="feature-icon">📝</div>
    <h3>Past Paper Practice</h3>
    <p>
      Practice past paper questions according to the lesson.
    </p>
    <p className="feature-accent purple-text">
      පසුගිය ප්‍රශ්න පත්‍ර වල ප්‍රශ්න මඟින් පුහුණුව ලබා ගන්න
    </p>
  </div>

  <div className="feature-card blue">
    <div className="feature-icon">🤖</div>
    <h3>AI Chatbot Support</h3>
    <p>
      Ask anything you cannot understand about the lesson and get support instantly.
    </p>
    <p className="feature-accent blue-text">
      නොතේරෙන දේවල් ගැන AI chatbot සහාය ලබා ගන්න
    </p>
  </div>

  <div className="feature-card green">
    <div className="feature-icon">📊</div>
    <h3>Track Progress</h3>
    <p>
      Students can review their performance and get a better idea of their progress
      in each lesson and subject area.
    </p>
    <p className="feature-accent green-text">
      ඔබේ ප්‍රගතිය නිරීක්ෂණය කරන්න
    </p>
  </div>

  <div className="feature-card purple">
    <div className="feature-icon">🏫</div>
    <h3>Explore Online & Physical Classes</h3>
    <p>
      Explore online and physical classes shared by teachers.
    </p>
    <p className="feature-accent purple-text">
      ලංකාව පුරා ඇති පන්ති පිළිබඳ විස්තර දැන ගන්න
    </p>
  </div>
</div>
        </section>

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
                Create your free account and sign in to start learning with ease.
              </p>
              <p className="step-accent blue-text">
                නොමිලේ ලියාපදිංචි වන්න
              </p>
            </div>

            <div className="step-card">
              <div className="step-badge green">2</div>
              <h3>Learn & Practice</h3>
              <p>
                Watch lesson videos, refer to notes, and practice past papers to improve your
                knowledge and skills.
              </p>
              <p className="step-accent green-text">
                ඉගෙනගෙන පුහුණු වන්න
              </p>
            </div>

            <div className="step-card">
              <div className="step-badge purple">3</div>
              <h3>Track Progress</h3>
              <p>
                Analyze your results and understand your progress in each lesson with guided
                learning support.
              </p>
              <p className="step-accent purple-text">
                ප්‍රගතිය නිවැරදිව තක්සේරු කරන්න
              </p>
            </div>
          </div>
        </section>

        <section className="section teacher-support">
  <div className="section-header">
    <h2>For Teachers</h2>
    <p>A simple way to share class details with students</p>
  </div>

  <div className="teacher-support-card">
    <div className="teacher-support-icon">🏫</div>
    <h3>Publish Class Details</h3>
    <p>
      Teachers can publish online and physical class details so students can
      easily explore learning opportunities across Sri Lanka.
    </p>
    <p className="teacher-support-accent">
      ලංකාව පුරා ඇති පන්ති පිළිබඳ විස්තර පළ කරන්න
    </p>
  </div>
</section>

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
              <div className="stream-icon">📐</div>
              <h3>Mathematics Stream</h3>
              <p className="stream-accent blue-text">ගණිත ධාරාව</p>
              <p>Combined Mathematics, Physics, Chemistry</p>
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

        

        <section className="cta">
          <div className="cta-content">
            <h2>Start Your AL Success Journey Today</h2>
            <p>
              Learn with videos, notes, past papers, AI support, and class discovery in one place.
            </p>
            <p className="cta-accent">
              ඔබේ AL සාර්ථකත්වය අද ආරම්භ කරන්න!
            </p>
            <div className="cta-actions">
              <button className="btn solid" onClick={onRegisterClick}>
                Register for Free
              </button>
              <button className="btn outline light" onClick={onAboutClick}>
                Learn More
              </button>
            </div>
          </div>
        </section>

        <footer className="site-footer">
          <div className="footer-grid">
            <div>
              <div className="brand footer-brand">
                <span className="brand-mark">AL</span>
                <span className="brand-name">Learning Hub</span>
              </div>
              <p>
                AI-powered learning platform for GCE Advanced Level students in Sri Lanka.
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
                <li>info@learninghub.lk</li>
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
          <p className="footer-copy">© 2026 Learning Hub. All rights reserved.</p>
        </footer>
      </main>
    </div>
  );
}

export default LandingPage;
