import { useState } from "react";
import "./LandingPage.css";

const streamConfig = [
  {
    id: "biology",
    theme: "biology",
    icon: "🧬",
    title: "Biology Stream",
    subtitle: "ජීව විද්‍යා ධාරාව",
    subjects: ["Biology", "Chemistry", "Physics"],
  },
  {
    id: "maths",
    theme: "maths",
    icon: "📐",
    title: "Mathematics Stream",
    subtitle: "ගණිත ධාරාව",
    subjects: ["Combined Maths", "Physics", "Chemistry"],
  },
  {
    id: "commerce",
    theme: "commerce",
    icon: "💼",
    title: "Commerce Stream",
    subtitle: "වාණිජ ධාරාව",
    subjects: ["Accounting", "Business Studies", "Economics"],
  },
  {
    id: "arts",
    theme: "arts",
    icon: "🎨",
    title: "Arts Stream",
    subtitle: "කලා ධාරාව",
    subjects: ["Political Science", "Geography", "Logic"],
  },
];

const subjectConfig = {
  biology: [
    {
      name: "Biology",
      subtitle: "ජීව විද්‍යාව",
      icon: "🧬",
      description: "Study cells, genetics, plants, animals, and human biology with clear lesson paths.",
    },
    {
      name: "Chemistry",
      subtitle: "රසායන විද්‍යාව",
      icon: "⚗️",
      description: "Learn reactions, calculations, organic chemistry, and lab-based concepts.",
    },
    {
      name: "Physics",
      subtitle: "භෞතික විද්‍යාව",
      icon: "⚛️",
      description: "Understand mechanics, waves, electricity, fields, and modern physics.",
    },
  ],
  maths: [
    {
      name: "Combined Mathematics",
      subtitle: "සංයුක්ත ගණිතය",
      icon: "📐",
      description: "Practice pure mathematics, applied mathematics, calculus, and mechanics.",
    },
    {
      name: "Physics",
      subtitle: "භෞතික විද්‍යාව",
      icon: "⚛️",
      description: "Learn physics theory and exam-style problem solving step by step.",
    },
    {
      name: "Chemistry",
      subtitle: "රසායන විද්‍යාව",
      icon: "⚗️",
      description: "Improve chemistry knowledge with notes, lessons, and practice questions.",
    },
  ],
  commerce: [
    {
      name: "Accounting",
      subtitle: "ගිණුම්කරණය",
      icon: "📊",
      description: "Learn financial statements, adjustments, costing, and accounting concepts.",
    },
    {
      name: "Business Studies",
      subtitle: "ව්‍යාපාර අධ්‍යයනය",
      icon: "🏢",
      description: "Understand management, marketing, business environment, and operations.",
    },
    {
      name: "Economics",
      subtitle: "ආර්ථික විද්‍යාව",
      icon: "📈",
      description: "Study demand, supply, markets, national income, and economic systems.",
    },
  ],
  arts: [
    {
      name: "Political Science",
      subtitle: "දේශපාලන විද්‍යාව",
      icon: "⚖️",
      description: "Learn government systems, democracy, constitutions, and political theory.",
    },
    {
      name: "Geography",
      subtitle: "භූගෝල විද්‍යාව",
      icon: "🌍",
      description: "Study physical geography, human geography, maps, and environments.",
    },
    {
      name: "Logic",
      subtitle: "තර්ක ශාස්ත්‍රය",
      icon: "🧠",
      description: "Practice reasoning, arguments, formal logic, and critical thinking.",
    },
  ],
};

function Topbar({
  active = "home",
  token,
  onHomeClick,
  onSubjectsClick,
  onAboutClick,
  onLoginClick,
  onRegisterClick,
  onLogout,
}) {
  return (
    <header className="topbar">
      <button className="brand brand-button" type="button" onClick={onHomeClick}>
        <span className="brand-mark">
          <img
            src="/logo1.png"
            alt="Learning Hub"
            className="brand-logo-image"
            onError={(event) => {
              event.currentTarget.style.display = "none";
              event.currentTarget.parentElement.textContent = "AL";
            }}
          />
        </span>
        <span className="brand-name">Learning Hub</span>
      </button>

      <nav className="nav">
        <button
          type="button"
          className={active === "home" ? "active" : ""}
          onClick={onHomeClick}
        >
          Home
        </button>

        <button
          type="button"
          className={active === "subjects" ? "active" : ""}
          onClick={onSubjectsClick}
        >
          Subjects
        </button>

        <button
          type="button"
          className={active === "about" ? "active" : ""}
          onClick={onAboutClick}
        >
          About Us
        </button>
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
  );
}

