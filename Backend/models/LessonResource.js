const mongoose = require("mongoose");

const lessonResourceSchema = new mongoose.Schema(
  {
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
    },
    lesson: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lesson",
      required: true,
    },
    unit: { type: String, trim: true, default: "" },
    title: { type: String, trim: true, required: true },
    content: { type: String, trim: true, required: true },
    source: { type: String, trim: true, default: "" },
    type: { type: String, trim: true, default: "pdf-chunk" },
    sourcePdf: { type: String, trim: true, default: "" },
    pageRange: { type: String, trim: true, default: "" },
    keywords: [{ type: String, trim: true }],
  },
  { timestamps: true }
);

lessonResourceSchema.index({ subject: 1, lesson: 1, sourcePdf: 1 });
lessonResourceSchema.index({ subject: 1, lesson: 1, type: 1 });
lessonResourceSchema.index({ content: "text", title: "text", keywords: "text" });

module.exports = mongoose.model("LessonResource", lessonResourceSchema);
