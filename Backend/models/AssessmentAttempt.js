const mongoose = require("mongoose");

const attemptAnswerSchema = new mongoose.Schema(
  {
    mcqId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MCQ",
      required: true,
    },
    selectedOptionIndex: { type: Number, min: 0 },
    isCorrect: { type: Boolean, required: true },
  },
  { _id: false }
);

const descriptiveSubmissionSchema = new mongoose.Schema(
  {
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AssessmentQuestion",
      required: true,
    },
    questionType: {
      type: String,
      enum: ["structured", "essay"],
      required: true,
    },
    answerText: { type: String, required: true, trim: true },
    aiStatus: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "pending",
    },
    aiFeedback: { type: String, default: "" },
    aiScore: { type: Number, default: null },
  },
  { _id: false }
);

// Stores student attempts/scores and future AI feedback payloads.
const assessmentAttemptSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    lesson: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lesson",
      required: true,
    },
    questionType: {
      type: String,
      enum: ["mcq", "structured", "essay", "mixed"],
      required: true,
    },
    examYear: { type: Number, default: 2024 },
    mcqAttempt: {
      answers: [attemptAnswerSchema],
      totalQuestions: { type: Number, default: 0 },
      correctAnswers: { type: Number, default: 0 },
      scorePercent: { type: Number, default: 0 },
    },
    descriptiveAttempt: {
      submissions: [descriptiveSubmissionSchema],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("AssessmentAttempt", assessmentAttemptSchema);