function Footer({ onHomeClick, onSubjectsClick, onAboutClick, onLoginClick, onRegisterClick }) {
  return (
    <footer className="site-footer">
      <div className="footer-grid">
        <div>
          <div className="footer-brand-row">
            <span className="brand-mark footer-logo">AL</span>
            <span className="brand-name">Learning Hub</span>
          </div>
          <p>
            AI-powered learning platform for G.C.E. Advanced Level students in Sri Lanka.
          </p>
          <p className="footer-accent">අදම A/L ඉගෙනීම ආරම්භ කරන්න</p>
        </div>

        <div>
          <h4>Quick Links</h4>
          <button onClick={onHomeClick}>Home</button>
          <button onClick={onSubjectsClick}>Subjects</button>
          <button onClick={onAboutClick}>About Us</button>
        </div>

        <div>
          <h4>Account</h4>
          <button onClick={onLoginClick}>Login</button>
          <button onClick={onRegisterClick}>Register</button>
        </div>

        <div>
          <h4>Contact</h4>
          <p>info@learninghub.lk</p>
          <p>+94 11 234 5678</p>
          <div className="socials">
            <span>f</span>
            <span>yt</span>
            <span>wa</span>
          </div>
        </div>
      </div>

      <div className="footer-divider" />
      <p className="footer-copy">© 2026 Learning Hub. All rights reserved.</p>
    </footer>
  );
}

function RegisterModal({ onClose, onRegisterClick, onLoginClick }) {
  return (
    <div className="register-modal-backdrop" onClick={onClose}>
      <div className="register-modal-card" onClick={(event) => event.stopPropagation()}>
        <button className="modal-close-btn" type="button" onClick={onClose}>
          ×
        </button>

        <div className="modal-icon">🎓</div>
        <h3>Register to Continue</h3>
        <p>
          Create your free account to access lessons, notes, past paper practice,
          AI support, and progress tracking.
        </p>
        <p className="modal-sinhala">
          පාඩම් බැලීමට සහ ඉගෙනීම ආරම්භ කිරීමට ලියාපදිංචි වන්න.
        </p>

        <div className="modal-actions">
          <button className="btn solid" onClick={onRegisterClick}>
            Register Now
          </button>
          <button className="btn outline" onClick={onLoginClick}>
            I already have an account
          </button>
        </div>
      </div>
    </div>
  );
}

