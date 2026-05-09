const mongoose = require("mongoose");
const User = require("../models/User");
const Stream = require("../models/Stream");
const Subject = require("../models/Subject");
const Lesson = require("../models/Lesson");
const MCQ = require("../models/MCQ");
const AssessmentQuestion = require("../models/AssessmentQuestion");
const AssessmentAttempt = require("../models/AssessmentAttempt");
const ClassPost = require("../models/ClassPost");
const Note = require("../models/Note");
const PastPaper = require("../models/PastPaper");
const StudentProgress = require("../models/StudentProgress");
const ChatMessage = require("../models/ChatMessage");
const MCQAttempt = require("../models/MCQAttempt");

function ok(res, data, status = 200) {
  return res.status(status).json({ success: true, data });
}

function fail(res, status, message) {
  return res.status(status).json({ success: false, message });
}

function isObjectId(value) {
  return mongoose.Types.ObjectId.isValid(value);
}

function normalizeAnswer(value) {
  return String(value ?? "").trim().toLowerCase();
}

function getCorrectAnswer(mcq) {
  if (mcq.correctAnswer !== undefined && mcq.correctAnswer !== null && mcq.correctAnswer !== "") {
    return mcq.correctAnswer;
  }

  if (typeof mcq.correctOptionIndex === "number" && Array.isArray(mcq.options)) {
    return mcq.options[mcq.correctOptionIndex] ?? mcq.correctOptionIndex;
  }

  return "";
}

function isAnswerCorrect(selectedAnswer, correctAnswer, options = []) {
  const selected = normalizeAnswer(selectedAnswer);
  const correct = normalizeAnswer(correctAnswer);
  if (!selected || !correct) return false;
  if (selected === correct) return true;

  const selectedIndex = Number(selectedAnswer);
  if (Number.isInteger(selectedIndex) && normalizeAnswer(options[selectedIndex]) === correct) {
    return true;
  }

  const optionIndex = options.findIndex((option) => normalizeAnswer(option) === selected);
  if (optionIndex >= 0 && normalizeAnswer(optionIndex) === correct) {
    return true;
  }

  const letters = ["a", "b", "c", "d", "e"];
  const selectedLetterIndex = letters.indexOf(selected);
  if (selectedLetterIndex >= 0 && normalizeAnswer(options[selectedLetterIndex]) === correct) {
    return true;
  }

  const correctLetterIndex = letters.indexOf(correct);
  if (correctLetterIndex >= 0 && normalizeAnswer(options[correctLetterIndex]) === selected) {
    return true;
  }

  return false;
}

function cleanMcq(mcq, includeAnswer = false) {
  const payload = {
    id: mcq._id,
    _id: mcq._id,
    lesson: mcq.lesson,
    subject: mcq.subject,
    unit: mcq.unit || "",
    questionNumber: mcq.questionNumber || 0,
    year: mcq.year || mcq.examYear || null,
    questionText: mcq.questionText || mcq.question || "",
    options: mcq.options || [],
    difficulty: mcq.difficulty || "",
  };

  if (includeAnswer) {
    payload.correctAnswer = getCorrectAnswer(mcq);
    payload.explanation = mcq.explanation || "";
  }

  return payload;
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function cleanUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone || "",
    role: user.role,
    stream: user.stream || "",
    streamId: user.streamId || null,
    subject: user.subject || "",
    createdAt: user.createdAt,
  };
}

async function getStudent(req) {
  return User.findById(req.user.id).select("-password");
}

async function getSelectedStream(student) {
  if (student.streamId) {
    const stream = await Stream.findById(student.streamId);
    if (stream) return stream;
  }

  if (student.stream) {
    const aliases = {
      Science: "Bio Science",
      "Biology Stream": "Bio Science",
      Biology: "Bio Science",
      Mathematics: "Physical Science",
      Maths: "Physical Science",
      Math: "Physical Science",
      Commerce: "Commerce",
      Arts: "Arts",
      Technology: "Technology",
    };
    const streamName = aliases[student.stream] || student.stream;
    const exactStream = await Stream.findOne({ name: new RegExp(`^${escapeRegex(streamName)}$`, "i") });
    if (exactStream) return exactStream;
    return Stream.findOne({ name: new RegExp(escapeRegex(streamName), "i") });
  }

  return null;
}

