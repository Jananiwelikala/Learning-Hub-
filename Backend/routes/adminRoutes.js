const express = require("express");
const bcrypt = require("bcryptjs");
const auth = require("../Middleware/auth");
const roleMiddleware = require("../Middleware/roleMiddleware");

const User = require("../models/User");
const Stream = require("../models/Stream");
const Subject = require("../models/Subject");
const Lesson = require("../models/Lesson");
const Note = require("../models/Note");
const PastPaper = require("../models/PastPaper");
const AssessmentQuestion = require("../models/AssessmentQuestion");
const MCQ = require("../models/MCQ");
const ClassPost = require("../models/ClassPost");

const router = express.Router();
router.use(auth, roleMiddleware("admin"));

function normalize(value) {
  return String(value || "").trim();
}

function normalizeNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseOptions(value) {
  if (Array.isArray(value)) return value.map((item) => normalize(item)).filter(Boolean);
  return normalize(value)
    .split("\n")
    .map((item) => item.replace(/^[A-Da-d][).:-]?\s*/, "").trim())
    .filter(Boolean);
}

function normalizeId(doc) {
  if (!doc) return doc;
  const obj = typeof doc.toObject === "function" ? doc.toObject() : doc;
  return { ...obj, id: obj._id };
}

async function ensureSubject(subjectId) {
  if (!subjectId) return null;
  return Subject.findById(subjectId);
}

async function ensureLesson(lessonId) {
  if (!lessonId) return null;
  return Lesson.findById(lessonId);
}