function LandingPage({
  token,
  onLoginClick,
  onRegisterClick,
  onViewAllSubjects,
  onAboutClick,
  onLogout,
}) {
  const handleHomeClick = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubjectsClick = () => {
    onViewAllSubjects();
  };

  const handleAboutClick = () => {
    onAboutClick();
  };

  return (
    <div className="home">
      <Topbar
        active="home"
        token={token}
        onHomeClick={handleHomeClick}
        onSubjectsClick={handleSubjectsClick}
        onAboutClick={handleAboutClick}
        onLoginClick={onLoginClick}
        onRegisterClick={onRegisterClick}
        onLogout={onLogout}
      />

      <main>
        <section className="hero">
          <div className="hero-left">
            <span className="pill">A/L සිසුන් සඳහා smart learning platform එක</span>

            <h1>
              Learn Smarter for <span>A/L Success</span>
            </h1>

            <p>
              Lessons, notes, past paper practice, teacher class details, and AI support
              in one calm learning space for Sri Lankan A/L students.
            </p>

            <p className="accent-line">
              උසස් පෙළ ඉගෙනීම පහසු, පැහැදිලි සහ සංවිධානාත්මක කරමු 🎓
            </p>

            <div className="hero-actions">
              <button className="btn solid" onClick={onRegisterClick}>
                Start Learning
              </button>
              <button className="btn outline" onClick={onLoginClick}>
                Try AI Support
              </button>
            </div>
          </div>

          <div className="hero-right">
            <div className="hero-image-card">
              <img src="/dashboard-image.png" alt="Students learning" />
            </div>
          </div>
        </section>

        <section className="section key-features">
          <div className="section-header">
            <span className="section-kicker">Why students use Learning Hub</span>
            <h2>Key Features</h2>
            <p>Everything students need to learn clearly and practice confidently.</p>
          </div>

          <div className="feature-grid">
            <div className="feature-card">
              <div className="feature-icon">🎥</div>
              <h3>Lesson Videos</h3>
              <p>Watch lesson-based videos and understand each topic clearly.</p>
              <p className="feature-accent">පාඩම් වීඩියෝ මඟින් පහසුවෙන් ඉගෙන ගන්න</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">📘</div>
              <h3>Notes & Resources</h3>
              <p>Explore theory notes and learning materials for self-study.</p>
              <p className="feature-accent">සටහන් සහ සම්පත් එකම තැනකින් ලබාගන්න</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">📝</div>
              <h3>Past Paper Practice</h3>
              <p>Practice exam-style questions according to each lesson.</p>
              <p className="feature-accent">පසුගිය ප්‍රශ්න පත්‍ර මඟින් පුහුණු වන්න</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🤖</div>
              <h3>AI Study Support</h3>
              <p>Ask lesson-related questions and get instant learning support.</p>
              <p className="feature-accent">නොතේරෙන පාඩම් සඳහා AI සහාය ලබාගන්න</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3>Track Progress</h3>
              <p>Understand your progress and focus on weak areas.</p>
              <p className="feature-accent">ඔබේ ප්‍රගතිය පැහැදිලිව නිරීක්ෂණය කරන්න</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🏫</div>
              <h3>Teacher Classes</h3>
              <p>Find online and physical classes shared by teachers.</p>
              <p className="feature-accent">ගුරුවරුන්ගේ පන්ති විස්තර පහසුවෙන් බලන්න</p>
            </div>
          </div>
        </section>

        <section className="section how-it-works">
          <div className="section-header">
            <span className="section-kicker">Simple learning flow</span>
            <h2>How It Works</h2>
            <p>Start your A/L learning journey in three simple steps.</p>
          </div>

          <div className="steps">
            <div className="step-card">
              <div className="step-badge">1</div>
              <h3>Register</h3>
              <p>Create your free account and start learning.</p>
              <p className="step-accent">නොමිලේ ලියාපදිංචි වන්න</p>
            </div>

            <div className="step-card">
              <div className="step-badge">2</div>
              <h3>Learn & Practice</h3>
              <p>Watch videos, read notes, and practice questions.</p>
              <p className="step-accent">ඉගෙනගෙන පුහුණු වන්න</p>
            </div>

            <div className="step-card">
              <div className="step-badge">3</div>
              <h3>Improve</h3>
              <p>Use feedback and progress tracking to improve.</p>
              <p className="step-accent">ඔබේ ප්‍රගතිය වැඩි දියුණු කරන්න</p>
            </div>
          </div>
        </section>

        <section className="section teacher-support">
          <div className="teacher-support-card">
            <div className="teacher-support-icon">🏫</div>
            <div>
              <span className="section-kicker">For teachers</span>
              <h2>Share Class Details Easily</h2>
              <p>
                Teachers can publish online and physical class details so students can
                find learning opportunities without searching across many platforms.
              </p>
              <p className="teacher-support-accent">
                ගුරුවරුන්ට තම පන්ති විස්තර සිසුන්ට පහසුවෙන් පෙන්විය හැක.
              </p>
            </div>
          </div>
        </section>

        <section className="section streams">
          <div className="section-header">
            <span className="section-kicker">Choose your path</span>
            <h2>Streams &amp; Subjects</h2>
            <p>Choose your stream and continue with relevant subjects.</p>
          </div>

          <div className="stream-grid landing-stream-grid">
            {streamConfig.slice(0, 3).map((stream) => (
              <button
                key={stream.id}
                className={`stream-card ${stream.theme}`}
                type="button"
                onClick={onViewAllSubjects}
              >
                <div className="stream-icon">{stream.icon}</div>
                <h3>{stream.title}</h3>
                <p className="stream-accent">{stream.subtitle}</p>
                <p>{stream.subjects.join(", ")}</p>

                <div className="tag-row">
                  {stream.subjects.map((subject) => (
                    <span className="tag" key={subject}>
                      {subject}
                    </span>
                  ))}
                </div>
              </button>
            ))}
          </div>

          <div className="center-cta">
            <button className="btn solid" onClick={onViewAllSubjects}>
              View All Subjects
            </button>
          </div>
        </section>

        <section className="cta">
          <div className="cta-content">
            <span className="section-kicker light">Start learning today</span>
            <h2>Start Your A/L Success Journey</h2>
            <p>Videos, notes, practice, AI support, and class discovery in one place.</p>
            <p className="cta-accent">අදම ඔබේ A/L ඉගෙනීම ආරම්භ කරන්න!</p>

            <div className="cta-actions">
              <button className="btn light-solid" onClick={onRegisterClick}>
                Register for Free
              </button>
              <button className="btn outline light" onClick={handleAboutClick}>
                Learn More
              </button>
            </div>
          </div>
        </section>

        <Footer
          onHomeClick={handleHomeClick}
          onSubjectsClick={handleSubjectsClick}
          onAboutClick={handleAboutClick}
          onLoginClick={onLoginClick}
          onRegisterClick={onRegisterClick}
        />
      </main>
    </div>
  );
}

