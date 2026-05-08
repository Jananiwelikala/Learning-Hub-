function AboutUs({
  onBackHome,
  onViewAllSubjects,
  token,
  onLoginClick,
  onRegisterClick,
  onLogout
}) {
  return (
    <div className="home">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark brand-logo-shell">
            <img src="/logo1.png" alt="Learning Hub logo" className="brand-logo-image" />
          </span>
          <span className="brand-name">Learning Hub</span>
        </div>

        <nav className="nav">
          <button
            type="button"
            onClick={() => onBackHome()}
          >
            Home
          </button>

          <button
            type="button"
            onClick={() => onViewAllSubjects()}
          >
            Subjects
          </button>

          <button
            type="button"
            className="active"
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

      <main>
        <section className="section about-hero">
          <div className="about-hero-shell">
            <div className="about-hero-copy">
              <span className="pill about-pill">Student-first learning experience</span>

              <div className="section-header about-header">
                <h2>About Learning Hub</h2>
                <p>Your all-in-one AL learning partner designed for smarter exam success.</p>
              </div>

              <p className="about-lead">
                Learning Hub is built for GCE Advanced Level students in Sri Lanka who want a
                modern, AI-supported learning experience. We combine lessons, notes, past papers
                and interactive tools into a single user-friendly platform.
              </p>
            </div>

            <div className="about-hero-panel">
              <div className="about-panel-card">
                <p className="about-panel-eyebrow">What students can expect</p>
                <ul className="about-highlight-list">
                  <li>Clear course structure with stream-based subject paths</li>
                  <li>Rich video lessons, summaries, and practice questions</li>
                  <li>AI tutor to answer doubts instantly</li>
                  <li>Track progress and identify improvement areas</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="about-feature-pills" aria-label="Learning Hub highlights">
            <span className="about-feature-pill">Clear course structure with stream-based subject paths</span>
            <span className="about-feature-pill">Rich video lessons, summaries, and practice questions</span>
            <span className="about-feature-pill">AI tutor to answer doubts instantly</span>
            <span className="about-feature-pill">Track progress and identify improvement areas</span>
          </div>

          <div className="feature-grid about-card-grid">
            <div className="feature-card blue about-value-card">
              <span className="about-card-icon" aria-hidden="true">WW</span>
              <h3>Who We Are</h3>
              <p>
                A focused education startup that adapts local AL needs into a structured,
                visually friendly study experience.
              </p>
            </div>

            <div className="feature-card green about-value-card">
              <span className="about-card-icon" aria-hidden="true">OM</span>
              <h3>Our Mission</h3>
              <p>
                To bring better equality of opportunity through free or low-cost tools
                that empower students across Sri Lanka.
              </p>
            </div>

            <div className="feature-card purple about-value-card">
              <span className="about-card-icon" aria-hidden="true">OP</span>
              <h3>Our Promise</h3>
              <p>
                Easy navigation, quick sign-up, fast access to lessons, and progress
                insights that keep students motivated.
              </p>
            </div>
          </div>

          <div className="about-cta-wrap">
            <div className="center-cta">
              <button className="btn solid about-cta-button" onClick={onRegisterClick}>
                Create Account and Start Learning
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default AboutUs;