router.get("/dashboard", async (req, res) => {
  try {
    const [students, teachers, admins, streams, subjects, lessons, notes, pastPapers, questions, mcqs, pendingPosts, approvedPosts, rejectedPosts] = await Promise.all([
      User.countDocuments({ role: "student" }),
      User.countDocuments({ role: "teacher" }),
      User.countDocuments({ role: "admin" }),
      Stream.countDocuments(),
      Subject.countDocuments(),
      Lesson.countDocuments(),
      Note.countDocuments(),
      PastPaper.countDocuments(),
      AssessmentQuestion.countDocuments(),
      MCQ.countDocuments(),
      ClassPost.countDocuments({ status: "pending" }),
      ClassPost.countDocuments({ status: "approved" }),
      ClassPost.countDocuments({ status: "rejected" }),
    ]);

    res.json({
      students,
      teachers,
      admins,
      streams,
      subjects,
      lessons,
      videos: await Lesson.aggregate([{ $project: { count: { $size: { $ifNull: ["$videos", []] } } } }, { $group: { _id: null, total: { $sum: "$count" } } }]).then((r) => r[0]?.total || 0),
      notes,
      pastPapers,
      questions: questions + mcqs,
      pendingPosts,
      approvedPosts,
      rejectedPosts,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/users", async (req, res) => {
  try {
    const filter = {};
    if (req.query.role) filter.role = req.query.role;
    const users = await User.find(filter).select("-password").populate("streamId", "name").sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/users", async (req, res) => {
  try {
    const { name, email, password, role = "student", phone = "", streamId = null, stream = "", subject = "" } = req.body;
    if (!normalize(name) || !normalize(email) || !normalize(password)) {
      return res.status(400).json({ message: "Name, email and password are required" });
    }
    if (!["student", "teacher", "admin"].includes(role)) return res.status(400).json({ message: "Invalid role" });
    const exists = await User.findOne({ email: normalize(email).toLowerCase() });
    if (exists) return res.status(400).json({ message: "Email already exists" });
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ name: normalize(name), email: normalize(email).toLowerCase(), password: hashedPassword, role, phone, streamId: streamId || null, stream, subject });
    res.status(201).json(normalizeId(user.toObject ? user.toObject() : user));
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.put("/users/:id", async (req, res) => {
  try {
    const updates = { ...req.body };
    delete updates.password;
    if (updates.email) updates.email = normalize(updates.email).toLowerCase();
    if (updates.role && !["student", "teacher", "admin"].includes(updates.role)) return res.status(400).json({ message: "Invalid role" });
    if (req.body.password) updates.password = await bcrypt.hash(req.body.password, 10);
    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true }).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.delete("/users/:id", async (req, res) => {
  try {
    if (String(req.params.id) === String(req.user.id)) return res.status(400).json({ message: "You cannot delete your own account" });
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "User deleted" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.get("/streams", async (req, res) => {
  const items = await Stream.find().sort({ order: 1, createdAt: -1 });
  res.json(items);
});

router.post("/streams", async (req, res) => {
  try {
    const item = await Stream.create({
      name: normalize(req.body.name),
      sinhalaName: normalize(req.body.sinhalaName),
      description: normalize(req.body.description),
      code: normalize(req.body.code) || undefined,
      icon: normalize(req.body.icon),
      color: normalize(req.body.color),
      order: normalizeNumber(req.body.order),
    });
    res.status(201).json(item);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

router.put("/streams/:id", async (req, res) => {
  try {
    const item = await Stream.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.json(item);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

router.delete("/streams/:id", async (req, res) => {
  try {
    const subjectCount = await Subject.countDocuments({ stream: req.params.id });
    if (subjectCount) return res.status(400).json({ message: "Delete or move related subjects first" });
    await Stream.findByIdAndDelete(req.params.id);
    res.json({ message: "Stream deleted" });
  } catch (err) { res.status(400).json({ message: err.message }); }
});

router.get("/subjects", async (req, res) => {
  const filter = req.query.streamId ? { stream: req.query.streamId } : {};
  const items = await Subject.find(filter).populate("stream", "name sinhalaName").sort({ order: 1, createdAt: -1 });
  res.json(items);
});

router.post("/subjects", async (req, res) => {
  try {
    const streamId = req.body.streamId || req.body.stream;
    const stream = await Stream.findById(streamId);
    if (!stream) return res.status(400).json({ message: "Stream is required" });
    const item = await Subject.create({
      name: normalize(req.body.name),
      sinhalaName: normalize(req.body.sinhalaName),
      code: normalize(req.body.code),
      icon: normalize(req.body.icon),
      color: normalize(req.body.color),
      papersCount: normalizeNumber(req.body.papersCount),
      studentsCount: normalizeNumber(req.body.studentsCount),
      isCore: req.body.isCore !== false,
      isOptional: req.body.isOptional === true,
      order: normalizeNumber(req.body.order),
      stream: streamId,
    });
    res.status(201).json(await item.populate("stream", "name sinhalaName"));
  } catch (err) { res.status(400).json({ message: err.message }); }
});

router.put("/subjects/:id", async (req, res) => {
  try {
    const updates = { ...req.body };
    if (updates.streamId) { updates.stream = updates.streamId; delete updates.streamId; }
    const item = await Subject.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true }).populate("stream", "name sinhalaName");
    res.json(item);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

router.delete("/subjects/:id", async (req, res) => {
  try {
    const lessonCount = await Lesson.countDocuments({ subject: req.params.id });
    if (lessonCount) return res.status(400).json({ message: "Delete related lessons first" });
    await Subject.findByIdAndDelete(req.params.id);
    res.json({ message: "Subject deleted" });
  } catch (err) { res.status(400).json({ message: err.message }); }
});

router.get("/lessons", async (req, res) => {
  const filter = req.query.subjectId ? { subject: req.query.subjectId } : {};
  const items = await Lesson.find(filter).populate({ path: "subject", select: "name stream", populate: { path: "stream", select: "name" } }).sort({ order: 1, createdAt: -1 });
  res.json(items);
});

router.post("/lessons", async (req, res) => {
  try {
    const subject = await ensureSubject(req.body.subjectId || req.body.subject);
    if (!subject) return res.status(400).json({ message: "Subject is required" });
    const item = await Lesson.create({
      title: normalize(req.body.title),
      sinhalaTitle: normalize(req.body.sinhalaTitle),
      description: normalize(req.body.description),
      icon: normalize(req.body.icon),
      order: normalizeNumber(req.body.order),
      durationMinutes: normalizeNumber(req.body.durationMinutes),
      videoTitle: normalize(req.body.videoTitle),
      videoLink: normalize(req.body.videoLink || req.body.videoUrl),
      videoUrl: normalize(req.body.videoUrl || req.body.videoLink),
      notesUrl: normalize(req.body.notesUrl),
      pastPaperMcqUrl: normalize(req.body.pastPaperMcqUrl),
      pastPaperStructuredUrl: normalize(req.body.pastPaperStructuredUrl),
      pastPaperEssayUrl: normalize(req.body.pastPaperEssayUrl),
      subject: subject._id,
      createdBy: req.user.id,
    });
    res.status(201).json(await item.populate({ path: "subject", select: "name stream", populate: { path: "stream", select: "name" } }));
  } catch (err) { res.status(400).json({ message: err.message }); }
});

router.put("/lessons/:id", async (req, res) => {
  try {
    const updates = { ...req.body };
    if (updates.subjectId) { updates.subject = updates.subjectId; delete updates.subjectId; }
    const item = await Lesson.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true }).populate({ path: "subject", select: "name stream", populate: { path: "stream", select: "name" } });
    res.json(item);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

router.delete("/lessons/:id", async (req, res) => {
  try {
    await Promise.all([
      Note.deleteMany({ lesson: req.params.id }),
      PastPaper.deleteMany({ lesson: req.params.id }),
      AssessmentQuestion.deleteMany({ lesson: req.params.id }),
      MCQ.deleteMany({ lesson: req.params.id }),
      Lesson.findByIdAndDelete(req.params.id),
    ]);
    res.json({ message: "Lesson and related learning items deleted" });
  } catch (err) { res.status(400).json({ message: err.message }); }
});

router.get("/videos", async (req, res) => {
  const lessons = await Lesson.find().populate("subject", "name").sort({ createdAt: -1 }).lean();
  const videos = [];
  lessons.forEach((lesson) => {
    if (lesson.videoLink || lesson.videoUrl) {
      videos.push({ id: `${lesson._id}:main`, lessonId: lesson._id, lessonTitle: lesson.title, subject: lesson.subject, title: lesson.videoTitle || lesson.title, url: lesson.videoLink || lesson.videoUrl, description: lesson.description || "", isMain: true });
    }
    (lesson.videos || []).forEach((video, index) => {
      videos.push({ id: `${lesson._id}:${index}`, lessonId: lesson._id, lessonTitle: lesson.title, subject: lesson.subject, title: video.title || `Video ${index + 1}`, url: video.url || video.videoUrl || video.link || "", description: video.description || "", duration: video.duration || "" });
    });
  });
  res.json(videos);
});

router.post("/videos", async (req, res) => {
  try {
    const lesson = await ensureLesson(req.body.lessonId || req.body.lesson);
    if (!lesson) return res.status(400).json({ message: "Lesson is required" });
    lesson.videos = lesson.videos || [];
    lesson.videos.push({ title: normalize(req.body.title), url: normalize(req.body.url), description: normalize(req.body.description), duration: normalize(req.body.duration) });
    lesson.videoCount = lesson.videos.length + (lesson.videoLink ? 1 : 0);
    await lesson.save();
    res.status(201).json({ message: "Video added", lesson });
  } catch (err) { res.status(400).json({ message: err.message }); }
});

router.put("/videos/:videoId", async (req, res) => {
  try {
    const [lessonId, indexText] = req.params.videoId.split(":");
    const lesson = await Lesson.findById(lessonId);
    if (!lesson) return res.status(404).json({ message: "Lesson not found" });
    if (indexText === "main") {
      lesson.videoTitle = normalize(req.body.title);
      lesson.videoLink = normalize(req.body.url);
      lesson.videoUrl = normalize(req.body.url);
      lesson.description = normalize(req.body.description) || lesson.description;
    } else {
      const index = Number(indexText);
      if (!lesson.videos?.[index]) return res.status(404).json({ message: "Video not found" });
      lesson.videos[index] = { ...lesson.videos[index], title: normalize(req.body.title), url: normalize(req.body.url), description: normalize(req.body.description), duration: normalize(req.body.duration) };
    }
    await lesson.save();
    res.json({ message: "Video updated", lesson });
  } catch (err) { res.status(400).json({ message: err.message }); }
});

router.delete("/videos/:videoId", async (req, res) => {
  try {
    const [lessonId, indexText] = req.params.videoId.split(":");
    const lesson = await Lesson.findById(lessonId);
    if (!lesson) return res.status(404).json({ message: "Lesson not found" });
    if (indexText === "main") {
      lesson.videoTitle = "";
      lesson.videoLink = "";
      lesson.videoUrl = "";
    } else {
      const index = Number(indexText);
      lesson.videos.splice(index, 1);
    }
    lesson.videoCount = (lesson.videos || []).length + (lesson.videoLink ? 1 : 0);
    await lesson.save();
    res.json({ message: "Video deleted" });
  } catch (err) { res.status(400).json({ message: err.message }); }
});

router.get("/notes", async (req, res) => {
  const filter = req.query.lessonId ? { lesson: req.query.lessonId } : {};
  const items = await Note.find(filter).populate("lesson", "title").populate("subject", "name").sort({ order: 1, createdAt: -1 });
  res.json(items);
});

router.post("/notes", async (req, res) => {
  try {
    const lesson = await ensureLesson(req.body.lessonId || req.body.lesson);
    if (!lesson) return res.status(400).json({ message: "Lesson is required" });
    const subjectId = req.body.subjectId || req.body.subject || lesson.subject;
    const item = await Note.create({ title: normalize(req.body.title), description: normalize(req.body.description), fileUrl: normalize(req.body.fileUrl), pages: normalizeNumber(req.body.pages), fileSize: normalize(req.body.fileSize), order: normalizeNumber(req.body.order), lesson: lesson._id, subject: subjectId, createdBy: req.user.id });
    lesson.notesCount = await Note.countDocuments({ lesson: lesson._id });
    lesson.notesUrl = item.fileUrl || lesson.notesUrl;
    await lesson.save();
    res.status(201).json(await item.populate("lesson", "title"));
  } catch (err) { res.status(400).json({ message: err.message }); }
});

router.put("/notes/:id", async (req, res) => {
  try {
    const updates = { ...req.body };
    if (updates.lessonId) { updates.lesson = updates.lessonId; delete updates.lessonId; }
    if (updates.subjectId) { updates.subject = updates.subjectId; delete updates.subjectId; }
    const item = await Note.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true }).populate("lesson", "title").populate("subject", "name");
    res.json(item);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

router.delete("/notes/:id", async (req, res) => {
  try {
    const item = await Note.findByIdAndDelete(req.params.id);
    if (item) await Lesson.findByIdAndUpdate(item.lesson, { $inc: { notesCount: -1 } });
    res.json({ message: "Note deleted" });
  } catch (err) { res.status(400).json({ message: err.message }); }
});

router.get("/past-papers", async (req, res) => {
  const filter = {};
  if (req.query.lessonId) filter.lesson = req.query.lessonId;
  if (req.query.subjectId) filter.subject = req.query.subjectId;
  const items = await PastPaper.find(filter).populate("lesson", "title").populate("subject", "name").sort({ examYear: -1, createdAt: -1 });
  res.json(items);
});

router.post("/past-papers", async (req, res) => {
  try {
    const subjectId = req.body.subjectId || req.body.subject;
    const subject = await ensureSubject(subjectId);
    if (!subject) return res.status(400).json({ message: "Subject is required" });
    const item = await PastPaper.create({ title: normalize(req.body.title), paperType: req.body.paperType || "full", examYear: normalizeNumber(req.body.examYear, new Date().getFullYear()), fileUrl: normalize(req.body.fileUrl), section: normalize(req.body.section), questionsCount: normalizeNumber(req.body.questionsCount), durationMinutes: normalizeNumber(req.body.durationMinutes), difficulty: req.body.difficulty || "Medium", lesson: req.body.lessonId || req.body.lesson || null, subject: subject._id, createdBy: req.user.id });
    if (item.lesson) await Lesson.findByIdAndUpdate(item.lesson, { $inc: { pastPaperCount: 1 } });
    res.status(201).json(await item.populate("lesson", "title"));
  } catch (err) { res.status(400).json({ message: err.message }); }
});

router.put("/past-papers/:id", async (req, res) => {
  try {
    const updates = { ...req.body };
    if (updates.lessonId) { updates.lesson = updates.lessonId; delete updates.lessonId; }
    if (updates.subjectId) { updates.subject = updates.subjectId; delete updates.subjectId; }
    const item = await PastPaper.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true }).populate("lesson", "title").populate("subject", "name");
    res.json(item);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

router.delete("/past-papers/:id", async (req, res) => {
  try { await PastPaper.findByIdAndDelete(req.params.id); res.json({ message: "Past paper deleted" }); } catch (err) { res.status(400).json({ message: err.message }); }
});

router.get("/questions", async (req, res) => {
  const filter = {};
  if (req.query.lessonId) filter.lesson = req.query.lessonId;
  if (req.query.type) filter.questionType = req.query.type;
  const questions = await AssessmentQuestion.find(filter).populate("lesson", "title subject").sort({ examYear: -1, createdAt: -1 }).lean();
  const mcqs = await MCQ.find(req.query.lessonId ? { lesson: req.query.lessonId } : {}).populate("lesson", "title subject").sort({ examYear: -1, createdAt: -1 }).lean();
  res.json([
    ...questions.map((q) => ({ ...q, sourceModel: "AssessmentQuestion" })),
    ...mcqs.map((q) => ({ ...q, questionType: "mcq", prompt: q.questionText || q.question, sourceModel: "MCQ" })),
  ]);
});

router.post("/questions", async (req, res) => {
  try {
    const lesson = await ensureLesson(req.body.lessonId || req.body.lesson);
    if (!lesson) return res.status(400).json({ message: "Lesson is required" });
    const questionType = req.body.questionType || "mcq";
    if (!["mcq", "structured", "essay"].includes(questionType)) return res.status(400).json({ message: "Invalid question type" });
    const options = parseOptions(req.body.options);
    const correctOptionIndex = normalizeNumber(req.body.correctOptionIndex, 0);
    const item = await AssessmentQuestion.create({ lesson: lesson._id, questionType, prompt: normalize(req.body.prompt || req.body.questionText), options, correctOptionIndex, maxMarks: normalizeNumber(req.body.maxMarks, questionType === "mcq" ? 1 : 10), examYear: normalizeNumber(req.body.examYear, new Date().getFullYear()), sourceLabel: normalize(req.body.sourceLabel) || "A/L Past Paper", aiReady: req.body.aiReady !== false });
    if (questionType === "mcq") {
      await MCQ.create({ lesson: lesson._id, subject: lesson.subject, questionText: item.prompt, question: item.prompt, options, correctOptionIndex, correctAnswer: options[correctOptionIndex] || String(correctOptionIndex), explanation: normalize(req.body.explanation), examYear: item.examYear, sourceLabel: item.sourceLabel });
    }
    res.status(201).json(item);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

router.put("/questions/:id", async (req, res) => {
  try {
    const updates = { ...req.body };
    if (updates.lessonId) { updates.lesson = updates.lessonId; delete updates.lessonId; }
    if (typeof updates.options === "string") updates.options = parseOptions(updates.options);
    const item = await AssessmentQuestion.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!item) {
      const mcq = await MCQ.findByIdAndUpdate(req.params.id, { questionText: updates.prompt || updates.questionText, question: updates.prompt || updates.questionText, options: updates.options, correctOptionIndex: updates.correctOptionIndex, explanation: updates.explanation, examYear: updates.examYear }, { new: true, runValidators: true });
      if (!mcq) return res.status(404).json({ message: "Question not found" });
      return res.json(mcq);
    }
    res.json(item);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

router.delete("/questions/:id", async (req, res) => {
  try {
    await Promise.all([AssessmentQuestion.findByIdAndDelete(req.params.id), MCQ.findByIdAndDelete(req.params.id)]);
    res.json({ message: "Question deleted" });
  } catch (err) { res.status(400).json({ message: err.message }); }
});

router.get("/class-posts", async (req, res) => {
  const filter = req.query.status ? { status: req.query.status } : {};
  const posts = await ClassPost.find(filter).populate("teacher", "name email phone").populate("approvedBy", "name").sort({ createdAt: -1 });
  res.json(posts);
});

router.put("/class-posts/:id/review", async (req, res) => {
  try {
    const { status, rejectionReason = "" } = req.body;
    if (!["approved", "rejected", "pending", "draft"].includes(status)) return res.status(400).json({ message: "Invalid status" });
    const post = await ClassPost.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });
    post.status = status;
    if (["approved", "rejected"].includes(status)) {
      post.approvedBy = req.user.id;
      post.approvedAt = new Date();
    }
    post.rejectionReason = status === "rejected" ? rejectionReason : "";
    await post.save();
    await post.populate("teacher", "name email phone");
    res.json(post);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

router.delete("/class-posts/:id", async (req, res) => {
  try { await ClassPost.findByIdAndDelete(req.params.id); res.json({ message: "Class post deleted" }); } catch (err) { res.status(400).json({ message: err.message }); }
});

module.exports = router;