export default LandingPage;

export function SubjectsPage({
  token,
  onBackHome,
  onLoginClick,
  onRegisterClick,
  onLogout,
  onAboutClick,
}) {
  const [selectedStream, setSelectedStream] = useState("biology");
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  const activeStreamData =
    streamConfig.find((stream) => stream.id === selectedStream) || streamConfig[0];

  const visibleSubjects = subjectConfig[selectedStream] || [];

  const closeRegisterModal = () => setShowRegisterModal(false);

  return (
    <div className="home subjects-page">
      <Topbar
        active="subjects"
        token={token}
        onHomeClick={onBackHome}
        onSubjectsClick={() => {}}
        onAboutClick={onAboutClick || onBackHome}
        onLoginClick={onLoginClick}
        onRegisterClick={onRegisterClick}
        onLogout={onLogout}
      />

      <main className="subjects-main">
        <section className="section subjects-hero-section">
          <div className="section-header">
            <span className="section-kicker">Choose your A/L stream</span>
            <h2>Subjects for Every Stream</h2>
            <p>
              Select your stream and explore organized A/L subjects with lessons,
              notes, past paper practice, and AI learning support.
            </p>
          </div>

          <div className="stream-grid subjects-stream-grid">
            {streamConfig.map((stream) => (
              <button
                key={stream.id}
                type="button"
                className={`stream-card ${stream.theme} stream-select ${
                  selectedStream === stream.id ? "selected" : ""
                }`}
                onClick={() => setSelectedStream(stream.id)}
              >
                <div className="stream-icon">{stream.icon}</div>
                <h3>{stream.title}</h3>
                <p className="stream-subtitle">{stream.subtitle}</p>
                <p className="stream-count">{stream.subjects.length} Subjects Available</p>
              </button>
            ))}
          </div>

          <section className="subject-panel">
            <div className="active-stream-header">
              <div className="active-stream-icon">{activeStreamData.icon}</div>
              <div>
                <span className="section-kicker">Selected stream</span>
                <h2>{activeStreamData.title}</h2>
                <p>{activeStreamData.subtitle}</p>
              </div>
            </div>

            <div className="subject-card-grid">
              {visibleSubjects.map((subject) => (
                <article className="subject-card" key={subject.name}>
                  <div className="subject-card-top">
                    <div className="subject-icon">{subject.icon}</div>
                    <span className="status-pill">Available</span>
                  </div>

                  <h4>{subject.name}</h4>
                  <p className="subject-subtitle">{subject.subtitle}</p>
                  <p className="subject-description">{subject.description}</p>

                  <button
                    className="view-lessons-btn"
                    type="button"
                    onClick={() => setShowRegisterModal(true)}
                  >
                    View Lessons
                  </button>
                </article>
              ))}
            </div>
          </section>
        </section>

        <Footer
          onHomeClick={onBackHome}
          onSubjectsClick={() => {}}
          onAboutClick={onAboutClick || onBackHome}
          onLoginClick={onLoginClick}
          onRegisterClick={onRegisterClick}
        />
      </main>

      {showRegisterModal && (
        <RegisterModal
          onClose={closeRegisterModal}
          onRegisterClick={() => {
            closeRegisterModal();
            onRegisterClick();
          }}
          onLoginClick={() => {
            closeRegisterModal();
            onLoginClick();
          }}
        />
      )}
    </div>
  );
}

