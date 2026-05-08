import { useEffect, useMemo, useState } from "react";
import {
  getApprovedClassPosts,
  getFeaturedSubjects,
  getLandingSummary,
} from "../../api";
import "./LandingPage.css";

const defaultSummary = {
  streamCount: 3,
  subjectCount: 12,
  lessonCount: 0,
  approvedClassPostCount: 0,
};

const staticStreams = [
  {
    tone: "science",
    icon: "Bio",
    title: "Biology Stream",
    sinhala: "ජීව විද්‍යා ධාරාව",
    subjects: ["Biology", "Chemistry", "Physics"],
  },
  {
    tone: "maths",
    icon: "Math",
    title: "Mathematics Stream",
    sinhala: "ගණිත ධාරාව",
    subjects: ["Combined Maths", "Physics", "Chemistry"],
  },
  {
    tone: "commerce",
    icon: "Com",
    title: "Commerce Stream",
    sinhala: "වාණිජ ධාරාව",
    subjects: ["Accounting", "Business", "Economics"],
  },
];

const features = [
  {
    icon: "Play",
    title: "Video lessons",
    sinhala: "පාඩම් වීඩියෝ",
    text: "Syllabus-aligned lessons help students revise topics without jumping between many links.",
  },
  {
    icon: "Note",
    title: "Notes and resources",
    sinhala: "සටහන් සහ පාඩම් ද්‍රව්‍ය",
    text: "Keep theory notes, short explanations, and lesson materials together for faster revision.",
  },
  {
    icon: "Past",
    title: "Past paper practice",
    sinhala: "පසුගිය ප්‍රශ්න පත්‍ර",
    text: "Practice exam-style questions by lesson so revision feels closer to the real A/L paper.",
  },
  {
    icon: "MCQ",
    title: "MCQ practice",
    sinhala: "MCQ පුහුණුව",
    text: "Check answers quickly and understand weak areas before the final exam pressure builds.",
  },
  {
    icon: "AI",
    title: "AI marking support",
    sinhala: "AI ලකුණු දීමේ සහාය",
    text: "Structured answers can receive guided feedback so students know how to improve.",
  },
  {
    icon: "Chat",
    title: "AI chatbot",
    sinhala: "AI ප්‍රශ්න සහ පිළිතුරු",
    text: "Ask lesson-related questions when a concept is unclear and get instant study support.",
  },
  {
    icon: "Track",
    title: "Progress tracking",
    sinhala: "ප්‍රගතිය නිරීක්ෂණය",
    text: "Follow learning progress across subjects, lessons, and practice attempts.",
  },
  {
    icon: "Class",
    title: "Teacher class discovery",
    sinhala: "ගුරු පන්ති සෙවීම",
    text: "Find approved online and physical classes published by Sri Lankan A/L teachers.",
  },
];

const helpCards = [
  {
    title: "Stop scattered searching",
    sinhala: "YouTube, Telegram, Zoom link අතර සෙවීම අඩු කරයි",
    text: "Learning Hub keeps lessons, notes, past papers, practice, and class details in one focused A/L space.",
  },
  {
    title: "Study by syllabus area",
    sinhala: "විෂය නිර්දේශයට ගැළපෙන ඉගෙනීම",
    text: "Students can move from stream to subject to lesson without losing time on unrelated content.",
  },
  {
    title: "Get faster feedback",
    sinhala: "පිළිතුරු ගැන ඉක්මන් ප්‍රතිචාර",
    text: "MCQ and structured-answer tools help students identify mistakes while the lesson is still fresh.",
  },
];

const journeySteps = [
  ["01", "Choose your A/L stream", "Bio, Maths, Commerce වගේ ඔබේ ධාරාව තෝරන්න."],
  ["02", "Learn the lesson", "Video lessons සහ notes එක්ක theory revise කරන්න."],
  ["03", "Practice exam questions", "MCQ සහ past paper questions වලින් ලකුණු වැඩි කරගන්න."],
  ["04", "Ask AI and improve", "නොතේරෙන තැන AI chatbot එකෙන් අහලා නැවත practice කරන්න."],
];

const formatCount = (value, suffix = "+") => {
  const number = Number(value || 0);
  if (number === 0) return "0";
  return `${number}${suffix}`;
};

