import { useEffect, useMemo, useState } from "react";
import {
  getLessonDetails,
  getLessons,
  getMcqs,
  getStreams,
  getSubjectsByStream,
  submitMcqs,
} from "./api";

function StudentDashboard({ onLogout, onBackHome }) {
  const [streams, setStreams] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [selectedStreamId, setSelectedStreamId] = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [selectedLessonId, setSelectedLessonId] = useState("");
  const [lessonDetails, setLessonDetails] = useState(null);
  const [mcqs, setMcqs] = useState([]);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadStreams() {
      const data = await getStreams();
      if (!Array.isArray(data)) {
        setMessage("Failed to load streams");
        return;
      }

      setStreams(data);
      const preferred = data.find((item) => item.name === "Biology Stream");
      setSelectedStreamId((preferred || data[0] || {})._id || "");
    }

    loadStreams();
  }, []);

  useEffect(() => {
    if (!selectedStreamId) {
      setSubjects([]);
      setSelectedSubjectId("");
      return;
    }

    async function loadSubjects() {
      const data = await getSubjectsByStream(selectedStreamId);
      if (!Array.isArray(data)) {
        setMessage("Failed to load subjects");
        return;
      }

      setSubjects(data);
      const preferred = data.find((item) => item.name === "Physics");
      setSelectedSubjectId((preferred || data[0] || {})._id || "");
    }

    loadSubjects();
  }, [selectedStreamId]);

  useEffect(() => {
    if (!selectedSubjectId) {
      setLessons([]);
      setSelectedLessonId("");
      return;
    }

    async function loadLessons() {
      const data = await getLessons(selectedSubjectId);
      if (!Array.isArray(data)) {
        setMessage("Failed to load lessons");
        return;
      }

      setLessons(data);
      const preferred = data.find((item) => item.title === "Measurements");
      setSelectedLessonId((preferred || data[0] || {})._id || "");
    }

    loadLessons();
  }, [selectedSubjectId]);

  useEffect(() => {
    if (!selectedLessonId) {
      setLessonDetails(null);
      setMcqs([]);
      return;
    }

    async function loadLessonBundle() {
      const [detailsData, mcqData] = await Promise.all([
        getLessonDetails(selectedLessonId),
        getMcqs(selectedLessonId),
      ]);

      if (detailsData && !detailsData.message) {
        setLessonDetails(detailsData);
      } else {
        setLessonDetails(null);
        setMessage(detailsData.message || "Failed to load lesson");
      }

      if (Array.isArray(mcqData)) {
        setMcqs(mcqData);
      } else {
        setMcqs([]);
        setMessage(mcqData.message || "Failed to load MCQs");
      }

      setAnswers({});
      setResult(null);
    }

    loadLessonBundle();
  }, [selectedLessonId]);

  const answeredCount = useMemo(
    () => Object.keys(answers).length,
    [answers]
  );

  function selectAnswer(mcqId, selectedOptionIndex) {
    setAnswers((prev) => ({ ...prev, [mcqId]: selectedOptionIndex }));
  }

  async function handleSubmit() {
    if (!selectedLessonId) return;

    const payload = {
      lessonId: selectedLessonId,
      answers: Object.entries(answers).map(([mcqId, selectedOptionIndex]) => ({
        mcqId,
        selectedOptionIndex,
      })),
    };

    const data = await submitMcqs(payload);
    if (data && typeof data.scorePercent === "number") {
      setResult(data);
    } else {
      setMessage(data.message || "Failed to calculate score");
    }
  }

  return (
    <div className="dashboard-page">
      <header className="dashboard-topbar">
        <div className="brand">
          <span className="brand-mark">AL</span>
          <span className="brand-name">Learning Hub</span>
        </div>
        <div className="dashboard-actions">
          <button className="btn outline" onClick={onBackHome}>
            Home
          </button>
          <button className="btn outline" onClick={onLogout}>
            Logout
          </button>
        </div>
      </header>

      <main className="dashboard-main">
        <section className="dashboard-card">
          <h2>Student Dashboard</h2>
          <p>Stream -> Subject -> Lesson flow with MCQ practice</p>

          <div className="dashboard-select-grid">
            <label>
              Stream
              <select
                value={selectedStreamId}
                onChange={(e) => setSelectedStreamId(e.target.value)}
              >
                <option value="">Select stream</option>
                {streams.map((item) => (
                  <option key={item._id} value={item._id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Subject
              <select
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
              >
                <option value="">Select subject</option>
                {subjects.map((item) => (
                  <option key={item._id} value={item._id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Lesson
              <select
                value={selectedLessonId}
                onChange={(e) => setSelectedLessonId(e.target.value)}
              >
                <option value="">Select lesson</option>
                {lessons.map((item) => (
                  <option key={item._id} value={item._id}>
                    {item.title}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>

        {lessonDetails ? (
          <section className="dashboard-card">
            <h3>{lessonDetails.title}</h3>
            <p>{lessonDetails.description}</p>

            <div className="resource-buttons">
              <a href={lessonDetails.videoLink} target="_blank" rel="noreferrer">
                Watch Sample Video
              </a>
              <a href={lessonDetails.notesUrl} target="_blank" rel="noreferrer">
                Theory Note PDF
              </a>
              <a
                href={lessonDetails.pastPaperMcqUrl}
                target="_blank"
                rel="noreferrer"
              >
                Past Paper MCQ
              </a>
              <a
                href={lessonDetails.pastPaperStructuredUrl}
                target="_blank"
                rel="noreferrer"
              >
                Past Paper Structured
              </a>
              <a
                href={lessonDetails.pastPaperEssayUrl}
                target="_blank"
                rel="noreferrer"
              >
                Past Paper Essay
              </a>
            </div>
          </section>
        ) : null}

        <section className="dashboard-card">
          <h3>Sample MCQs - Measurements</h3>
          <p>
            Answered: {answeredCount} / {mcqs.length}
          </p>

          {mcqs.map((mcq, index) => (
            <div key={mcq._id} className="mcq-item">
              <p>
                {index + 1}. {mcq.question}
              </p>
              <div className="mcq-options">
                {mcq.options.map((option, optionIndex) => (
                  <label key={optionIndex}>
                    <input
                      type="radio"
                      name={`mcq-${mcq._id}`}
                      checked={answers[mcq._id] === optionIndex}
                      onChange={() => selectAnswer(mcq._id, optionIndex)}
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}

          {mcqs.length > 0 ? (
            <button className="btn solid" onClick={handleSubmit}>
              Submit Answers
            </button>
          ) : (
            <p>No MCQs available for this lesson yet.</p>
          )}

          {result ? (
            <div className="mcq-result">
              <strong>
                Score: {result.correctAnswers} / {result.totalQuestions} (
                {result.scorePercent}%)
              </strong>
            </div>
          ) : null}

          {message ? <p className="dashboard-message">{message}</p> : null}
        </section>
      </main>
    </div>
  );
}

export default StudentDashboard;