export function AboutUs({
  onBackHome,
  onViewAllSubjects,
  token,
  onLoginClick,
  onRegisterClick,
  onLogout,
}) {
  return (
    <div className="home about-page">
      <Topbar
        active="about"
        token={token}
        onHomeClick={onBackHome}
        onSubjectsClick={onViewAllSubjects}
        onAboutClick={() => {}}
        onLoginClick={onLoginClick}
        onRegisterClick={onRegisterClick}
        onLogout={onLogout}
      />

      <main>
        <section className="section about-hero">
          <div className="about-hero-shell">
            <div className="about-hero-copy">
              <span className="section-kicker">About Learning Hub</span>

              <h1>
                A Calm Learning Space for <span>A/L Students</span>
              </h1>

              <p className="about-lead">
                Learning Hub is an AI-powered online learning platform designed for
                G.C.E. Advanced Level students in Sri Lanka. It helps students access
                lessons, notes, past paper practice, teacher class details, and AI study
                support in one simple place.
              </p>

              <p className="about-sinhala">
                Learning Hub මගින් සිසුන්ට පාඩම්, සටහන්, පසුගිය ප්‍රශ්න පත්‍ර,
                AI සහාය සහ පන්ති විස්තර එකම තැනකින් ලබාගත හැක.
              </p>

              <div className="about-actions">
                <button className="btn solid" onClick={onRegisterClick}>
                  Start Learning
                </button>
                <button className="btn outline" onClick={onViewAllSubjects}>
                  Explore Subjects
                </button>
              </div>
            </div>

            <div className="about-hero-panel">
              <div className="about-panel-card">
                <span className="section-kicker">What students get</span>

                <div className="about-highlight-list">
                  <div>
                    <span>📚</span>
                    <p>Organized stream-based lessons</p>
                  </div>
                  <div>
                    <span>📝</span>
                    <p>Past paper practice and feedback</p>
                  </div>
                  <div>
                    <span>🤖</span>
                    <p>AI support for lesson questions</p>
                  </div>
                  <div>
                    <span>📊</span>
                    <p>Progress tracking for exam preparation</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="about-card-grid">
            <div className="about-value-card">
              <div className="about-card-icon">🎯</div>
              <h3>Our Purpose</h3>
              <p>
                To make A/L learning easier, organized, and accessible for students
                across Sri Lanka.
              </p>
              <p className="about-card-sinhala">A/L ඉගෙනීම පහසු සහ සංවිධානාත්මක කිරීම.</p>
            </div>

            <div className="about-value-card">
              <div className="about-card-icon">💡</div>
              <h3>Our Mission</h3>
              <p>
                To combine modern web technology and AI support with syllabus-focused
                learning materials.
              </p>
              <p className="about-card-sinhala">නව තාක්ෂණය සහ AI සහාය අධ්‍යාපනයට එක් කිරීම.</p>
            </div>

            <div className="about-value-card">
              <div className="about-card-icon">🌱</div>
              <h3>Our Promise</h3>
              <p>
                To provide a calm, student-friendly learning experience that supports
                confidence and exam success.
              </p>
              <p className="about-card-sinhala">සිසුන්ට විශ්වාසයෙන් ඉගෙනීමට සහාය වීම.</p>
            </div>
          </div>
        </section>

        <section className="cta about-bottom-cta">
          <div className="cta-content">
            <span className="section-kicker light">Ready to learn?</span>
            <h2>Start Your A/L Learning Journey</h2>
            <p>Join Learning Hub and continue your studies with lessons, notes, practice, and AI support.</p>
            <p className="cta-accent">අදම ඔබේ A/L ඉගෙනීම ආරම්භ කරන්න!</p>

            <div className="cta-actions">
              <button className="btn light-solid" onClick={onRegisterClick}>
                Register for Free
              </button>
              <button className="btn outline light" onClick={onViewAllSubjects}>
                View Subjects
              </button>
            </div>
          </div>
        </section>

        <Footer
          onHomeClick={onBackHome}
          onSubjectsClick={onViewAllSubjects}
          onAboutClick={() => {}}
          onLoginClick={onLoginClick}
          onRegisterClick={onRegisterClick}
        />
      </main>
    </div>
  );
}