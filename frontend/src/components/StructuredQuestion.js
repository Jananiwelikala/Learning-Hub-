import { useState } from 'react';
import { submitStructuredAnswer } from '../api';
import '../styles/StructuredQuestion.css';

function StructuredQuestion({ questions, token, lessonId, questionType }) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);

  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const currentAnswer = answers[currentQuestion._id] || '';

  async function handleSubmitAnswers() {
    const submissions = questions.map(q => ({
      questionId: q._id,
      questionType: q.questionType,
      answerText: answers[q._id] || '',
    }));

    setLoading(true);
    const result = await submitStructuredAnswer(
      token,
      lessonId,
      submissions
    );

    if (result.success) {
      setSubmitted(true);
      setSuccessMessage('Your answers have been submitted successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } else {
      alert('Error submitting answers: ' + result.error);
    }
    setLoading(false);
  }

  function handleAnswerChange(e) {
    setAnswers({
      ...answers,
      [currentQuestion._id]: e.target.value,
    });
  }

  function handleNextQuestion() {
    if (!isLastQuestion) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  }

  function handlePreviousQuestion() {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  }

  if (!currentQuestion) {
    return <div className="structured-empty">No questions available</div>;
  }

  const questionTypeLabel = questionType === 'essay' ? 'Essay' : 'Structured';
  const allAnswersProvided = questions.every(q => answers[q._id]?.trim());

  return (
    <div className="structured-question">
      {/* Success Message */}
      {successMessage && (
        <div className="success-message">
          <span className="success-icon">✓</span>
          {successMessage}
        </div>
      )}

      {/* Progress Bar */}
      <div className="question-progress">
        <div className="progress-track">
          <div
            className="progress-fill"
            style={{
              width: `${((currentQuestionIndex + 1) / questions.length) * 100}%`,
            }}
          ></div>
        </div>
        <p className="progress-text">
          Question {currentQuestionIndex + 1} of {questions.length}
        </p>
      </div>

      {/* Question Card */}
      <div className="structured-card">
        <div className="question-header">
          <h3 className="question-number">{questionTypeLabel} Question {currentQuestionIndex + 1}</h3>
          <span className="question-marks">{currentQuestion.maxMarks} marks</span>
        </div>

        <div className="question-meta">
          <span className="exam-year">Year {currentQuestion.examYear}</span>
          <span className="source-label">{currentQuestion.sourceLabel}</span>
        </div>

        <p className="question-text">{currentQuestion.prompt}</p>

        {/* Answer Text Area */}
        <div className="answer-section">
          <label htmlFor={`answer-${currentQuestion._id}`}>Your Answer:</label>
          <textarea
            id={`answer-${currentQuestion._id}`}
            className="answer-textarea"
            placeholder={`Enter your ${questionType} answer here...`}
            value={currentAnswer}
            onChange={handleAnswerChange}
            disabled={submitted}
            rows={questionType === 'essay' ? 12 : 8}
          ></textarea>
          <div className="answer-hint">
            {questionType === 'essay' ? (
              <p>💡 Write a comprehensive essay addressing all points in the question.</p>
            ) : (
              <p>💡 Provide a structured and clear answer with key points.</p>
            )}
          </div>
        </div>

        {submitted && (
          <div className="submission-feedback">
            <div className="submission-status submitted">
              <span className="status-icon">✓</span>
              <span className="status-text">Submitted</span>
            </div>
            <p className="ai-feedback-notice">
              🤖 Your answer will be evaluated by AI. Check back later for feedback!
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="question-navigation">
        <button
          className="nav-btn"
          onClick={handlePreviousQuestion}
          disabled={currentQuestionIndex === 0}
        >
          ← Previous
        </button>

        <button
          className="nav-btn"
          onClick={handleNextQuestion}
          disabled={isLastQuestion || !currentAnswer.trim()}
        >
          Next Question →
        </button>
      </div>

      {/* Submit All Button */}
      {!submitted && (
        <div className="submit-section">
          <div className="submit-info">
            <p>
              {Object.values(answers).filter(a => a?.trim()).length} of{' '}
              {questions.length} questions answered
            </p>
          </div>
          <button
            className="submit-all-btn"
            onClick={handleSubmitAnswers}
            disabled={!allAnswersProvided || loading}
          >
            {loading ? 'Submitting...' : 'Submit All Answers'}
          </button>
        </div>
      )}

      {/* Quick Navigation */}
      <div className="quick-nav">
        <p className="quick-nav-label">Questions:</p>
        <div className="quick-nav-buttons">
          {questions.map((_, index) => (
            <button
              key={index}
              className={`quick-nav-btn ${index === currentQuestionIndex ? 'active' : ''} ${
                answers[questions[index]._id]?.trim() ? 'answered' : ''
              }`}
              onClick={() => setCurrentQuestionIndex(index)}
              disabled={submitted}
            >
              {index + 1}
              {answers[questions[index]._id]?.trim() && (
                <span className="answer-indicator">✓</span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default StructuredQuestion;
