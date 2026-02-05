function Home() {
  return (
    <div className="home">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">AL</span>
          <span className="brand-name">AL Learning</span>
        </div>

        <nav className="nav">
          <a href="#home">Home</a>
          <a href="#subjects">Subjects</a>
          <a href="#about">About Us</a>
        </nav>

        <div className="nav-actions">
          <button className="btn ghost">Login</button>
          <button className="btn solid">Register</button>
        </div>
      </header>

      <main>
        <section id="home" className="hero">
          <div className="hero-left">
            <span className="pill">AI-Powered Learning Platform</span>
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
              <button className="btn solid">Get Started Now</button>
              <button className="btn outline">Try AI Chatbot</button>
            </div>
            <div className="stats">
              <div>
                <strong>5000+</strong>
                <span>Students</span>
              </div>
              <div>
                <strong>500+</strong>
                <span>Past Papers</span>
              </div>
              <div>
                <strong>95%</strong>
                <span>Success Rate</span>
              </div>
            </div>
          </div>

          <div className="hero-right">
            <div className="image-card">
              <img
                src="https://images.unsplash.com/photo-1588072432836-80acdfdcd39f?q=80&w=1200&auto=format&fit=crop"
                alt="Students learning"
              />
            </div>
          </div>
        </section>

        <section id="subjects" className="section">
          <h2>Subjects</h2>
          <p>Explore subject streams and study materials tailored for you.</p>
          <div className="cards">
            <div className="card">Science</div>
            <div className="card">Commerce</div>
            <div className="card">Arts</div>
            <div className="card">Technology</div>
          </div>
        </section>

        <section id="about" className="section">
          <h2>About Us</h2>
          <p>
            We help AL students learn faster with smart practice, AI help, and
            a simple study path.
          </p>
        </section>
      </main>
    </div>
  );
}

export default Home;