async function getStudentSubjects(student) {
  const stream = await getSelectedStream(student);

  if (stream) {
    const subjects = await Subject.find({ stream: stream._id })
      .populate("stream", "name description")
      .sort({ order: 1, createdAt: 1 });
    return { stream, subjects };
  }

  const subjects = await Subject.find()
    .populate("stream", "name description")
    .sort({ order: 1, createdAt: 1 })
    .limit(12);

  return { stream: null, subjects };
}

async function touchProgress({ studentId, lessonId, subjectId, progressPercent = 20, scorePercent = null, isCorrect = null }) {
  const existing = await StudentProgress.findOne({ student: studentId, lesson: lessonId });
  const attemptsCount = (existing?.attemptsCount || 0) + 1;
  const mcqTotal = isCorrect === null ? existing?.mcqTotal || 0 : (existing?.mcqTotal || 0) + 1;
  const mcqCorrect = isCorrect === null ? existing?.mcqCorrect || 0 : (existing?.mcqCorrect || 0) + (isCorrect ? 1 : 0);
  const averageScore =
    scorePercent === null
      ? existing?.averageScore || 0
      : Math.round((((existing?.averageScore || 0) * (attemptsCount - 1)) + scorePercent) / attemptsCount);
  const nextProgress = Math.max(existing?.progressPercent || 0, progressPercent);

  return StudentProgress.findOneAndUpdate(
    { student: studentId, lesson: lessonId },
    {
      $set: {
        subject: subjectId || existing?.subject || null,
        status: nextProgress >= 100 ? "completed" : "in-progress",
        completed: nextProgress >= 100,
        progressPercent: nextProgress,
        attemptsCount,
        mcqTotal,
        mcqCorrect,
        averageScore,
        lastAccessedAt: new Date(),
      },
    },
    { new: true, upsert: true }
  );
}

async function getProfile(req, res) {
  try {
    const student = await getStudent(req);
    if (!student) return fail(res, 404, "Student profile not found");
    return ok(res, cleanUser(student));
  } catch (error) {
    return fail(res, 500, "Failed to load student profile");
  }
}

async function updateProfile(req, res) {
  try {
    const allowed = ["name", "phone", "stream", "streamId"];
    const updates = {};

    allowed.forEach((key) => {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    });

    if (updates.name !== undefined) updates.name = String(updates.name).trim();
    if (updates.phone !== undefined) updates.phone = String(updates.phone).trim();
    if (updates.stream !== undefined) updates.stream = String(updates.stream).trim();
    if (updates.streamId && !isObjectId(updates.streamId)) {
      return fail(res, 400, "Invalid stream id");
    }

    const student = await User.findByIdAndUpdate(req.user.id, updates, {
      new: true,
      runValidators: true,
    }).select("-password");

    if (!student) return fail(res, 404, "Student profile not found");
    return ok(res, cleanUser(student));
  } catch (error) {
    return fail(res, 500, "Failed to update student profile");
  }
}

async function getSubjects(req, res) {
  try {
    const student = await getStudent(req);
    if (!student) return fail(res, 404, "Student profile not found");

    const { stream, subjects } = await getStudentSubjects(student);
    return ok(res, { selectedStream: stream, subjects });
  } catch (error) {
    return fail(res, 500, "Failed to load student subjects");
  }
}

async function getLessonsBySubject(req, res) {
  try {
    const { subjectId } = req.params;
    if (!isObjectId(subjectId)) return fail(res, 400, "Invalid subject id");

    const lessons = await Lesson.find({ subject: subjectId })
      .select("title sinhalaTitle description icon progressPercent videoCount notesCount pastPaperCount order subject createdAt videoLink videoUrl videoLinks videoUrls videos videoTitle durationMinutes viewCount updatedLabel notes notesUrl pastPaperMcqUrl pastPaperStructuredUrl pastPaperEssayUrl")
      .populate("subject", "name stream")
      .sort({ order: 1, createdAt: 1 });

    return ok(res, lessons);
  } catch (error) {
    return fail(res, 500, "Failed to load lessons");
  }
}

