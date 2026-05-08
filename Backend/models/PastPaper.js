const mongoose = require("mongoose");

const pastPaperSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    paperType: {
      type: String,
      enum: ["mcq", "structured", "essay", "full"],
      default: "full",
    },
    examYear: { type: Number, default: new Date().getFullYear() },
    fileUrl: { type: String, trim: true, default: "" },
    section: { type: String, trim: true, default: "" },
    questionsCount: { type: Number, default: 0 },
    durationMinutes: { type: Number, default: 0 },
    difficulty: {
      type: String,
      enum: ["Easy", "Medium", "Hard"],
      default: "Medium",
    },
    lesson: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lesson",
      default: null,
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

pastPaperSchema.index({ subject: 1, examYear: -1, createdAt: -1 });

module.exports = mongoose.model("PastPaper", pastPaperSchema);
