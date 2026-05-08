require("dotenv").config();
const mongoose = require("mongoose");
const Stream = require("./models/Stream");
const Subject = require("./models/Subject");
const Lesson = require("./models/Lesson");
const MCQ = require("./models/MCQ");
const AssessmentQuestion = require("./models/AssessmentQuestion");
const Note = require("./models/Note");
const PastPaper = require("./models/PastPaper");
const StudentProgress = require("./models/StudentProgress");

const legacyLessonQuery = {
  $or: [
    { title: { $in: ["Cell Biology", "Introduction to Cell Biology", "Evolution", "Human Biology", "Plant Biology"] } },
    {
      title: { $in: ["Genetics", "Ecology"] },
      description: /lesson collection for A\/L Biology students/i,
    },
  ],
};

async function cleanupLegacyLessons() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    throw new Error("MONGO_URI is missing in Backend/.env");
  }

  await mongoose.connect(mongoUri);

  const stream = await Stream.findOne({ name: /^Bio Science$/i });
  if (!stream) {
    console.log("Bio Science stream not found. Nothing to clean.");
    return;
  }

  const subject = await Subject.findOne({ name: /^Biology$/i, stream: stream._id });
  if (!subject) {
    console.log("Biology subject not found. Nothing to clean.");
    return;
  }

  const lessons = await Lesson.find({ subject: subject._id, ...legacyLessonQuery }).select("_id title");
  const lessonIds = lessons.map((lesson) => lesson._id);

  if (lessonIds.length === 0) {
    console.log("No legacy Biology lessons found.");
    return;
  }

  await Promise.all([
    Note.deleteMany({ lesson: { $in: lessonIds } }),
    PastPaper.deleteMany({ lesson: { $in: lessonIds } }),
    MCQ.deleteMany({ lesson: { $in: lessonIds } }),
    AssessmentQuestion.deleteMany({ lesson: { $in: lessonIds } }),
    StudentProgress.deleteMany({ lesson: { $in: lessonIds } }),
  ]);

  const deletedLessons = await Lesson.deleteMany({ _id: { $in: lessonIds } });
  console.log(`Deleted ${deletedLessons.deletedCount} legacy Biology lessons:`);
  lessons.forEach((lesson) => console.log(`- ${lesson.title}`));
}

cleanupLegacyLessons()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
