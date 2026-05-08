const mongoose = require("mongoose");

// Lesson content metadata linked to a subject.
const lessonSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    sinhalaTitle: { type: String, trim: true },
    description: { type: String, trim: true },
    icon: { type: String, trim: true },
    progressPercent: { type: Number, min: 0, max: 100, default: 0 },
    videoCount: { type: Number, default: 0 },
    notesCount: { type: Number, default: 0 },
    pastPaperCount: { type: Number, default: 0 },
    order: { type: Number, default: 0 },

    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
    },

    // These are the "locked" resources
    videoLink: { type: String, trim: true },
    videoTitle: { type: String, trim: true },
    durationMinutes: { type: Number, default: 0 },
    viewCount: { type: Number, default: 0 },
    updatedLabel: { type: String, trim: true },
    notesUrl: { type: String, trim: true },
    pastPaperMcqUrl: { type: String, trim: true },
    pastPaperStructuredUrl: { type: String, trim: true },
    pastPaperEssayUrl: { type: String, trim: true },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Lesson", lessonSchema);
