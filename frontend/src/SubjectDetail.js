import { useState, useEffect, useCallback } from 'react';
import { getSubjectLessons } from './api';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorMessage from './components/ErrorMessage';
import EmptyState from './components/EmptyState';
import './styles/SubjectDetail.css';

function SubjectDetail({ token, subjectId, subjectName, streamName, onBack, onSelectLesson }) {
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadLessons = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await getSubjectLessons(token, subjectId);
    
    if (result.success) {
      setLessons(result.lessons || []);
    } else {
      setError(result.error);
    }
    setLoading(false);
  }, [token, subjectId]);

  useEffect(() => {
    loadLessons();
  }, [loadLessons]);

  const progressPercentage = 0; // TODO: Calculate from student attempts

  if (loading) {
    return <LoadingSpinner message="Loading lessons..." />;
  }

  if (error) {
    return (
      <ErrorMessage
        title="Failed to load lessons"
        message={error}
        onRetry={loadLessons}
      />
    );
  }

  return (
    <div className="subject-detail">
      {/* Subject Header */}
      <header className="subject-header">
        <button className="back-btn" onClick={onBack}>
          ← Back to Subjects
        </button>
        <div className="subject-info">
          <div>
            <h1>{subjectName}</h1>
            <p className="stream-info">{streamName}</p>
          </div>
          <div className="progress-badge">
            <div className="progress-circle">
              <svg viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="#e8f0ff"
                  strokeWidth="8"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="8"
                  strokeDasharray={`${progressPercentage * 2.83} 283`}
                  transform="rotate(-90 50 50)"
                />
              </svg>
              <span className="progress-text">{progressPercentage}%</span>
            </div>
            <p className="progress-label">Progress</p>
          </div>
        </div>
      </header>

      {/* Lessons Section */}
      <section className="lessons-section">
        <h2>Lessons ({lessons.length})</h2>
        
        {lessons.length === 0 ? (
          <EmptyState
            title="No lessons yet"
            message="Your teacher hasn't created any lessons for this subject yet."
          />
        ) : (
          <div className="lessons-grid">
            {lessons.map((lesson, index) => (
              <div
                key={lesson._id}
                className="lesson-card"
                onClick={() => onSelectLesson(lesson)}
              >
                <div className="lesson-card-header">
                  <div className="lesson-number">
                    Chapter {index + 1}
                  </div>
                  <div className="lesson-progress">
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: '0%' }}></div>
                    </div>
                  </div>
                </div>
                
                <h3 className="lesson-title">{lesson.title}</h3>
                
                <p className="lesson-description">
                  {lesson.description || 'No description available'}
                </p>
                
                <div className="lesson-resources">
                  {lesson.videoLink && (
                    <span className="resource-badge">
                      🎥 Video
                    </span>
                  )}
                  {lesson.notesUrl && (
                    <span className="resource-badge">
                      📄 Notes
                    </span>
                  )}
                  {(lesson.pastPaperMcqUrl || lesson.pastPaperStructuredUrl || lesson.pastPaperEssayUrl) && (
                    <span className="resource-badge">
                      ❓ Questions
                    </span>
                  )}
                </div>
                
                <button className="lesson-start-btn">
                  Start Learning →
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default SubjectDetail;
