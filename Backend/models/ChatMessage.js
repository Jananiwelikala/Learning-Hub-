const mongoose = require("mongoose");

const chatMessageSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    role: {
      type: String,
      enum: ["user", "assistant"],
      required: true,
    },
    message: { type: String, required: true, trim: true },
    lesson: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lesson",
      default: null,
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      default: null,
    },
  },
  { timestamps: true }
);

chatMessageSchema.index({ student: 1, createdAt: -1 });

module.exports = mongoose.model("ChatMessage", chatMessageSchema);
