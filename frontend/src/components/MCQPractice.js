import { useState } from 'react';
import { submitMCQAnswer } from '../api';
import '../styles/MCQPractice.css';

function MCQPractice({ questions, token, lessonId }) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState({});

  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  async function handleSubmitAnswer() {
    if (selectedAnswer === null) return;

    setLoading(true);
    const result = await submitMCQAnswer(
      token,
      lessonId,
      currentQuestion._id,
      selectedAnswer
    );

    if (result.success) {
      setResult(result.result);
      setSubmitted(true);
      setAttempts({
        ...attempts,
        [currentQuestion._id]: result.result,
      });
    } else {
      alert('Error submitting answer: ' + result.error);
    }
    setLoading(false);
  }

  function handleNextQuestion() {
    setSelectedAnswer(null);
    setSubmitted(false);
    setResult(null);

    if (!isLastQuestion) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  }

  function handlePreviousQuestion() {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setSelectedAnswer(null);
      setSubmitted(false);
      setResult(null);
    }
  }

  if (!currentQuestion) {
    return <div className="mcq-empty">MCQ ප්‍රශ්න තවම නැහැ</div>;
  }

  return (
    <div className="mcq-practice">
      {/* Progress Bar */}
      <div className="mcq-progress">
        <div className="progress-track">
          <div
            className="progress-fill"
            style={{
              width: `${((currentQuestionIndex + 1) / questions.length) * 100}%`,
            }}
          ></div>
        </div>
        <p className="progress-text">
          MCQ පුහුණුව {currentQuestionIndex + 1} / {questions.length}
        </p>
      </div>

      {/* Question Card */}
      <div className="question-card">
        <div className="question-header">
          <h3 className="question-number">ප්‍රශ්නය {currentQuestionIndex + 1}</h3>
          <span className="question-marks">{currentQuestion.maxMarks} marks</span>
        </div>

        <p className="question-text">{currentQuestion.prompt}</p>

        {/* Options */}
        <div className="options-container">
          {currentQuestion.options.map((option, index) => (
            <button
              key={index}
              className={`option-btn ${selectedAnswer === index ? 'selected' : ''} ${
                submitted && index === currentQuestion.correctOptionIndex ? 'correct' : ''
              } ${
                submitted &&
                selectedAnswer === index &&
                index !== currentQuestion.correctOptionIndex
                  ? 'incorrect'
                  : ''
              }`}
              onClick={() => !submitted && setSelectedAnswer(index)}
              disabled={submitted}
            >
              <span className="option-letter">
                {String.fromCharCode(65 + index)}
              </span>
              <span className="option-text">{option}</span>
              {submitted && index === currentQuestion.correctOptionIndex && (
                <span className="option-icon">✓</span>
              )}
              {submitted &&
                selectedAnswer === index &&
                index !== currentQuestion.correctOptionIndex && (
                  <span className="option-icon">✗</span>
                )}
            </button>
          ))}
        </div>

        {/* Result Feedback */}
        {submitted && result && (
          <div className={`result-feedback ${result.isCorrect ? 'correct' : 'incorrect'}`}>
            <div className="result-header">
              {result.isCorrect ? (
                <>
                  <span className="result-icon">✓</span>
                  <span className="result-text">නිවැරදියි!</span>
                </>
              ) : (
                <>
                  <span className="result-icon">✗</span>
                  <span className="result-text">ඔබේ දුර්වල තැන් හඳුනාගන්න</span>
                </>
              )}
            </div>

            <div className="result-details">
              <p className="result-marks">
                ඔබට ලකුණු {result.earnedMarks} / {result.maxMarks} ලැබුණා
              </p>
              {result.explanation && (
                <div className="explanation">
                  <p className="explanation-label">පැහැදිලි කිරීම:</p>
                  <p className="explanation-text">{result.explanation}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Submit Button */}
        {!submitted && (
          <button
            className="submit-answer-btn"
            onClick={handleSubmitAnswer}
            disabled={selectedAnswer === null || loading}
          >
            {loading ? 'Submit වෙමින්...' : 'පිළිතුර Submit කරන්න'}
          </button>
        )}
      </div>

      {/* Navigation */}
      <div className="question-navigation">
        <button
          className="nav-btn"
          onClick={handlePreviousQuestion}
          disabled={currentQuestionIndex === 0}
        >
          ← පෙර
        </button>

        {submitted && (
          <button className="nav-btn primary" onClick={handleNextQuestion}>
            {isLastQuestion ? 'අවසන් කරන්න' : 'ඊළඟ ප්‍රශ්නය →'}
          </button>
        )}
      </div>

      {/* Quick Navigation */}
      <div className="quick-nav">
        <p className="quick-nav-label">ප්‍රශ්න:</p>
        <div className="quick-nav-buttons">
          {questions.map((_, index) => (
            <button
              key={index}
              className={`quick-nav-btn ${index === currentQuestionIndex ? 'active' : ''} ${
                attempts[questions[index]._id] ? 'attempted' : ''
              }`}
              onClick={() => {
                setCurrentQuestionIndex(index);
                setSelectedAnswer(null);
                setSubmitted(false);
                setResult(null);
              }}
            >
              {index + 1}
              {attempts[questions[index]._id] && (
                <span className="attempt-indicator">
                  {attempts[questions[index]._id].isCorrect ? '✓' : '✗'}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default MCQPractice;
