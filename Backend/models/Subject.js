const mongoose = require("mongoose");

// Subject belongs to one stream.
const subjectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    sinhalaName: { type: String, trim: true },
    code: { type: String, trim: true },
    icon: { type: String, trim: true },
    color: { type: String, trim: true },
    papersCount: { type: Number, default: 0 },
    studentsCount: { type: Number, default: 0 },
    isCore: { type: Boolean, default: true },
    isOptional: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
    stream: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Stream",
      required: true,
    },
  },
  { timestamps: true }
);

subjectSchema.index({ stream: 1, name: 1 }, { unique: true });

module.exports = mongoose.model("Subject", subjectSchema);