async function getLessonDetails(req, res) {
  try {
    const { lessonId } = req.params;
    if (!isObjectId(lessonId)) return fail(res, 400, "Invalid lesson id");

    const lesson = await Lesson.findById(lessonId)
      .populate("subject", "name stream")
      .populate({
        path: "subject",
        populate: { path: "stream", select: "name description" },
      });

    if (!lesson) return fail(res, 404, "Lesson not found");

    const [notes, pastPapers, mcqs, assessmentQuestions, progress] = await Promise.all([
      Note.find({ lesson: lessonId }).sort({ createdAt: -1 }),
      PastPaper.find({ lesson: lessonId }).sort({ examYear: -1, createdAt: -1 }),
      MCQ.find({ lesson: lessonId }).select("-correctOptionIndex").sort({ createdAt: 1 }),
      AssessmentQuestion.find({ lesson: lessonId }).select("-correctOptionIndex").sort({ createdAt: 1 }),
      StudentProgress.findOne({ student: req.user.id, lesson: lessonId }),
    ]);

    await touchProgress({
      studentId: req.user.id,
      lessonId,
      subjectId: lesson.subject?._id,
      progressPercent: progress?.progressPercent || 10,
    });

    return ok(res, { lesson, notes, pastPapers, mcqs, assessmentQuestions, progress });
  } catch (error) {
    return fail(res, 500, "Failed to load lesson details");
  }
}

async function submitMcq(req, res) {
  try {
    const { lessonId, questionId, selectedOptionIndex } = req.body;
    if (!isObjectId(lessonId) || !isObjectId(questionId) || selectedOptionIndex === undefined) {
      return fail(res, 400, "lessonId, questionId and selectedOptionIndex are required");
    }

    let question = await AssessmentQuestion.findOne({ _id: questionId, lesson: lessonId, questionType: "mcq" });
    let source = "assessment";

    if (!question) {
      question = await MCQ.findOne({ _id: questionId, lesson: lessonId });
      source = "mcq";
    }

    if (!question) return fail(res, 404, "MCQ question not found");

    const lesson = await Lesson.findById(lessonId).select("subject");
    const isCorrect = Number(selectedOptionIndex) === Number(question.correctOptionIndex);
    const totalQuestions = 1;
    const correctAnswers = isCorrect ? 1 : 0;
    const scorePercent = isCorrect ? 100 : 0;

    const attempt = await AssessmentAttempt.create({
      student: req.user.id,
      lesson: lessonId,
      questionType: "mcq",
      examYear: question.examYear || new Date().getFullYear(),
      mcqAttempt: {
        answers: [
          {
            mcqId: questionId,
            selectedOptionIndex: Number(selectedOptionIndex),
            isCorrect,
          },
        ],
        totalQuestions,
        correctAnswers,
        scorePercent,
      },
    });

    const progress = await touchProgress({
      studentId: req.user.id,
      lessonId,
      subjectId: lesson?.subject,
      progressPercent: isCorrect ? 45 : 25,
      scorePercent,
      isCorrect,
    });

    return ok(res, {
      attemptId: attempt._id,
      source,
      isCorrect,
      correctOptionIndex: question.correctOptionIndex,
      scorePercent,
      progress,
    });
  } catch (error) {
    return fail(res, 500, "Failed to submit MCQ answer");
  }
}

async function getMcqsByLesson(req, res) {
  try {
    const { lessonId } = req.params;
    if (!isObjectId(lessonId)) return fail(res, 400, "Invalid lesson id");

    const mcqs = await MCQ.find({ lesson: lessonId })
      .sort({ questionNumber: 1, createdAt: 1 })
      .lean();

    return ok(res, mcqs.map((mcq) => cleanMcq(mcq)));
  } catch (error) {
    return fail(res, 500, "Failed to load MCQ questions");
  }
}

async function submitMcqSet(req, res) {
  try {
    const { lessonId, answers } = req.body;
    if (!isObjectId(lessonId)) return fail(res, 400, "lessonId is required");
    if (!Array.isArray(answers)) return fail(res, 400, "answers must be an array");

    const mcqs = await MCQ.find({ lesson: lessonId })
      .sort({ questionNumber: 1, createdAt: 1 })
      .lean();

    const answerMap = new Map(
      answers.map((item) => [String(item.questionId), item.selectedAnswer])
    );

    let score = 0;
    const results = mcqs.map((mcq) => {
      const selectedAnswer = answerMap.get(String(mcq._id)) ?? "";
      const correctAnswer = getCorrectAnswer(mcq);
      const isCorrect = isAnswerCorrect(selectedAnswer, correctAnswer, mcq.options || []);
      if (isCorrect) score += 1;

      return {
        questionId: mcq._id,
        questionText: mcq.questionText || mcq.question || "",
        selectedAnswer,
        correctAnswer,
        isCorrect,
        explanation: mcq.explanation || "",
      };
    });

    const total = mcqs.length;
    const percentage = total ? Math.round((score / total) * 100) : 0;

    await MCQAttempt.create({
      student: req.user.id,
      lesson: lessonId,
      answers: results.map((item) => ({
        questionId: item.questionId,
        selectedAnswer: item.selectedAnswer,
        correctAnswer: item.correctAnswer,
        isCorrect: item.isCorrect,
      })),
      score,
      total,
      percentage,
    });

    await touchProgress({
      studentId: req.user.id,
      lessonId,
      subjectId: mcqs[0]?.subject,
      progressPercent: percentage >= 80 ? 80 : 45,
      scorePercent: percentage,
      isCorrect: null,
    });

    return ok(res, { score, total, percentage, results });
  } catch (error) {
    return fail(res, 500, "Failed to submit MCQ answers");
  }
}

