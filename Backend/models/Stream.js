const mongoose = require("mongoose");

// AL stream/category (for example Bio, Maths, Commerce).
const streamSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    description: { type: String, trim: true },
    sinhalaName: { type: String, trim: true },
    code: { type: String, trim: true, unique: true, sparse: true },
    icon: { type: String, trim: true },
    color: { type: String, trim: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Stream", streamSchema);
