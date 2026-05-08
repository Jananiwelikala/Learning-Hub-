const express = require("express");
const auth = require("../Middleware/auth");
const roleMiddleware = require("../Middleware/roleMiddleware");
const studentController = require("../controllers/studentController");

const router = express.Router();

router.use(auth, roleMiddleware("student"));

router.get("/profile", studentController.getProfile);
router.put("/profile", studentController.updateProfile);
router.get("/dashboard", studentController.getDashboard);
router.get("/subjects", studentController.getSubjects);
router.get("/lessons/:subjectId", studentController.getLessonsBySubject);
router.get("/lesson/:lessonId", studentController.getLessonDetails);
router.post("/mcq/submit", studentController.submitMcq);
router.get("/progress", studentController.getProgress);
router.post("/structured-answer/submit", studentController.submitStructuredAnswer);
router.get("/class-posts", studentController.getClassPosts);
router.get("/chatbot/history", studentController.getChatHistory);
router.post("/chatbot/message", studentController.postChatMessage);

module.exports = router;
