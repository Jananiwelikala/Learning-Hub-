const mongoose = require("mongoose");

// MCQ item linked to a lesson.
const mcqSchema = new mongoose.Schema(
  {
    lesson: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lesson",
      required: true,
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
    },
    unit: { type: String, trim: true },
    questionNumber: { type: Number, default: 0 },
    year: { type: Number },
    question: { type: String, trim: true },
    questionText: { type: String, trim: true },
    options: {
      type: [String],
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length >= 2,
        message: "At least two options are required",
      },
    },
    correctOptionIndex: { type: Number, min: 0 },
    correctAnswer: { type: mongoose.Schema.Types.Mixed },
    explanation: { type: String, trim: true, default: "" },
    difficulty: { type: String, trim: true, default: "" },
    examYear: { type: Number, default: 2024 },
    sourceLabel: {
      type: String,
      default: "A/L Past Paper 2024",
      trim: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("MCQ", mcqSchema);
