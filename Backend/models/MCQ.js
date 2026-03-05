const mongoose = require("mongoose");

// MCQ item linked to a lesson.
const mcqSchema = new mongoose.Schema(
  {
    lesson: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lesson",
      required: true,
    },
    question: { type: String, required: true, trim: true },
    options: {
      type: [String],
      required: true,
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length >= 2,
        message: "At least two options are required",
      },
    },
    correctOptionIndex: { type: Number, required: true, min: 0 },
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
