const mongoose = require("mongoose");

// AL stream/category (for example Bio, Maths, Commerce).
const streamSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    description: { type: String, trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Stream", streamSchema);