function Home({
  token,
  onBackHome,
  onLoginClick,
  onRegisterClick,
  onViewAllSubjects,
  onAboutClick,
  onLogout,
}) {
  const [activeNav, setActiveNav] = useState("home");
  const [summary, setSummary] = useState(defaultSummary);
  const [featuredSubjects, setFeaturedSubjects] = useState([]);
  const [classPosts, setClassPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dataError, setDataError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadLandingData() {
      setLoading(true);
      setDataError("");

      const [summaryResult, subjectsResult, postsResult] = await Promise.all([
        getLandingSummary(),
        getFeaturedSubjects(6),
        getApprovedClassPosts(3),
      ]);

      if (!isMounted) return;

      if (summaryResult.success) setSummary({ ...defaultSummary, ...summaryResult.summary });
      if (subjectsResult.success) setFeaturedSubjects(subjectsResult.subjects || []);
      if (postsResult.success) setClassPosts(postsResult.posts || []);

      const failed = [summaryResult, subjectsResult, postsResult].some((item) => !item.success);
      if (failed) {
        setDataError("Live data is temporarily unavailable. Showing the landing page with available content.");
      }

      setLoading(false);
    }

    loadLandingData();

    return () => {
      isMounted = false;
    };
  }, []);

  const stats = useMemo(
    () => [
      { value: formatCount(summary.streamCount), label: "A/L streams" },
      { value: formatCount(summary.subjectCount), label: "Subjects" },
      { value: formatCount(summary.lessonCount), label: "Lessons" },
      { value: formatCount(summary.approvedClassPostCount), label: "Approved classes" },
    ],
    [summary]
  );

  const handleHomeClick = () => {
    setActiveNav("home");
    onBackHome();
  };

  const handleSubjectsClick = () => {
    setActiveNav("subjects");
    onViewAllSubjects();
  };

  const handleAboutClick = () => {
    setActiveNav("about");
    onAboutClick();
  };

  return (
    <div className="home">
      <header className="topbar">
        <button type="button" className="brand brand-button" onClick={handleHomeClick}>
          <span className="brand-mark brand-logo-shell">
            <img src="/logo1.png" alt="Learning Hub logo" className="brand-logo-image" />
          </span>
          <span className="brand-name">Learning Hub</span>
        </button>

        <nav className="nav" aria-label="Landing page navigation">
          <button type="button" className={activeNav === "home" ? "active" : ""} onClick={handleHomeClick}>
            Home
          </button>
          <button type="button" className={activeNav === "subjects" ? "active" : ""} onClick={handleSubjectsClick}>
            Subjects
          </button>
          <button type="button" className={activeNav === "about" ? "active" : ""} onClick={handleAboutClick}>
            About Us
          </button>
        </nav>

        <div className="nav-actions">
          {token ? (
            <button type="button" className="btn outline" onClick={onLogout}>
              Logout
            </button>
          ) : (
            <>
              <button type="button" className="btn ghost" onClick={onLoginClick}>
                Login
              </button>
              <button type="button" className="btn solid" onClick={onRegisterClick}>
                Register
              </button>
            </>
          )}
        </div>
      </header>

      <main>
        <section id="home" className="hero">
          <div className="hero-copy">
            <span className="pill">Sri Lankan G.C.E. Advanced Level platform</span>
            <h1>
              උසස් පෙළ ඉගෙනීම <span>එකම තැනකින්</span>
            </h1>
            <p className="hero-lead">
              Learning Hub brings A/L lessons, notes, past papers, MCQ practice, AI support,
              progress tracking, and approved teacher classes into one student-friendly space.
            </p>
            <p className="sinhala-line">
              පාඩම්, සටහන්, පසුගිය ප්‍රශ්න පත්‍ර සහ AI සහාය සමඟ ඔබේ A/L සාර්ථකත්වය අදම ආරම්භ කරන්න.
            </p>
            <div className="hero-actions">
              <button type="button" className="btn solid" onClick={onRegisterClick}>
                Start Learning Free
              </button>
              <button type="button" className="btn outline" onClick={onLoginClick}>
                Try AI Support
              </button>
            </div>
            <div className="stats" aria-label="Learning Hub platform statistics">
              {stats.map((item) => (
                <div className="stat-item" key={item.label}>
                  <strong>{item.value}</strong>
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          <aside className="hero-panel" aria-label="Learning Hub preview">
            <div className="exam-card glass-card">
              <div>
                <span className="mini-label">A/L Study Plan</span>
                <h2>Today&apos;s focus</h2>
              </div>
              <div className="focus-list">
                <span>Physics: Mechanics revision</span>
                <span>Chemistry: Organic MCQs</span>
                <span>Accounting: Past paper essay</span>
              </div>
              <div className="progress-strip">
                <span style={{ width: "72%" }} />
              </div>
            </div>
            <div className="ai-preview glass-card">
              <span className="mini-label">AI Assistant</span>
              <p>“Why does this MCQ answer become option B?”</p>
              <div className="ai-answer">
                Let&apos;s compare the formula, units, and final substitution step by step.
              </div>
            </div>
          </aside>
        </section>

        <section className="section problem-band">
          <div className="split-section">
            <div>
              <span className="eyebrow">Built for Sri Lankan A/L students</span>
              <h2>A/L resources are everywhere. Your revision should not feel scattered.</h2>
            </div>
            <div className="problem-list">
              <p>YouTube videos, Telegram files, Zoom class links, and social posts can be hard to organize.</p>
              <p>Learning Hub helps students stay close to the syllabus and move from learning to practice faster.</p>
            </div>
          </div>
        </section>

        <section className="section key-features">
          <div className="section-header">
            <span className="eyebrow">Features</span>
            <h2>Everything needed for focused A/L revision</h2>
            <p>Clear learning paths, exam practice, AI feedback, and teacher class discovery in one place.</p>
          </div>
          <div className="feature-grid">
            {features.map((feature, index) => (
              <article className="feature-card" key={feature.title}>
                <div className="feature-icon">{feature.icon}</div>
                <h3>{feature.title}</h3>
                <p className="feature-sinhala">{feature.sinhala}</p>
                <p>{feature.text}</p>
                <span className="feature-number">{String(index + 1).padStart(2, "0")}</span>
              </article>
            ))}
          </div>
        </section>

        <section className="section help-section">
          <div className="section-header">
            <span className="eyebrow">How it helps</span>
            <h2>How Learning Hub helps A/L students</h2>
            <p>Designed around the real study problems students face before exams.</p>
          </div>
          <div className="help-grid">
            {helpCards.map((card) => (
              <article className="help-card" key={card.title}>
                <h3>{card.title}</h3>
                <p className="feature-sinhala">{card.sinhala}</p>
                <p>{card.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="subjects" className="section streams">
          <div className="section-header">
            <span className="eyebrow">Streams and subjects</span>
            <h2>Choose your A/L path</h2>
            <p>Start from your stream, select the subject, then continue into lessons and practice.</p>
          </div>

          <div className="stream-grid">
            {staticStreams.map((stream) => (
              <article className={`stream-card ${stream.tone}`} key={stream.title}>
                <div className="stream-icon">{stream.icon}</div>
                <h3>{stream.title}</h3>
                <p className="stream-accent">{stream.sinhala}</p>
                <div className="tag-row">
                  {stream.subjects.map((subject) => (
                    <span className="tag" key={subject}>
                      {subject}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>

          <div className="center-cta">
            <button type="button" className="btn solid" onClick={onViewAllSubjects}>
              View All Subjects
            </button>
          </div>
        </section>

        <section className="section live-data-section">
          <div className="section-header">
            <span className="eyebrow">Live from the platform</span>
            <h2>Featured subjects</h2>
            <p>Recently added subjects from the Learning Hub backend.</p>
          </div>
          {dataError && <p className="data-note">{dataError}</p>}
          {loading ? (
            <div className="skeleton-grid">
              {[1, 2, 3].map((item) => (
                <div className="skeleton-card" key={item} />
              ))}
            </div>
          ) : featuredSubjects.length > 0 ? (
            <div className="subject-grid">
              {featuredSubjects.map((subject) => (
                <article className="subject-card" key={subject._id || subject.name}>
                  <span>{subject.stream?.name || "A/L Subject"}</span>
                  <h3>{subject.name}</h3>
                  <p>Lesson videos, notes, MCQ practice, and past paper support available after login.</p>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              Featured subjects are not available yet. Admins can add subjects from the admin panel.
            </div>
          )}
        </section>

        <section className="section teacher-classes">
          <div className="section-header">
            <span className="eyebrow">Approved teacher classes</span>
            <h2>Discover trusted A/L classes</h2>
            <p>Only approved teacher posts are shown publicly to students.</p>
          </div>
          {loading ? (
            <div className="skeleton-grid">
              {[1, 2, 3].map((item) => (
                <div className="skeleton-card" key={item} />
              ))}
            </div>
          ) : classPosts.length > 0 ? (
            <div className="class-grid">
              {classPosts.map((post) => (
                <article className="class-card" key={post._id}>
                  <div>
                    <span className="class-subject">{post.subject}</span>
                    <h3>{post.title}</h3>
                    <p>{post.description}</p>
                  </div>
                  <dl>
                    <div>
                      <dt>Teacher</dt>
                      <dd>{post.teacher?.name || "Approved teacher"}</dd>
                    </div>
                    <div>
                      <dt>Location</dt>
                      <dd>{post.location}</dd>
                    </div>
                    <div>
                      <dt>Schedule</dt>
                      <dd>{post.schedule}</dd>
                    </div>
                  </dl>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              Approved class posts are not available yet. Teachers can publish class details after approval.
            </div>
          )}
        </section>

        <section className="section journey-section">
          <div className="section-header">
            <span className="eyebrow">Student journey</span>
            <h2>From first lesson to exam confidence</h2>
          </div>
          <div className="journey-grid">
            {journeySteps.map(([number, title, text]) => (
              <article className="journey-card" key={number}>
                <span>{number}</span>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="section teacher-support">
          <div className="teacher-support-card">
            <div className="teacher-support-icon">Teacher</div>
            <div>
              <span className="eyebrow">For teachers</span>
              <h2>Publish class details where A/L students already learn</h2>
              <p>
                Teachers can share online and physical class details, while admins keep public posts approved and organized.
              </p>
              <p className="teacher-support-accent">
                ලංකාව පුරා ඇති A/L පන්ති තොරතුරු සිසුන්ට පහසුවෙන් සොයාගන්න පුළුවන්.
              </p>
            </div>
          </div>
        </section>

        <section className="cta">
          <div className="cta-content">
            <span className="eyebrow light">Start today</span>
            <h2>ඔබේ A/L සාර්ථකත්වය අදම ආරම්භ කරන්න</h2>
            <p>Learn with videos, notes, past papers, AI support, progress tracking, and class discovery.</p>
            <div className="cta-actions">
              <button type="button" className="btn solid light-solid" onClick={onRegisterClick}>
                Register for Free
              </button>
              <button type="button" className="btn outline light" onClick={onAboutClick}>
                Learn More
              </button>
            </div>
          </div>
        </section>

        <footer className="site-footer">
          <div className="footer-grid">
            <div>
              <div className="brand footer-brand">
                <span className="brand-mark brand-logo-shell">
                  <img src="/logo1.png" alt="Learning Hub logo" className="brand-logo-image" />
                </span>
                <span className="brand-name">Learning Hub</span>
              </div>
              <p>AI-powered learning platform for Sri Lankan G.C.E. Advanced Level students.</p>
              <p className="footer-accent">උසස් පෙළ ඉගෙනීම එකම තැනකින්</p>
            </div>
            <div>
              <h4>Learn</h4>
              <ul>
                <li>Video lessons</li>
                <li>Notes</li>
                <li>Past papers</li>
                <li>MCQ practice</li>
              </ul>
            </div>
            <div>
              <h4>Platform</h4>
              <ul>
                <li>AI chatbot</li>
                <li>Progress tracking</li>
                <li>Teacher classes</li>
                <li>Admin approval</li>
              </ul>
            </div>
            <div>
              <h4>Contact</h4>
              <ul>
                <li>info@learninghub.lk</li>
                <li>+94 11 234 5678</li>
              </ul>
            </div>
          </div>
          <div className="footer-divider" />
          <p className="footer-copy">© 2026 Learning Hub. All rights reserved.</p>
        </footer>
      </main>
    </div>
  );
}

export default Home;
