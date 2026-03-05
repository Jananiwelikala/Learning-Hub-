const express = require("express");
const auth = require("../Middleware/auth");
const roleMiddleware = require("../Middleware/roleMiddleware");
const AssessmentQuestion = require("../models/AssessmentQuestion");
const AssessmentAttempt = require("../models/AssessmentAttempt");

const router = express.Router();

// Returns prepared assessment questions (MCQ/Structured/Essay).
router.get(
  "/questions",
  auth,
  roleMiddleware(["student", "teacher", "admin"]),
  async (req, res) => {
    try {
      const { lessonId, type } = req.query;
      if (!lessonId) {
        return res.status(400).json({ message: "lessonId is required" });
      }

      const filter = { lesson: lessonId };
      if (type) filter.questionType = type;

      const questions = await AssessmentQuestion.find(filter)
        .select("lesson questionType prompt options maxMarks examYear sourceLabel aiReady")
        .sort({ createdAt: 1 });

      res.json(questions);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// Stores structured/essay submissions for future AI evaluation.
router.post(
  "/submit-descriptive",
  auth,
  roleMiddleware(["student", "teacher", "admin"]),
  async (req, res) => {
    try {
      const { lessonId, submissions } = req.body;

      if (!lessonId) {
        return res.status(400).json({ message: "lessonId is required" });
      }
      if (!Array.isArray(submissions) || submissions.length === 0) {
        return res.status(400).json({ message: "submissions must be a non-empty array" });
      }

      const normalized = submissions.map((item) => ({
        questionId: item.questionId,
        questionType: item.questionType,
        answerText: String(item.answerText || "").trim(),
      }));

      if (
        normalized.some(
          (item) =>
            !item.questionId ||
            !["structured", "essay"].includes(item.questionType) ||
            !item.answerText
        )
      ) {
        return res.status(400).json({
          message: "Each submission requires questionId, questionType(structured/essay), and answerText",
        });
      }

      const questionIds = normalized.map((item) => item.questionId);
      const questions = await AssessmentQuestion.find({
        _id: { $in: questionIds },
        lesson: lessonId,
      }).select("_id questionType");

      if (questions.length !== questionIds.length) {
        return res.status(400).json({ message: "One or more questions are invalid for this lesson" });
      }

      const typeMap = new Map(questions.map((q) => [String(q._id), q.questionType]));
      if (
        normalized.some(
          (item) => typeMap.get(String(item.questionId)) !== item.questionType
        )
      ) {
        return res.status(400).json({ message: "Submission questionType mismatch" });
      }

      const attempt = await AssessmentAttempt.create({
        student: req.user.id,
        lesson: lessonId,
        questionType:
          normalized.length > 1
            ? "mixed"
            : normalized[0].questionType,
        descriptiveAttempt: {
          submissions: normalized.map((item) => ({
            ...item,
            aiStatus: "pending",
            aiFeedback: "",
            aiScore: null,
          })),
        },
      });

      res.status(201).json({
        message: "Submission stored for AI evaluation pipeline",
        attemptId: attempt._id,
        aiStatus: "pending",
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// Returns attempts (student sees own; admin/teacher can filter by studentId).
router.get(
  "/attempts",
  auth,
  roleMiddleware(["student", "teacher", "admin"]),
  async (req, res) => {
    try {
      const { lessonId, studentId } = req.query;
      const filter = {};

      if (lessonId) filter.lesson = lessonId;
      if (req.user.role === "student") {
        filter.student = req.user.id;
      } else if (studentId) {
        filter.student = studentId;
      }

      const attempts = await AssessmentAttempt.find(filter)
        .populate("lesson", "title")
        .populate("student", "name email role")
        .sort({ createdAt: -1 });

      res.json(attempts);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

module.exports = router;
