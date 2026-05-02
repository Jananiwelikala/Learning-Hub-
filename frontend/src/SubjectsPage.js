import { useState } from "react";

function SubjectsPage({
  token,
  onBackHome,
  onLoginClick,
  onRegisterClick,
  onLogout,
}) {
  const [selectedStream, setSelectedStream] = useState("");
  const streamConfig = [
    {
      id: "biology",
      theme: "green",
      icon: "\u2697",
      title: "Biology Stream",
      subtitle: "\u0da2\u0dd3\u0dc0 \u0dc0\u0dd2\u0daf\u0dca\u0dba\u0dcf \u0db0\u0dcf\u0dbb\u0dcf\u0dc0",
      subjectCount: 3,
    },
    {
      id: "maths",
      theme: "blue",
      icon: "\u229e",
      title: "Mathematics Stream",
      subtitle:
        "\u0d9c\u0dab\u0dd2\u0dad \u0dc0\u0dd2\u0daf\u0dca\u0dba\u0dcf \u0db0\u0dcf\u0dbb\u0dcf\u0dc0",
      subjectCount: 3,
    },
    {
      id: "commerce",
      theme: "orange",
      icon: "\u20ac",
      title: "Commerce Stream",
      subtitle: "\u0dc0\u0dcf\u0dab\u0dd2\u0da2 \u0db0\u0dcf\u0dbb\u0dcf\u0dc0",
      subjectCount: 3,
    },
    {
      id: "arts",
      theme: "purple",
      icon: "\u2630",
      title: "Arts Stream",
      subtitle: "\u0d9a\u0dbd\u0dcf \u0db0\u0dcf\u0dbb\u0dcf\u0dc0",
      subjectCount: 3,
    },
  ];

  const subjectConfig = {
    biology: [
      {
        name: "Biology",
        subtitle: "\u0da2\u0dd3\u0dc0 \u0dc0\u0dd2\u0daf\u0dca\u0dba\u0dcf\u0dc0",
        icon: "\u2689",
        papers: 45,
        students: 1200,
      },
      {
        name: "Chemistry",
        subtitle: "\u0dbb\u0dc3\u0dcf\u0dba\u0db1 \u0dc0\u0dd2\u0daf\u0dca\u0dba\u0dcf\u0dc0",
        icon: "\u2697",
        papers: 42,
        students: 1150,
      },
      {
        name: "Physics",
        subtitle: "\u0db7\u0ddd\u0dad\u0dd2\u0d9a \u0dc0\u0dd2\u0daf\u0dca\u0dba\u0dcf\u0dc0",
        icon: "\u2b21",
        papers: 40,
        students: 1100,
      },
    ],
    maths: [
      {
        name: "Combined Maths",
        subtitle:
          "\u0dc3\u0dae\u0db1\u0dca\u0db1\u0dd2\u0daf\u0dca\u0db0 \u0d9c\u0dab\u0dd2\u0dad\u0dba",
        icon: "\u229e",
        papers: 44,
        students: 1180,
      },
      {
        name: "Physics",
        subtitle: "\u0db7\u0ddd\u0dad\u0dd2\u0d9a \u0dc0\u0dd2\u0daf\u0dca\u0dba\u0dcf\u0dc0",
        icon: "\u2b21",
        papers: 41,
        students: 1090,
      },
      {
        name: "Chemistry",
        subtitle: "\u0dbb\u0dc3\u0dcf\u0dba\u0db1 \u0dc0\u0dd2\u0daf\u0dca\u0dba\u0dcf\u0dc0",
        icon: "\u2697",
        papers: 39,
        students: 1025,
      },
    ],
    commerce: [
      {
        name: "Accounting",
        subtitle: "\u0d9c\u0dd2\u0dab\u0dd4\u0db8\u0dca\u0d9a\u0dbb\u0dab\u0dba",
        icon: "\u20ac",
        papers: 38,
        students: 980,
      },
      {
        name: "Business Studies",
        subtitle: "\u0dc0\u0dca\u0dba\u0dcf\u0db4\u0dcf\u0dbb \u0d85\u0db0\u0dca\u0dba\u0dba\u0db1\u0dba",
        icon: "\u229f",
        papers: 36,
        students: 930,
      },
      {
        name: "Economics",
        subtitle: "\u0d85\u0dbb\u0dca\u0dae\u0dc1\u0dcf\u0dc3\u0dca\u0dad\u0dca\u0dbb\u0dba",
        icon: "\u21c4",
        papers: 35,
        students: 890,
      },
    ],
    arts: [
      {
        name: "Political Science",
        subtitle:
          "\u0daf\u0dda\u0dc1\u0db4\u0dcf\u0dbd\u0db1 \u0dc0\u0dd2\u0daf\u0dca\u0dba\u0dcf\u0dc0",
        icon: "\u2696",
        papers: 33,
        students: 820,
      },
      {
        name: "Geography",
        subtitle: "\u0db7\u0dd6\u0d9c\u0ddd\u0dbd \u0dc0\u0dd2\u0daf\u0dca\u0dba\u0dcf\u0dc0",
        icon: "\u25ce",
        papers: 34,
        students: 860,
      },
      {
        name: "Logic",
        subtitle: "\u0dad\u0dbb\u0dca\u0d9a \u0dc0\u0dd2\u0daf\u0dca\u0dba\u0dcf\u0dc0",
        icon: "\u2630",
        papers: 31,
        students: 780,
      },
    ],
  };

  const activeStream = selectedStream || "biology";
  const activeStreamData =
    streamConfig.find((stream) => stream.id === activeStream) || streamConfig[0];
  const visibleSubjects = subjectConfig[activeStream] || [];

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
        <section id="subjects-page-streams" className="section streams">
          <div className="stream-grid">
            {streamConfig.map((stream) => (
              <button
                key={stream.id}
                type="button"
                className={`stream-card ${stream.theme} stream-select ${
                  activeStream === stream.id ? "selected" : ""
                }`}
                onClick={() => setSelectedStream(stream.id)}
              >
                <div className={`stream-icon ${stream.theme}`}>{stream.icon}</div>
                <h3>{stream.title}</h3>
                <p className="stream-subtitle">{stream.subtitle}</p>
                <p className="stream-count">
                  <span className="count-icon">{"\u25eb"}</span>{" "}
                  {stream.subjectCount} Subjects
                </p>
              </button>
            ))}
          </div>

          <section className="subject-panel">
            <div className="active-stream-header">
              <div className={`stream-icon large ${activeStreamData.theme}`}>
                {activeStreamData.icon}
              </div>
              <div>
                <h2>{activeStreamData.title}</h2>
                <p className="stream-subtitle">{activeStreamData.subtitle}</p>
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
                  <p className="subject-meta">
                    <span>
                      {"\u25eb"} {subject.papers} Papers
                    </span>
                    <span>
                      {"\u263a"} {subject.students} Students
                    </span>
                  </p>
                  <button className="view-lessons-btn" type="button">
                    View Lessons
                  </button>
                </article>
              ))}
            </div>
          </section>
        </section>
      </main>
    </div>
  );
}

export default SubjectsPage;
