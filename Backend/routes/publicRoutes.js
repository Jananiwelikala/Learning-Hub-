const express = require("express");
const Stream = require("../models/Stream");
const Subject = require("../models/Subject");
const Lesson = require("../models/Lesson");
const ClassPost = require("../models/ClassPost");

const router = express.Router();

function normalizeLimit(value, fallback = 6, max = 12) {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed < 1) return fallback;
  return Math.min(parsed, max);
}

router.get("/landing-summary", async (req, res) => {
  try {
    const [streamCount, subjectCount, lessonCount, approvedClassPostCount] = await Promise.all([
      Stream.countDocuments(),
      Subject.countDocuments(),
      Lesson.countDocuments(),
      ClassPost.countDocuments({ status: "approved" }),
    ]);

    res.json({
      streamCount,
      subjectCount,
      lessonCount,
      approvedClassPostCount,
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to load landing summary", error: err.message });
  }
});

router.get("/featured-subjects", async (req, res) => {
  try {
    const limit = normalizeLimit(req.query.limit, 6, 12);
    const subjects = await Subject.find()
      .populate("stream", "name description")
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    res.json(subjects);
  } catch (err) {
    res.status(500).json({ message: "Failed to load featured subjects", error: err.message });
  }
});

router.get("/approved-class-posts", async (req, res) => {
  try {
    const limit = normalizeLimit(req.query.limit, 3, 9);
    const posts = await ClassPost.find({ status: "approved" })
      .populate("teacher", "name email phone")
      .sort({ approvedAt: -1, createdAt: -1 })
      .limit(limit)
      .lean();

    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: "Failed to load approved class posts", error: err.message });
  }
});

module.exports = router;
