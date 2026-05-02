const express = require("express");
const Lesson = require("../models/Lesson");
const auth = require("../Middleware/auth");
const roleMiddleware = require("../Middleware/roleMiddleware");

const router = express.Router();

// Lesson routes:
// 1) Public list endpoint hides locked resources.
// 2) Protected detail endpoint returns full lesson data.

/**
 * PUBLIC
 * GET /api/lessons?subjectId=xxx
 * Returns ONLY public info (no videoLink/notesUrl)
 */
router.get("/", async (req, res) => {
  try {
    const { subjectId } = req.query;

    const filter = {};
    if (subjectId) filter.subject = subjectId;

    const lessons = await Lesson.find(filter)
      .select("title description subject createdAt") // no videoLink, no notesUrl
      .sort({ createdAt: -1 });

    res.json(lessons);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * PROTECTED
 * GET /api/lessons/:id
 * Returns FULL lesson (includes videoLink + notesUrl)
 */
router.get("/:id", auth, roleMiddleware(["student", "teacher", "admin"]), async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id).populate(
      "subject",
      "name"
    );

    if (!lesson) return res.status(404).json({ message: "Lesson not found" });

    res.json(lesson);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * PROTECTED
 * GET /api/lessons/by-subject/:subjectId
 * Returns all lessons for a subject with full details (for learning area)
 */
router.get("/by-subject/:subjectId", auth, roleMiddleware(["student", "teacher", "admin"]), async (req, res) => {
  try {
    const { subjectId } = req.params;

    const lessons = await Lesson.find({ subject: subjectId })
      .populate("subject", "name stream")
      .populate({
        path: "subject",
        populate: { path: "stream", select: "name" }
      })
      .sort({ createdAt: 1 });

    res.json(lessons);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * PROTECTED
 * GET /api/lessons/:lessonId/full
 * Returns complete lesson data with all resources and metadata
 */
router.get("/:lessonId/full", auth, roleMiddleware(["student", "teacher", "admin"]), async (req, res) => {
  try {
    const { lessonId } = req.params;

    const lesson = await Lesson.findById(lessonId)
      .populate("subject")
      .populate({
        path: "subject",
        populate: { path: "stream", select: "name" }
      });

    if (!lesson) return res.status(404).json({ message: "Lesson not found" });

    res.json(lesson);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
