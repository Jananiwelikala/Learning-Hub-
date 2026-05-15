import { useState, useEffect } from 'react';
import { submitStructuredAnswer, submitStructuredAnswersBatch } from '../api';
import '../styles/StructuredQuestion.css';

function parseFeedbackText(feedback) {
  const lines = String(feedback || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const parsed = {
    correctAnswer: '',
    result: '',
    status: 'unknown',
    explanation: '',
  };

  const explanationLines = [];

  lines.forEach((line) => {
    if (/^Correct Answer:/i.test(line)) {
      parsed.correctAnswer = line.replace(/^Correct Answer:\s*/i, '');
      return;
    }
    if (/^Result:/i.test(line)) {
      parsed.result = line.replace(/^Result:\s*/i, '');
      if (/correct/i.test(parsed.result)) {
        parsed.status = 'correct';
      } else if (/incorrect/i.test(parsed.result)) {
        parsed.status = 'incorrect';
      }
      return;
    }
    if (/^Explanation:/i.test(line)) {
      explanationLines.push(line.replace(/^Explanation:\s*/i, ''));
      return;
    }
    explanationLines.push(line);
  });

  parsed.explanation = explanationLines.join(' ');
  return parsed;
}

function renderFeedbackItem(item, index, questions) {
  const feedbackText = typeof item === 'string' ? item : item.feedback || '';
  const questionId = typeof item === 'object' ? item.questionId : null;
  const parsed = parseFeedbackText(feedbackText);
  const questionNumber = questionId
    ? questions?.findIndex((q) => String(q._id) === String(questionId)) + 1
    : index + 1;

  return (
    <div key={index} className="ai-feedback-item">
      {questionNumber > 0 && <p className="ai-feedback-question">ප්‍රශ්නය {questionNumber}</p>}
      {parsed.correctAnswer && (
        <p className="feedback-correct-answer">Correct Answer: {parsed.correctAnswer}</p>
      )}
      {parsed.result && (
        <p className={`feedback-result ${parsed.status}`}>{parsed.result}</p>
      )}
      {parsed.explanation && (
        <p className="feedback-explanation">{parsed.explanation}</p>
      )}
    </div>
  );
}

function StructuredQuestionWithImage({ questions, token, lessonId, onClose }) {
  const [answers, setAnswers] = useState({});
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [aiFeedback, setAiFeedback] = useState(null);

  useEffect(() => {
    const initialAnswers = Object.fromEntries(
      questions.map((question) => [String(question._id), ''])
    );
    setAnswers(initialAnswers);
  }, [questions]);

  useEffect(() => {
    return () => {
      imagePreviews.forEach((preview) => URL.revokeObjectURL(preview));
    };
  }, [imagePreviews]);

  const answeredCount = Object.values(answers).filter((value) => value.trim()).length;

  function handleAnswerChange(questionId, value) {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  }

  function handleImageChange(event) {
    const files = Array.from(event.target.files || []).slice(0, 8);
    const previews = files.map((file) => URL.createObjectURL(file));

    imagePreviews.forEach((preview) => URL.revokeObjectURL(preview));
    setImages(files);
    setImagePreviews(previews);
  }

  async function handleSubmit() {
    const hasText = Object.values(answers).some((value) => value.trim());
    if (!hasText && images.length === 0) {
      setErrorMessage('ඔබගේ structured පිළිතුරු හෝ පින්තූර එක් කරන්න.');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    setSuccessMessage(null);
    setAiFeedback(null);

    const submissions = questions.map((question) => ({
      questionId: String(question._id),
      questionType: question.questionType || question.type || 'structured',
      answerText: (answers[String(question._id)] || '').trim() || '[Image uploaded]',
    }));

    let result;
    if (images.length > 0) {
      result = await submitStructuredAnswersBatch(token, lessonId, submissions, images);
    } else {
      result = await submitStructuredAnswer(token, lessonId, submissions);
    }

    setLoading(false);

    if (result.success) {
      setSuccessMessage('සිංහල AI විස්තර සමඟ ඔබගේ structured පිළිතුරු සාර්ථකව ඉදිරිපත් කරන ලදි.');
      setAiFeedback(result.data?.aiFeedback || result.data?.aiFeedbacks || 'AI ප්‍රතිපෝෂණය ලබාදෙනු ලැබේ.');
    } else {
      setErrorMessage(result.error || 'structured පිළිතුරු ඉදිරිපත් කිරීම අසාර්ථක විය.');
    }
  }

  if (!questions || questions.length === 0) {
    return <div className="structured-empty">Structured ප්‍රශ්න තවම නැහැ</div>;
  }

  return (
    <div className="structured-question">
      <div className="structured-header">
        <div>
          <h3>Structured Questions</h3>
          <p>ඔබට මෙහි සියලු ප්‍රශ්න එකවර දැක්කා හැකිව, පහසුවෙන් පිළිතුරු ලබාදිය හැක.</p>
        </div>
        <button type="button" className="close-btn" onClick={onClose}>
          Close
        </button>
      </div>

      <div className="question-summary">
        <span>{questions.length} ප්‍රශ්න</span>
        <span>{answeredCount} / {questions.length} text answered</span>
      </div>

      {questions.map((question, index) => (
        <div key={String(question._id)} className="structured-card question-block">
          <div className="question-header">
            <h3 className="question-number">ප්‍රශ්නය {index + 1}</h3>
            <span className="question-marks">{question.maxMarks || 5} marks</span>
          </div>

          <div className="question-meta">
            {question.examYear && <span className="exam-year">Year {question.examYear}</span>}
            {question.sourceLabel && <span className="source-label">{question.sourceLabel}</span>}
          </div>

          <p className="question-text">{question.prompt}</p>

          <div className="answer-section">
            <label htmlFor={`answer-${question._id}`}>ඔබේ පිළිතුර</label>
            <textarea
              id={`answer-${question._id}`}
              value={answers[String(question._id)] || ''}
              onChange={(e) => handleAnswerChange(String(question._id), e.target.value)}
              className="answer-textarea"
              rows={5}
              placeholder="මෙහි ඔබගේ structured පිළිතුර ටයිප් කරන්න..."
            />
          </div>
        </div>
      ))}

      <div className="structured-card image-upload-card">
        <div className="question-header">
          <h3 className="question-number">Images</h3>
          <span className="question-marks">Upload multiple</span>
        </div>

        <div className="answer-section">
          <label htmlFor="image-upload-all">Upload handwritten answers or diagrams</label>
          <input
            type="file"
            id="image-upload-all"
            accept="image/*"
            multiple
            onChange={handleImageChange}
          />
          <p className="answer-hint">
            ඔබට බොහෝ පින්තූර එක් කළ හැක. ලියන ලද පිළිතුරු, රේඛා හෝ සටහන් මෙහි-upload කරන්න.
          </p>
        </div>

        {imagePreviews.length > 0 && (
          <div className="image-preview-grid">
            {imagePreviews.map((preview, index) => (
              <div key={index} className="image-preview-card">
                <img src={preview} alt={`uploaded-${index}`} />
                <span>Image {index + 1}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="submit-section">
        <div className="submit-info">
          <p>Submit all structured answers and images together for Sinhala AI review.</p>
          {errorMessage && <p className="error-text">{errorMessage}</p>}
        </div>
        <button
          className="submit-all-btn"
          type="button"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? 'Submitting...' : 'Submit for Sinhala AI review'}
        </button>
      </div>

      {successMessage && (
        <div className="submission-feedback">
          <div className="submission-status">
            <span className="status-icon">✓</span>
            <span>{successMessage}</span>
          </div>
        </div>
      )}

      {aiFeedback && (
        <div className="ai-feedback-section">
          <h4>AI Sinhala Feedback</h4>
          <div className="ai-feedback-content">
            {Array.isArray(aiFeedback)
              ? aiFeedback.map((item, index) => renderFeedbackItem(item, index, questions))
              : renderFeedbackItem(aiFeedback, 0, questions)}
          </div>
        </div>
      )}
    </div>
  );
}

export default StructuredQuestionWithImage;
