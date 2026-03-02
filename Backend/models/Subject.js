const mongoose = require("mongoose");

// Subject belongs to one stream.
const subjectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    stream: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Stream",
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Subject", subjectSchema);
