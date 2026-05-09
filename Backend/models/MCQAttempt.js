const mongoose = require("mongoose");

const mcqAttemptSchema = new mongoose.Schema(
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
    answers: [
      {
        questionId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "MCQ",
          required: true,
        },
        selectedAnswer: { type: mongoose.Schema.Types.Mixed, default: null },
        correctAnswer: { type: mongoose.Schema.Types.Mixed, default: null },
        isCorrect: { type: Boolean, default: false },
      },
    ],
    score: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    percentage: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("MCQAttempt", mcqAttemptSchema);
