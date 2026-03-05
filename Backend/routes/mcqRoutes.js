const express = require("express");
const auth = require("../Middleware/auth");
const roleMiddleware = require("../Middleware/roleMiddleware");
const MCQ = require("../models/MCQ");

const router = express.Router();

// Returns MCQs for a lesson without exposing answers.
router.get("/", auth, roleMiddleware(["student", "teacher", "admin"]), async (req, res) => {
  try {
    const { lessonId } = req.query;
    if (!lessonId) {
      return res.status(400).json({ message: "lessonId is required" });
    }

    const mcqs = await MCQ.find({ lesson: lessonId })
      .select("_id question options")
      .sort({ createdAt: 1 });

    res.json(mcqs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Grades submitted answers and returns score summary.
router.post("/submit", auth, roleMiddleware(["student", "teacher", "admin"]), async (req, res) => {
  try {
    const { lessonId, answers } = req.body;
    if (!lessonId) {
      return res.status(400).json({ message: "lessonId is required" });
    }
    if (!Array.isArray(answers)) {
      return res.status(400).json({ message: "answers must be an array" });
    }

    const mcqs = await MCQ.find({ lesson: lessonId }).sort({ createdAt: 1 });
    const answerMap = new Map(
      answers.map((item) => [String(item.mcqId), item.selectedOptionIndex])
    );

    let correctAnswers = 0;
    const results = mcqs.map((mcq) => {
      const selectedOptionIndex = answerMap.get(String(mcq._id));
      const isCorrect = selectedOptionIndex === mcq.correctOptionIndex;
      if (isCorrect) correctAnswers += 1;

      return {
        mcqId: mcq._id,
        question: mcq.question,
        selectedOptionIndex:
          typeof selectedOptionIndex === "number" ? selectedOptionIndex : null,
        correctOptionIndex: mcq.correctOptionIndex,
        isCorrect,
      };
    });

    const totalQuestions = mcqs.length;
    const scorePercent =
      totalQuestions === 0
        ? 0
        : Math.round((correctAnswers / totalQuestions) * 100);

    res.json({
      lessonId,
      totalQuestions,
      correctAnswers,
      scorePercent,
      results,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
