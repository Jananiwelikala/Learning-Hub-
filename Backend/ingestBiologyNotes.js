require("dotenv").config();

const fs = require("fs/promises");
const path = require("path");
const mongoose = require("mongoose");
const { PDFParse } = require("pdf-parse");
const Subject = require("./models/Subject");
const Lesson = require("./models/Lesson");
const LessonResource = require("./models/LessonResource");

const NOTES_DIR = path.resolve(__dirname, "../frontend/public/notes");

const pdfLessonMap = [
  { file: "biology-lesson-1.pdf", lessonTitle: "Introduction to Biology", unit: "Biology Lesson 1" },
  {
    file: "biology-lesson-2.pdf",
    lessonId: "69fecad43aa30c9941247cd9",
    lessonTitle: "Chemical Basis of Life",
    unit: "Biology Lesson 2",
  },
  { file: "biology-lesson-3.pdf", lessonTitle: "Evolution and Diversity of Life", unit: "Biology Lesson 3" },
  { file: "biology-lesson-4.pdf", lessonTitle: "Plant Form and Function", unit: "Biology Lesson 4" },
  { file: "biology-lesson-5-part1.pdf", lessonTitle: "Animal Form and Function", unit: "Biology Lesson 5" },
  { file: "biology-lesson-5-part2.pdf", lessonTitle: "Animal Form and Function", unit: "Biology Lesson 5" },
];

function normalizeWhitespace(text) {
  return String(text || "").replace(/\s+/g, " ").trim();
}

function chunkText(text, maxLength = 1200, overlap = 180) {
  const cleaned = normalizeWhitespace(text);
  if (!cleaned) return [];

  const chunks = [];
  let start = 0;
  while (start < cleaned.length) {
    let end = Math.min(start + maxLength, cleaned.length);
    const sentenceBreak = cleaned.lastIndexOf(".", end);
    if (sentenceBreak > start + 400) end = sentenceBreak + 1;

    const content = cleaned.slice(start, end).trim();
    if (content.length > 80) chunks.push(content);

    if (end >= cleaned.length) break;
    start = Math.max(0, end - overlap);
  }

  return chunks;
}

function extractKeywords(text, limit = 12) {
  const stopWords = new Set([
    "the", "and", "for", "with", "that", "this", "from", "are", "was", "were",
    "you", "your", "lesson", "biology", "සඳහා", "සහ", "වල", "එක", "මෙම",
  ]);

  const counts = new Map();
  String(text || "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((word) => word.length >= 4 && !stopWords.has(word))
    .forEach((word) => counts.set(word, (counts.get(word) || 0) + 1));

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([word]) => word);
}

async function extractPdfText(filePath) {
  const buffer = await fs.readFile(filePath);
  const parser = new PDFParse({ data: buffer });
  const parsed = await parser.getText();
  await parser.destroy();
  return {
    text: parsed.text || "",
    pages: parsed.total || parsed.pages?.length || 0,
  };
}

async function ingestBiologyNotes() {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is missing in Backend/.env");
  }

  await mongoose.connect(process.env.MONGO_URI);

  const subject = await Subject.findOne({ name: /^Biology$/i });
  if (!subject) throw new Error("Biology subject not found");

  let totalChunks = 0;

  for (const item of pdfLessonMap) {
    const lesson = item.lessonId
      ? await Lesson.findOne({ _id: item.lessonId, subject: subject._id })
      : await Lesson.findOne({
          subject: subject._id,
          title: item.lessonTitle,
        });

    if (!lesson) {
      console.warn(`Skipping ${item.file}: lesson not found (${item.lessonTitle})`);
      continue;
    }

    const filePath = path.join(NOTES_DIR, item.file);
    const { text, pages } = await extractPdfText(filePath);
    const chunks = chunkText(text);

    await LessonResource.deleteMany({
      subject: subject._id,
      lesson: lesson._id,
      sourcePdf: `/notes/${item.file}`,
    });

    if (!chunks.length) {
      console.warn(`No text extracted from ${item.file}`);
      continue;
    }

    const docs = chunks.map((content, index) => ({
      subject: subject._id,
      lesson: lesson._id,
      unit: item.unit,
      title: `${lesson.title} - Notes ${index + 1}`,
      content,
      sourcePdf: `/notes/${item.file}`,
      pageRange: pages ? `Pages 1-${pages}` : "",
      keywords: extractKeywords(content),
    }));

    await LessonResource.insertMany(docs);
    totalChunks += docs.length;
    console.log(`${item.file}: saved ${docs.length} chunks`);
  }

  console.log(`Done. Saved ${totalChunks} Biology resource chunks.`);
}

ingestBiologyNotes()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