async function submitStructuredAnswer(req, res) {
  try {
    const { lessonId, submissions } = req.body;
    if (!isObjectId(lessonId)) return fail(res, 400, "lessonId is required");
    if (!Array.isArray(submissions) || submissions.length === 0) {
      return fail(res, 400, "At least one answer submission is required");
    }

    const normalized = submissions.map((item) => ({
      questionId: item.questionId,
      questionType: item.questionType || "structured",
      answerText: String(item.answerText || "").trim(),
      aiStatus: "completed",
      aiFeedback: "AI feedback saved. Review your answer structure, keywords, and final explanation.",
      aiScore: null,
    }));

    if (normalized.some((item) => !isObjectId(item.questionId) || !item.answerText)) {
      return fail(res, 400, "Each submission requires questionId and answerText");
    }

    const lesson = await Lesson.findById(lessonId).select("subject");
    const attempt = await AssessmentAttempt.create({
      student: req.user.id,
      lesson: lessonId,
      questionType: normalized.length > 1 ? "mixed" : normalized[0].questionType,
      descriptiveAttempt: { submissions: normalized },
    });

    const progress = await touchProgress({
      studentId: req.user.id,
      lessonId,
      subjectId: lesson?.subject,
      progressPercent: 55,
    });

    return ok(
      res,
      {
        attemptId: attempt._id,
        aiStatus: "completed",
        aiFeedback: normalized.map((item) => ({
          questionId: item.questionId,
          feedback: item.aiFeedback,
        })),
        progress,
      },
      201
    );
  } catch (error) {
    return fail(res, 500, "Failed to submit structured answer");
  }
}

async function getProgress(req, res) {
  try {
    const progress = await StudentProgress.find({ student: req.user.id })
      .populate("lesson", "title description")
      .populate("subject", "name")
      .sort({ lastAccessedAt: -1 });

    const totalLessons = progress.length;
    const completedLessons = progress.filter((item) => item.completed).length;
    const averageProgress = totalLessons
      ? Math.round(progress.reduce((sum, item) => sum + item.progressPercent, 0) / totalLessons)
      : 0;
    const mcqTotal = progress.reduce((sum, item) => sum + item.mcqTotal, 0);
    const mcqCorrect = progress.reduce((sum, item) => sum + item.mcqCorrect, 0);

    return ok(res, {
      progress,
      summary: {
        totalLessons,
        completedLessons,
        averageProgress,
        mcqTotal,
        mcqCorrect,
        mcqAccuracy: mcqTotal ? Math.round((mcqCorrect / mcqTotal) * 100) : 0,
      },
    });
  } catch (error) {
    return fail(res, 500, "Failed to load student progress");
  }
}

async function getClassPosts(req, res) {
  try {
    const student = await getStudent(req);
    if (!student) return fail(res, 404, "Student profile not found");
    const { subjects } = await getStudentSubjects(student);
    const subjectNames = subjects.map((subject) => subject.name);
    const filter = { status: "approved" };

    if (subjectNames.length > 0) {
      filter.subject = { $in: subjectNames.map((name) => new RegExp(name, "i")) };
    }

    const posts = await ClassPost.find(filter)
      .populate("teacher", "name email phone")
      .sort({ approvedAt: -1, createdAt: -1 })
      .limit(12);

    return ok(res, posts);
  } catch (error) {
    return fail(res, 500, "Failed to load class posts");
  }
}

