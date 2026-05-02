const mongoose = require("mongoose");

// Comments on class posts
const commentSchema = new mongoose.Schema(
  {
    content: { type: String, required: true, trim: true },
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ClassPost",
      required: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    authorName: { type: String, required: true }, // Cache for performance
    authorRole: {
      type: String,
      enum: ["student", "teacher", "admin"],
      required: true,
    },
    parentComment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
      default: null,
    },
    isReply: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ["active", "hidden", "deleted"],
      default: "active",
    },
  },
  { timestamps: true }
);

// Index for efficient queries
commentSchema.index({ post: 1, createdAt: -1 });
commentSchema.index({ parentComment: 1 });

module.exports = mongoose.model("Comment", commentSchema);