import { useState, useEffect, useCallback } from 'react';
import { getLessonFull, getQuestionsForLesson } from './api';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorMessage from './components/ErrorMessage';
import EmptyState from './components/EmptyState';
import MCQPractice from './components/MCQPractice';
import StructuredQuestion from './components/StructuredQuestion';
import './styles/LessonDetail.css';

function LessonDetail({ token, lessonId, subjectName, onBack }) {
  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('video'); // video, notes, mcq, structured, essay
  const [questionsGrouped, setQuestionsGrouped] = useState({
    mcq: [],
    structured: [],
    essay: [],
  });

  const loadLessonData = useCallback(async () => {
    setLoading(true);
    setError(null);

    const lessonResult = await getLessonFull(token, lessonId);
    const questionsResult = await getQuestionsForLesson(token, lessonId);

    if (lessonResult.success) {
      setLesson(lessonResult.lesson);
    } else {
      setError(lessonResult.error);
      setLoading(false);
      return;
    }

    if (questionsResult.success) {
      const questions = questionsResult.questions || [];

      // Group questions by type and year
      const grouped = {
        mcq: questions.filter(q => q.questionType === 'mcq'),
        structured: questions.filter(q => q.questionType === 'structured'),
        essay: questions.filter(q => q.questionType === 'essay'),
      };
      setQuestionsGrouped(grouped);
    }

    setLoading(false);
  }, [token, lessonId]);

  useEffect(() => {
    loadLessonData();
  }, [loadLessonData]);

  if (loading) {
    return <LoadingSpinner message="පාඩම load වෙමින් පවතී..." />;
  }

  if (error || !lesson) {
    return (
      <ErrorMessage
        title="පාඩම load කිරීමට නොහැකි විය"
        message={error || 'පාඩම සොයාගත නොහැක'}
        onRetry={loadLessonData}
      />
    );
  }

  const embedVideoUrl = lesson.videoLink ? getYouTubeEmbedUrl(lesson.videoLink) : null;

  function getYouTubeEmbedUrl(url) {
    if (!url) return null;
    
    let videoId = '';
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      if (url.includes('youtube.com/watch')) {
        const urlParams = new URLSearchParams(new URL(url).search);
        videoId = urlParams.get('v');
      } else if (url.includes('youtu.be')) {
        videoId = url.split('/').pop();
      }
    }
    
    return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
  }

  return (
    <div className="lesson-detail">
      {/* Header */}
      <header className="lesson-header">
        <button className="back-btn" onClick={onBack}>
          ← පාඩම් වෙත
        </button>
        <div>
          <h1>{lesson.title}</h1>
          <p className="breadcrumb">{subjectName}</p>
        </div>
      </header>

      {/* Tab Navigation */}
      <nav className="lesson-tabs">
        <button
          className={`tab-btn ${activeTab === 'video' ? 'active' : ''}`}
          onClick={() => setActiveTab('video')}
        >
            Video පාඩම
        </button>
        {lesson.notesUrl && (
          <button
            className={`tab-btn ${activeTab === 'notes' ? 'active' : ''}`}
            onClick={() => setActiveTab('notes')}
          >
            සටහන්
          </button>
        )}
        {questionsGrouped.mcq.length > 0 && (
          <button
            className={`tab-btn ${activeTab === 'mcq' ? 'active' : ''}`}
            onClick={() => setActiveTab('mcq')}
          >
            MCQ පුහුණුව ({questionsGrouped.mcq.length})
          </button>
        )}
        {questionsGrouped.structured.length > 0 && (
          <button
            className={`tab-btn ${activeTab === 'structured' ? 'active' : ''}`}
            onClick={() => setActiveTab('structured')}
          >
            Structured පිළිතුරු ({questionsGrouped.structured.length})
          </button>
        )}
        {questionsGrouped.essay.length > 0 && (
          <button
            className={`tab-btn ${activeTab === 'essay' ? 'active' : ''}`}
            onClick={() => setActiveTab('essay')}
          >
            Essay පිළිතුරු ({questionsGrouped.essay.length})
          </button>
        )}
      </nav>

      {/* Content */}
      <main className="lesson-content">
        {/* Video Tab */}
        {activeTab === 'video' && (
          <section className="tab-content">
            <h2>පාඩම් වීඩියෝව</h2>
            {embedVideoUrl ? (
              <div className="video-container">
                <iframe
                  width="100%"
                  height="600"
                  src={embedVideoUrl}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title={lesson.title}
                ></iframe>
              </div>
            ) : (
              <EmptyState
                title="වීඩියෝවක් තවම නැහැ"
                message="මෙම පාඩම සඳහා වීඩියෝව ඉක්මනින් ලබාදේ."
              />
            )}
            
            {lesson.description && (
              <div className="lesson-description">
                <h3>මෙම පාඩම ගැන</h3>
                <p>{lesson.description}</p>
              </div>
            )}
          </section>
        )}

        {/* Notes Tab */}
        {activeTab === 'notes' && (
          <section className="tab-content">
            <h2>සටහන්</h2>
            {lesson.notesUrl ? (
              <div className="materials-container">
                <div className="material-card">
                  <div className="material-icon">📄</div>
                  <div className="material-info">
                    <h3>පාඩම් සටහන්</h3>
                    <p>ඔබේ විභාග සූදානම වැඩි කරගන්න සටහන් භාවිතා කරන්න</p>
                  </div>
                  <a
                    href={lesson.notesUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="download-btn"
                  >
                    Download
                  </a>
                </div>
              </div>
            ) : (
              <EmptyState
                title="සටහන් තවම නැහැ"
                message="මෙම පාඩම සඳහා සටහන් ඉක්මනින් ලබාදේ."
              />
            )}
          </section>
        )}

        {/* MCQ Tab */}
        {activeTab === 'mcq' && (
          <section className="tab-content">
            <h2>MCQ පුහුණුව</h2>
            {questionsGrouped.mcq.length > 0 ? (
              <MCQPractice
                questions={questionsGrouped.mcq}
                token={token}
                lessonId={lessonId}
              />
            ) : (
              <EmptyState
                title="MCQ ප්‍රශ්න තවම නැහැ"
                message="මෙම පාඩම සඳහා MCQ පුහුණුව ඉක්මනින් ලබාදේ."
              />
            )}
          </section>
        )}

        {/* Structured Tab */}
        {activeTab === 'structured' && (
          <section className="tab-content">
            <h2>Structured පිළිතුරු</h2>
            {questionsGrouped.structured.length > 0 ? (
              <StructuredQuestion
                questions={questionsGrouped.structured}
                token={token}
                lessonId={lessonId}
                questionType="structured"
              />
            ) : (
              <EmptyState
                title="Structured ප්‍රශ්න තවම නැහැ"
                message="මෙම පාඩම සඳහා structured පුහුණුව ඉක්මනින් ලබාදේ."
              />
            )}
          </section>
        )}

        {/* Essay Tab */}
        {activeTab === 'essay' && (
          <section className="tab-content">
            <h2>Essay පිළිතුරු</h2>
            {questionsGrouped.essay.length > 0 ? (
              <StructuredQuestion
                questions={questionsGrouped.essay}
                token={token}
                lessonId={lessonId}
                questionType="essay"
              />
            ) : (
              <EmptyState
                title="Essay ප්‍රශ්න තවම නැහැ"
                message="මෙම පාඩම සඳහා essay පුහුණුව ඉක්මනින් ලබාදේ."
              />
            )}
          </section>
        )}
      </main>
    </div>
  );
}

export default LessonDetail;
