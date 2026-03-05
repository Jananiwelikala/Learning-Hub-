const Stream = require("./models/Stream");
const Subject = require("./models/Subject");
const Lesson = require("./models/Lesson");
const MCQ = require("./models/MCQ");

// Creates a small demo dataset for Biology -> Physics -> Measurements.
async function seedSampleData() {
  const stream = await Stream.findOneAndUpdate(
    { name: "Biology Stream" },
    { name: "Biology Stream", description: "Sample stream for demo content" },
    { new: true, upsert: true }
  );

  const subject = await Subject.findOneAndUpdate(
    { name: "Physics", stream: stream._id },
    { name: "Physics", stream: stream._id },
    { new: true, upsert: true }
  );

  const lesson = await Lesson.findOneAndUpdate(
    { title: "Measurements", subject: subject._id },
    {
      title: "Measurements",
      description: "First lesson with sample resources and MCQs.",
      subject: subject._id,
      videoLink: "https://www.youtube.com/watch?v=MlQ4zM49xS0",
      notesUrl:
        "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
      pastPaperMcqUrl:
        "https://www.africau.edu/images/default/sample.pdf",
      pastPaperStructuredUrl:
        "https://file-examples.com/wp-content/storage/2017/10/file-sample_150kB.pdf",
      pastPaperEssayUrl:
        "https://file-examples.com/wp-content/storage/2017/10/file-example_PDF_500_kB.pdf",
    },
    { new: true, upsert: true }
  );

  const existingCount = await MCQ.countDocuments({ lesson: lesson._id });
  if (existingCount > 0) return;

  await MCQ.insertMany([
    {
      lesson: lesson._id,
      question: "Which SI base unit is used to measure length?",
      options: ["Kilogram", "Meter", "Second", "Ampere"],
      correctOptionIndex: 1,
    },
    {
      lesson: lesson._id,
      question: "What is the least count of a standard laboratory ruler?",
      options: ["1 mm", "1 cm", "0.1 cm", "0.5 mm"],
      correctOptionIndex: 0,
    },
    {
      lesson: lesson._id,
      question: "A micrometer screw gauge is mainly used to measure:",
      options: [
        "Long distances",
        "Mass of objects",
        "Small thickness/diameter",
        "Time intervals",
      ],
      correctOptionIndex: 2,
    },
    {
      lesson: lesson._id,
      question: "Random errors can be reduced by:",
      options: [
        "Taking one measurement only",
        "Ignoring instruments",
        "Taking repeated readings and averaging",
        "Changing units",
      ],
      correctOptionIndex: 2,
    },
    {
      lesson: lesson._id,
      question: "Which quantity is measured using a stopwatch?",
      options: ["Temperature", "Time", "Force", "Electric current"],
      correctOptionIndex: 1,
    },
  ]);
}

module.exports = seedSampleData;
