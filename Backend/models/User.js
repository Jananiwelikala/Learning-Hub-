const mongoose = require("mongoose");

// User accounts for students, teachers, and admins.
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, trim: true, default: "" },
    streamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Stream",
      default: null,
    },
    stream: { type: String, trim: true, default: "" },
    alYear: { type: String, trim: true, default: "" },
    subject: { type: String, trim: true, default: "" },
    teachingMode: { type: String, trim: true, default: "" },
    institute: { type: String, trim: true, default: "" },
    district: { type: String, trim: true, default: "" },
    qualifications: { type: String, trim: true, default: "" },
    experience: { type: String, trim: true, default: "" },
    bio: { type: String, trim: true, default: "" },
    subjects: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
    }],
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["student", "teacher", "admin"],
      default: "student",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
