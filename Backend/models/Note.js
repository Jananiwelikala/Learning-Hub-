const mongoose = require("mongoose");

const noteSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: "" },
    fileUrl: { type: String, trim: true, default: "" },
    pages: { type: Number, default: 0 },
    fileSize: { type: String, trim: true, default: "" },
    order: { type: Number, default: 0 },
    lesson: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lesson",
      required: true,
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

noteSchema.index({ subject: 1, lesson: 1, createdAt: -1 });

module.exports = mongoose.model("Note", noteSchema);
