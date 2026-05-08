const mongoose = require("mongoose");

const studentProgressSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      default: null,
    },
    lesson: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lesson",
      required: true,
    },
    status: {
      type: String,
      enum: ["started", "in-progress", "completed"],
      default: "started",
    },
    completed: { type: Boolean, default: false },
    progressPercent: { type: Number, min: 0, max: 100, default: 0 },
    attemptsCount: { type: Number, default: 0 },
    mcqCorrect: { type: Number, default: 0 },
    mcqTotal: { type: Number, default: 0 },
    averageScore: { type: Number, min: 0, max: 100, default: 0 },
    lastAccessedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

studentProgressSchema.index({ student: 1, lesson: 1 }, { unique: true });
studentProgressSchema.index({ student: 1, lastAccessedAt: -1 });

module.exports = mongoose.model("StudentProgress", studentProgressSchema);
