const express = require("express");
const multer = require("multer");
const auth = require("../Middleware/auth");
const roleMiddleware = require("../Middleware/roleMiddleware");
const studentController = require("../controllers/studentController");

const router = express.Router();

const upload = multer({ storage: multer.memoryStorage() });

router.use(auth, roleMiddleware("student"));

router.get("/profile", studentController.getProfile);
router.put("/profile", studentController.updateProfile);
router.get("/dashboard", studentController.getDashboard);
router.get("/subjects", studentController.getSubjects);
router.get("/ongoing-lessons", studentController.getOngoingLessons);
router.get("/lessons/:subjectId", studentController.getLessonsBySubject);
router.get("/lesson/:lessonId", studentController.getLessonDetails);
router.get("/lesson/:lessonId/pastpapers", studentController.getLessonPastPapers);
router.get("/virtual-paper/:paperId/questions", studentController.getVirtualPaperQuestions);
router.get("/debug/questions/:lessonId", async (req, res) => {
  try {
    const { lessonId } = req.params;
    const AssessmentQuestion = require("../models/AssessmentQuestion");
    const questions = await AssessmentQuestion.find({ lesson: lessonId }).limit(10);
    res.json({
      lessonId,
      totalQuestions: questions.length,
      questions: questions.map(q => ({
        _id: q._id,
        questionType: q.questionType,
        examYear: q.examYear,
        prompt: q.prompt.substring(0, 50) + "..."
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
router.get("/mcqs/lesson/:lessonId", studentController.getMcqsByLesson);
router.post("/mcqs/submit", studentController.submitMcqSet);
router.post("/mcq/submit", studentController.submitMcq);
router.get("/progress", studentController.getProgress);
router.post("/structured-answer/submit", studentController.submitStructuredAnswer);
router.post("/structured-answer/submit-image", upload.single("image"), studentController.submitStructuredAnswerWithImage);
router.post("/structured-answer/submit-batch", upload.array("images", 8), studentController.submitStructuredAnswerBatch);
router.get("/class-posts", studentController.getClassPosts);
router.get("/chatbot/history", studentController.getChatHistory);
router.post("/chatbot/message", studentController.postChatMessage);

module.exports = router;
