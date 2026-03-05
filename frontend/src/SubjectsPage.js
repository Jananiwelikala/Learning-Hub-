import { useState } from "react";

function SubjectsPage({
  token,
  onBackHome,
  onLoginClick,
  onRegisterClick,
  onLogout,
}) {
  const [selectedStream, setSelectedStream] = useState("");

  return (
    <div className="home subjects-page">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">AL</span>
          <span className="brand-name">Learning Hub</span>
        </div>

        <nav className="nav">
          <a
            href="#home"
            onClick={(event) => {
              event.preventDefault();
              onBackHome();
            }}
          >
            Home
          </a>
          <a href="#subjects-page-streams" className="active">
            Subjects
          </a>
          <a
            href="#about"
            onClick={(event) => {
              event.preventDefault();
              onBackHome();
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

      <main className="subjects-main">
        <section className="subjects-hero">
          <h1>Streams &amp; Subjects</h1>
          <p>Click a stream card to view subjects.</p>
        </section>

        <section id="subjects-page-streams" className="section streams">
          <div className="stream-grid">
            <button
              type="button"
              className={`stream-card green stream-select ${
                selectedStream === "biology" ? "selected" : ""
              }`}
              onClick={() => setSelectedStream("biology")}
            >
              <div className="stream-icon">BIO</div>
              <h3>Biology Stream</h3>
              <p className="stream-accent green-text">Biology line</p>
              <p>Biology, Chemistry, Physics</p>
              <div className="tag-row green-text">
                <span className="tag">Biology</span>
                <span className="tag">Chemistry</span>
                <span className="tag">Physics</span>
              </div>
            </button>

            <button
              type="button"
              className={`stream-card blue stream-select ${
                selectedStream === "maths" ? "selected" : ""
              }`}
              onClick={() => setSelectedStream("maths")}
            >
              <div className="stream-icon">MTH</div>
              <h3>Mathematics Stream</h3>
              <p className="stream-accent blue-text">Mathematics line</p>
              <p>Combined Maths, Physics, Chemistry</p>
              <div className="tag-row blue-text">
                <span className="tag">Combined Maths</span>
                <span className="tag">Physics</span>
                <span className="tag">Chemistry</span>
              </div>
            </button>

            <button
              type="button"
              className={`stream-card orange stream-select ${
                selectedStream === "commerce" ? "selected" : ""
              }`}
              onClick={() => setSelectedStream("commerce")}
            >
              <div className="stream-icon">COM</div>
              <h3>Commerce Stream</h3>
              <p className="stream-accent orange-text">Commerce line</p>
              <p>Accounting, Business Studies, Economics</p>
              <div className="tag-row orange-text">
                <span className="tag">Accounting</span>
                <span className="tag">Business</span>
                <span className="tag">Economics</span>
              </div>
            </button>
          </div>

          {selectedStream === "biology" ? (
            <section className="subject-panel">
              <h2>Biology Stream Subjects</h2>
              <p>Choose a subject to continue learning.</p>
              <div className="subject-card-grid">
                <article className="subject-card">
                  <div className="subject-icon">BIO</div>
                  <h4>Biology</h4>
                  <p>Cell biology, genetics, ecology and exam practice.</p>
                </article>
                <article className="subject-card">
                  <div className="subject-icon">PHY</div>
                  <h4>Physics</h4>
                  <p>Mechanics, electricity and modern physics support.</p>
                </article>
                <article className="subject-card">
                  <div className="subject-icon">CHE</div>
                  <h4>Chemistry</h4>
                  <p>Organic, inorganic and physical chemistry lessons.</p>
                </article>
              </div>
            </section>
          ) : selectedStream ? (
            <section className="subject-panel">
              <h2>Subjects Coming Soon</h2>
              <p>
                Friendly note: subject cards are currently implemented for the
                Biology stream first.
              </p>
            </section>
          ) : (
            <section className="subject-panel">
              <h2>Select a Stream</h2>
              <p>Click any stream card above to view its subjects.</p>
            </section>
          )}
        </section>
      </main>
    </div>
  );
}

export default SubjectsPage;
