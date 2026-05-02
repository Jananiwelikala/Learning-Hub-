const mongoose = require("mongoose");

// Class advertisement posts created by teachers
const classPostSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    subject: { type: String, required: true, trim: true },
    grade: { type: String, required: true, trim: true },
    location: { type: String, required: true, trim: true },
    schedule: { type: String, required: true, trim: true },
    duration: { type: String, required: true, trim: true },
    fee: { type: Number, required: true, min: 0 },
    contactInfo: { type: String, required: true, trim: true },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["draft", "pending", "approved", "rejected"],
      default: "draft",
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    approvedAt: { type: Date, default: null },
    rejectionReason: { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);

// Index for efficient queries
classPostSchema.index({ teacher: 1, status: 1 });
classPostSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model("ClassPost", classPostSchema);