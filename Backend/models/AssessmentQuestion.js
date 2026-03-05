const mongoose = require("mongoose");

// Assessment questions prepared for MCQ / Structured / Essay workflows.
const assessmentQuestionSchema = new mongoose.Schema(
  {
    lesson: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lesson",
      required: true,
    },
    questionType: {
      type: String,
      enum: ["mcq", "structured", "essay"],
      required: true,
    },
    prompt: { type: String, required: true, trim: true },
    options: [{ type: String, trim: true }], // used for MCQ only
    correctOptionIndex: { type: Number, min: 0 }, // used for MCQ only
    maxMarks: { type: Number, default: 10, min: 1 },
    examYear: { type: Number, default: 2024 },
    sourceLabel: {
      type: String,
      default: "A/L Past Paper 2024",
      trim: true,
    },
    aiReady: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("AssessmentQuestion", assessmentQuestionSchema);