async function getDashboard(req, res) {
  try {
    const student = await getStudent(req);
    if (!student) return fail(res, 404, "Student profile not found");

    const { stream, subjects } = await getStudentSubjects(student);
    const subjectIds = subjects.map((subject) => subject._id);

    const [
      recentProgress,
      recommendedLessons,
      upcomingClasses,
      latestPastPapers,
      progressData,
      attempts,
    ] = await Promise.all([
      StudentProgress.find({ student: req.user.id })
        .populate("lesson", "title description subject")
        .populate("subject", "name")
        .sort({ lastAccessedAt: -1 })
        .limit(5),
      Lesson.find(subjectIds.length ? { subject: { $in: subjectIds } } : {})
        .select("title description subject createdAt")
        .populate("subject", "name")
        .sort({ createdAt: -1 })
        .limit(6),
      ClassPost.find({ status: "approved" })
        .populate("teacher", "name email phone")
        .sort({ approvedAt: -1, createdAt: -1 })
        .limit(5),
      PastPaper.find(subjectIds.length ? { subject: { $in: subjectIds } } : {})
        .populate("subject", "name")
        .sort({ examYear: -1, createdAt: -1 })
        .limit(6),
      StudentProgress.find({ student: req.user.id }),
      AssessmentAttempt.find({ student: req.user.id, questionType: "mcq" }).sort({ createdAt: -1 }).limit(20),
    ]);

    const progressAverage = progressData.length
      ? Math.round(progressData.reduce((sum, item) => sum + item.progressPercent, 0) / progressData.length)
      : 0;
    const mcqTotal = progressData.reduce((sum, item) => sum + item.mcqTotal, 0);
    const mcqCorrect = progressData.reduce((sum, item) => sum + item.mcqCorrect, 0);

    return ok(res, {
      profile: cleanUser(student),
      selectedStream: stream,
      subjects,
      recentLessons: recentProgress.map((item) => item.lesson).filter(Boolean),
      progressSummary: {
        averageProgress: progressAverage,
        completedLessons: progressData.filter((item) => item.completed).length,
        startedLessons: progressData.length,
      },
      recommendedLessons,
      upcomingClasses,
      latestPastPapers,
      mcqPerformance: {
        attempts: attempts.length,
        correct: mcqCorrect,
        total: mcqTotal,
        accuracy: mcqTotal ? Math.round((mcqCorrect / mcqTotal) * 100) : 0,
      },
      aiTips: [
        "ඔබේ දුර්වල තැන් හඳුනාගන්න MCQ ප්‍රතිඵල නැවත බලන්න.",
        "අද ඉගෙනගන්න පාඩම් වලින් එකක් තෝරාගෙන සටහන් revise කරන්න.",
        "පසුගිය ප්‍රශ්න පත්‍ර එකක් practice කර විභාග සූදානම වැඩි කරගන්න.",
      ],
    });
  } catch (error) {
    return fail(res, 500, "Failed to load student dashboard");
  }
}

async function getChatHistory(req, res) {
  try {
    const messages = await ChatMessage.find({ student: req.user.id })
      .sort({ createdAt: -1 })
      .limit(40);
    return ok(res, messages.reverse());
  } catch (error) {
    return fail(res, 500, "Failed to load chatbot history");
  }
}

async function postChatMessage(req, res) {
  try {
    const message = String(req.body.message || "").trim();
    if (!message) return fail(res, 400, "Message is required");

    const userMessage = await ChatMessage.create({
      student: req.user.id,
      role: "user",
      message,
      lesson: isObjectId(req.body.lessonId) ? req.body.lessonId : null,
      subject: isObjectId(req.body.subjectId) ? req.body.subjectId : null,
    });

    const assistantText =
      "AI සහාය ලබාගන්න: ඔබේ ප්‍රශ්නය lesson එකට සම්බන්ධ කරලා නැවත කියන්න. මම step by step A/L exam focused explanation එකක් දෙන්නම්.";

    const assistantMessage = await ChatMessage.create({
      student: req.user.id,
      role: "assistant",
      message: assistantText,
      lesson: userMessage.lesson,
      subject: userMessage.subject,
    });

    return ok(
      res,
      {
        userMessage,
        assistantMessage,
        reply: assistantText,
      },
      201
    );
  } catch (error) {
    return fail(res, 500, "Failed to save chatbot message");
  }
}

module.exports = {
  getProfile,
  updateProfile,
  getDashboard,
  getSubjects,
  getLessonsBySubject,
  getLessonDetails,
  submitMcq,
  getMcqsByLesson,
  submitMcqSet,
  getProgress,
  submitStructuredAnswer,
  getClassPosts,
  getChatHistory,
  postChatMessage,
};
