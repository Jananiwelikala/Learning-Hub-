const mongoose = require("mongoose");
const fs = require("fs/promises");
const path = require("path");
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
const {
  findRelevantLessonResources,
  buildResourceContext,
} = require("../utils/lessonResourceSearch");

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const BIOLOGY_UNIT_2_PDF_PATH = path.resolve(__dirname, "../../frontend/public/notes/biology-lesson-2.pdf");

let biologyUnit2PdfBase64 = null;

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
  if (value && typeof value === "object") {
    return String(value.label ?? value.value ?? value.text ?? "").trim().toLowerCase();
  }
  return String(value ?? "").trim().toLowerCase();
}

function getOptionLabel(option, index) {
  if (option && typeof option === "object") {
    return String(option.label ?? option.value ?? index + 1);
  }
  return String(index + 1);
}

function getOptionText(option) {
  if (option && typeof option === "object") {
    return String(option.text ?? option.label ?? option.value ?? "");
  }
  return String(option ?? "");
}

function getCorrectAnswer(mcq) {
  if (mcq.correctAnswer !== undefined && mcq.correctAnswer !== null && mcq.correctAnswer !== "") {
    return mcq.correctAnswer;
  }

  if (typeof mcq.correctOptionIndex === "number" && Array.isArray(mcq.options)) {
    return getOptionLabel(mcq.options[mcq.correctOptionIndex], mcq.correctOptionIndex);
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

  const optionIndex = options.findIndex((option, index) =>
    normalizeAnswer(option) === selected ||
    normalizeAnswer(getOptionLabel(option, index)) === selected ||
    normalizeAnswer(getOptionText(option)) === selected
  );
  if (optionIndex >= 0 && normalizeAnswer(optionIndex) === correct) {
    return true;
  }

  const letters = ["a", "b", "c", "d", "e"];
  const selectedLetterIndex = letters.indexOf(selected);
  if (selectedLetterIndex >= 0 && normalizeAnswer(getOptionText(options[selectedLetterIndex])) === correct) {
    return true;
  }

  const correctLetterIndex = letters.indexOf(correct);
  if (correctLetterIndex >= 0 && normalizeAnswer(getOptionText(options[correctLetterIndex])) === selected) {
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
    options: (mcq.options || []).map((option, index) => ({
      label: getOptionLabel(option, index),
      text: getOptionText(option),
    })),
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
    subjects: user.subjects || [],
    createdAt: user.createdAt,
  };
}

function buildNoteBasedReply(resources = []) {
  if (!resources.length) {
    return [
      "මට මේ ප්‍රශ්නයට අදාල Biology notes context එකක් හමු වුණේ නැහැ.",
      "සාමාන්‍ය පිළිතුරක්: කරුණාකර ප්‍රශ්නය lesson එකට අදාල keywords සමඟ නැවත අහන්න. අවශ්‍ය නම් ගුරුවරයෙකුගෙන් තහවුරු කරගන්න.",
    ].join(" ");
  }

  const cleanResources = resources.filter((resource) => resource.type === "clean-summary");
  if (cleanResources.length) {
    const primary = cleanResources[0];
    return primary.content;
  }

  const points = resources
    .slice(0, 2)
    .map((resource) => {
      const firstSentences = String(resource.content || "")
        .replace(/\s+/g, " ")
        .split(/(?<=[.!?])\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .join(" ");
      return firstSentences || String(resource.content || "").replace(/\s+/g, " ").slice(0, 360);
    })
    .filter(Boolean);

  const sources = resources
    .map((resource) => resource.sourcePdf)
    .filter(Boolean)
    .slice(0, 2)
    .join(", ");

  return [
    "ඔබේ notes වලින් හමු වූ කරුණු අනුව:",
    points.join(" "),
    sources ? `Source: ${sources}` : "",
  ]
    .filter(Boolean)
    .join(" ");
}

const LESSON_2_ONLY_REPLY =
  "මෙම chatbot prototype එක දැනට Biology Unit 2 සඳහා පමණක් සකසා ඇත. කරුණාකර Unit 2 සම්බන්ධ ප්‍රශ්නයක් අහන්න.";

const STUDY_ASSISTANT_ONLY_REPLY =
  "මම Learning Hub A/L study assistant කෙනෙක්. කරුණාකර A/L Biology Unit 2 හෝ platform use කිරීම ගැන ප්‍රශ්නයක් අහන්න.";

function includesAny(text, words) {
  return words.some((word) => text.includes(word));
}

function getPlatformHelpReply(message) {
  const text = String(message || "").toLowerCase();

  if (includesAny(text, ["lesson", "lessons", "පාඩම්", "පාඩම"])) {
    return "Lessons බලන්න Subjects → lesson එක click කරන්න.";
  }

  if (includesAny(text, ["note", "notes", "pdf", "download", "සටහන්", "බාගත"])) {
    return "Notes download කරන්න lesson page එකෙන් PDF button click කරන්න.";
  }

  if (includesAny(text, ["mcq", "quiz", "practice", "පුහුණුව"])) {
    return "MCQ practice කරන්න Past Papers section එකට යන්න.";
  }

  if (includesAny(text, ["past paper", "past papers", "paper", "papers", "ප්‍රශ්න පත්‍ර"])) {
    return "Past papers බලන්න Past Papers menu එකට යන්න.";
  }

  if (includesAny(text, ["video", "videos", "වීඩියෝ"])) {
    return "Video lessons බලන්න lesson page එකේ Video Lesson section එක use කරන්න.";
  }

  if (includesAny(text, ["class", "classes", "teacher", "ගුරු", "පන්තිය", "පන්ති"])) {
    return "Class details බලන්න Classes menu එකට යන්න.";
  }

  return "";
}

function getDirectUnit2Reply(message) {
  const text = String(message || "").toLowerCase();
  if (text.includes("atp") && (text.includes("full form") || text.includes("stands for"))) {
    return "ATP හි සම්පූර්ණ නම Adenosine Triphosphate ය. සිංහලෙන් එය ඇඩිනොසින් ට්‍රයිෆොස්ෆේට් ලෙස හඳුන්වයි.";
  }

  return "";
}

function getRecentChatContext(req, currentMessage) {
  const explicitHistory = Array.isArray(req.body.history)
    ? req.body.history
        .map((item) => `${item.role || "message"}: ${item.text || item.message || ""}`.trim())
        .filter(Boolean)
        .slice(-6)
        .join("\n")
    : "";

  const combined = [explicitHistory, currentMessage].filter(Boolean).join("\n");
  return {
    explicitHistory,
    combinedMessage: combined || currentMessage,
  };
}

function resolveFollowUpMessage(message, historyText = "") {
  const text = String(message || "").toLowerCase();
  const context = String(historyText || "").toLowerCase();

  const asksPhosphate =
    text.includes("pospate") ||
    text.includes("pospet") ||
    text.includes("phosphate") ||
    text.includes("akabanika") ||
    text.includes("\u0d85\u0d9a\u0dcf\u0db6\u0db1\u0dd2\u0d9a") ||
    text.includes("\u0db4\u0ddc\u0dc3\u0dca\u0dc6\u0dda\u0da7\u0dca");

  if (asksPhosphate && (context.includes("atp") || context.includes("adp") || context.includes("pi"))) {
    return `ATP ADP Pi අකාබනික පොස්ෆේට් ගැන follow-up: ${message}`;
  }

  return message;
}

function getFollowUpDirectReply(message, historyText = "") {
  const text = String(message || "").toLowerCase();
  const context = String(historyText || "").toLowerCase();
  const asksPhosphate =
    text.includes("pospate") ||
    text.includes("pospet") ||
    text.includes("phosphate") ||
    text.includes("akabanika") ||
    text.includes("\u0d85\u0d9a\u0dcf\u0db6\u0db1\u0dd2\u0d9a") ||
    text.includes("\u0db4\u0ddc\u0dc3\u0dca\u0dc6\u0dda\u0da7\u0dca");

  if (asksPhosphate && (context.includes("atp") || context.includes("adp") || context.includes("pi"))) {
    return [
      "අකාබනික පොස්ෆේට් (Pi) යනු ATP බිඳීමේදී ADP සමඟ වෙන් වන පොස්ෆේට් කණ්ඩයයි.",
      "ATP → ADP + Pi ලෙස බිඳෙන විට මෙම Pi වෙන්වීමත් සමඟ ශක්තිය නිදහස් වේ.",
      "එම නිදහස් වන ශක්තිය සෛලීය ක්‍රියාවලීන් සඳහා භාවිතා වේ.",
    ].join("\n");
  }

  return "";
}

function makeSinhalaMediumFallback(resources = []) {
  const primary = resources.find((resource) => resource.type === "clean-summary") || resources[0];
  if (!primary) return "";

  const title = String(primary.title || "").toLowerCase();
  if (title.includes("atp -")) {
    return [
      "ATP (Adenosine Triphosphate / ඇඩිනොසින් ට්‍රයිෆොස්ෆේට්) යනු සෛලයේ ප්‍රධාන ශක්ති වාහක අණුවයි.",
      "එය ඇඩිනීන්, රයිබෝස් සීනි සහ පොස්ෆේට් කණ්ඩ 3කින් සමන්විත වේ.",
      "ATP බිඳී ADP + Pi බවට පත්වන විට ශක්තිය නිදහස් වන අතර, එම ශක්තිය සෛලීය ක්‍රියාවලීන් සඳහා භාවිතා වේ.",
    ].join("\n");
  }

  if (title.includes("hydrolysis")) {
    return [
      "ATP ජල විච්ඡේදනය යනු ATP අණුව ජලය සමඟ ප්‍රතික්‍රියා කර ADP සහ අකාබනික පොස්ෆේට් (Pi) බවට බිඳීමයි.",
      "මෙම ක්‍රියාවේදී ශක්තිය නිදහස් වේ.",
      "එම ශක්තිය සෛලයේ ක්‍රියාකාරකම්, ද්‍රව්‍ය ප්‍රවාහනය සහ සංශ්ලේෂණ ක්‍රියාවලීන් සඳහා භාවිතා වේ.",
    ].join("\n");
  }

  if (title.includes("enzyme denaturation")) {
    return [
      "එන්සයිම විකෘති වීම යනු එන්සයිමයේ ත්‍රිමාන හැඩය වෙනස් වීමයි.",
      "උෂ්ණත්වය වැඩි වීම හෝ pH අගය අතිශය ලෙස වෙනස් වීම නිසා සක්‍රීය ස්ථානයේ හැඩය වෙනස් විය හැක.",
      "එවිට උපස්තරය නිවැරදිව බැඳෙන්නේ නැති නිසා එන්සයිම ක්‍රියාකාරිත්වය අඩු වේ හෝ නවතී.",
    ].join("\n");
  }

  if (title.includes("temperature")) {
    return [
      "උෂ්ණත්වය එන්සයිම ක්‍රියාකාරිත්වයට බලපායි.",
      "උෂ්ණත්වය ඉහළ යන විට අණු චලනය වැඩි වී ප්‍රතික්‍රියා වේගය මුලින් වැඩි වේ.",
      "නමුත් ප්‍රශස්ත උෂ්ණත්වය ඉක්මවා ගිය විට සක්‍රීය ස්ථානය වෙනස් වී එන්සයිමය විකෘති වන නිසා ක්‍රියාකාරිත්වය අඩු වේ.",
    ].join("\n");
  }

  if (title.includes("ph effect")) {
    return [
      "pH අගය එන්සයිමයේ සක්‍රීය ස්ථානයේ හැඩයට බලපායි.",
      "සෑම එන්සයිමයකටම ප්‍රශස්ත pH අගයක් ඇති අතර එහිදී ක්‍රියාකාරිත්වය වැඩිම වේ.",
      "pH අගය අධික ලෙස වෙනස් වුවහොත් සක්‍රීය ස්ථානය වෙනස් වී එන්සයිම ක්‍රියාකාරිත්වය අඩු වේ.",
    ].join("\n");
  }

  if (title.includes("competitive")) {
    return [
      "තරඟකාරී අවහිරකයක් උපස්තරයට සමාන හැඩයක් ඇති නිසා සක්‍රීය ස්ථානයට බැඳීමට තරඟ කරයි.",
      "එය සක්‍රීය ස්ථානය අල්ලා ගත් විට උපස්තරය බැඳීමට නොහැකි වේ.",
      "උපස්තර සාන්ද්‍රණය වැඩි කළ විට මෙම අවහිරකයේ බලපෑම අඩු කළ හැක.",
    ].join("\n");
  }

  if (title.includes("non-competitive")) {
    return [
      "තරඟකාරී නොවන අවහිරකයක් සක්‍රීය ස්ථානයට නොව වෙනත් ස්ථානයකට බැඳේ.",
      "එවිට එන්සයිමයේ හැඩය වෙනස් වී සක්‍රීය ස්ථානයද වෙනස් වේ.",
      "උපස්තර සාන්ද්‍රණය වැඩි කළත් මෙම අවහිරකයේ බලපෑම සාමාන්‍යයෙන් අඩු නොවේ.",
    ].join("\n");
  }

  if (title.includes("enzyme activity")) {
    return [
      "එන්සයිම ක්‍රියාකාරිත්වය යනු එන්සයිමයක් ප්‍රතික්‍රියාවක් වේගවත් කරන මට්ටමයි.",
      "එය උපස්තර සාන්ද්‍රණය, එන්සයිම සාන්ද්‍රණය, උෂ්ණත්වය, pH සහ අවහිරක මත රඳා පවතී.",
      "සක්‍රීය ස්ථාන සියල්ල පිරුණු විට ප්‍රතික්‍රියා වේගය උපරිම අගයකට පැමිණ තවදුරටත් වැඩි නොවේ.",
    ].join("\n");
  }

  if (title.includes("enzymes")) {
    return [
      "එන්සයිම යනු ජීව සෛල තුළ ඇති ජීව උත්ප්‍රේරක වේ.",
      "ඒවා ප්‍රතික්‍රියාවකට අවශ්‍ය සක්‍රීයකරණ ශක්තිය අඩු කර ප්‍රතික්‍රියා වේගය වැඩි කරයි.",
      "එන්සයිමයට විශේෂ සක්‍රීය ස්ථානයක් ඇති අතර, එයට ගැලපෙන උපස්තරය බැඳී එන්සයිම-උපස්තර සංකීර්ණය සෑදේ.",
    ].join("\n");
  }

  return buildNoteBasedReply(resources);
}

function getFunctionIntentReply(message, resources = []) {
  const text = String(message || "").toLowerCase();
  const isEnzymeQuestion =
    text.includes("enzyme") ||
    text.includes("\u0d91\u0db1\u0dca\u0dc3\u0dba\u0dd2\u0db8");
  const asksFunction =
    text.includes("function") ||
    text.includes("role") ||
    text.includes("work") ||
    text.includes("karya") ||
    text.includes("kaarya") ||
    text.includes("karaya") ||
    text.includes("\u0d9a\u0dcf\u0dbb\u0dca\u0dba") ||
    text.includes("\u0db8\u0ddc\u0d9a\u0d9a\u0dca\u0daf");

  if (!isEnzymeQuestion || !asksFunction) return "";

  return [
    "එන්සයිමවල ප්‍රධාන කාර්යය වන්නේ සෛල තුළ සිදුවන ජෛව රසායනික ප්‍රතික්‍රියා වේගවත් කිරීමයි.",
    "ඒවා ප්‍රතික්‍රියාවකට අවශ්‍ය සක්‍රීයකරණ ශක්තිය අඩු කරයි.",
    "එම නිසා ප්‍රතික්‍රියාව සෛලයට සුදුසු උෂ්ණත්වය සහ pH යටතේ ඉක්මනින් සිදුවේ.",
    "එන්සයිම ප්‍රතික්‍රියාව අවසානයේ වෙනස් නොවන බැවින් නැවත නැවත භාවිතා කළ හැක.",
  ].join("\n");
}

async function answerFromCleanResources(message, resources = []) {
  if (!process.env.GEMINI_API_KEY || !resources.length) return "";

  const context = buildResourceContext(resources.filter((resource) => resource.type === "clean-summary").length
    ? resources.filter((resource) => resource.type === "clean-summary")
    : resources);
  if (!context) return "";

  const prompt = [
    "You are a Sinhala medium Sri Lankan A/L Biology tutor.",
    "Use the given Biology context when it is relevant.",
    "If the context is not enough to answer the student's understanding question, use your own correct A/L Biology knowledge.",
    "Answer in Sinhala if the student asks Sinhala. Keep only unavoidable abbreviations such as ATP, ADP, Pi, DNA, RNA and pH.",
    "Do not simply repeat the context. Answer the exact question the student asked.",
    "For understanding questions, explain the cause-process-result clearly.",
    "Give 3-5 clear exam-focused Sinhala points. Do not give only a definition.",
    "If the question is not Biology, say you can help with A/L Biology and platform questions.",
    "Do not stop mid-sentence.",
    "",
    context,
    "",
    `Student question: ${message}`,
  ].join("\n");

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          topP: 0.85,
          maxOutputTokens: 650,
        },
      }),
    }
  );

  const data = await response.json();
  if (!response.ok) return "";

  return data?.candidates?.[0]?.content?.parts
    ?.map((part) => part.text || "")
    .join("")
    .trim();
}

async function answerFromGeneralBiology(message) {
  if (!process.env.GEMINI_API_KEY) return "";

  const prompt = [
    "You are a Sinhala medium Sri Lankan A/L Biology tutor.",
    "Answer using your own correct A/L Biology knowledge.",
    "Answer in Sinhala. Keep only unavoidable abbreviations such as ATP, ADP, Pi, DNA, RNA and pH.",
    "For understanding questions, explain the reason and process clearly.",
    "Give 3-5 clear exam-focused points. Do not give only a definition.",
    "Do not mix long English phrases into the Sinhala answer.",
    "If the question is not Biology, say you can help with A/L Biology and platform questions.",
    "",
    `Student question: ${message}`,
  ].join("\n");

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.35,
          topP: 0.9,
          maxOutputTokens: 800,
        },
      }),
    }
  );

  const data = await response.json();
  if (!response.ok) return "";

  return data?.candidates?.[0]?.content?.parts
    ?.map((part) => part.text || "")
    .join("")
    .trim();
}

async function getBiologyUnit2PdfBase64() {
  if (!biologyUnit2PdfBase64) {
    const pdfBuffer = await fs.readFile(BIOLOGY_UNIT_2_PDF_PATH);
    biologyUnit2PdfBase64 = pdfBuffer.toString("base64");
  }

  return biologyUnit2PdfBase64;
}

async function answerFromBiologyUnit2Pdf(message) {
  if (!process.env.GEMINI_API_KEY) return "";

  const pdfBase64 = await getBiologyUnit2PdfBase64();
  const prompt = [
    "You are Learning Hub AI Assistant for Sri Lankan A/L Biology students.",
    "Read the attached PDF directly. It is Biology Unit 2 / Chemical Basis of Life.",
    "Answer ONLY using information from this PDF. Do not use outside knowledge unless the PDF is unclear.",
    "If the answer is not in the PDF, say in Sinhala that the answer was not found in the Unit 2 PDF.",
    "These are Sinhala medium students. Answer mainly in Sinhala.",
    "Use Sinhala medium wording. Avoid English terms when Sinhala terms are available.",
    "Only keep unavoidable symbols/abbreviations such as ATP, ADP, Pi and pH.",
    "Do not use English terms such as activation energy, active site, enzyme-substrate complex, competitive inhibitor or non-competitive inhibitor. Use Sinhala equivalents.",
    "Avoid long English phrases or English-only sentences.",
    "Give A/L exam-focused answers with 3-5 complete points.",
    "Do not give one short phrase only. Do not stop mid-sentence.",
    "End with a complete Sinhala sentence.",
    "For ATP questions, include full form, structure, and role in energy transfer if present in the PDF.",
    "",
    `Student question: ${message}`,
  ].join("\n");

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              {
                inlineData: {
                  mimeType: "application/pdf",
                  data: pdfBase64,
                },
              },
              { text: prompt },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.25,
          topP: 0.85,
          maxOutputTokens: 900,
        },
      }),
    }
  );

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error?.message || "Gemini PDF request failed");
  }

  return data?.candidates?.[0]?.content?.parts
    ?.map((part) => part.text || "")
    .join("")
    .trim();
}

function isWeakPdfAnswer(reply) {
  const text = String(reply || "").trim();
  if (!text) return true;
  if (text.length < 120) return true;
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  if (wordCount < 18) return true;
  if (/[,:;]$/.test(text)) return true;
  if (/[අ-෿]\s*$/.test(text) && !/[.!?।෴]$/.test(text)) return true;
  const englishWords = text.match(/[A-Za-z]{4,}/g) || [];
  const sinhalaChars = text.match(/[අ-෿]/g) || [];
  return sinhalaChars.length > 0 && englishWords.length > 24;
}

function isBiologyQuestion(message) {
  const text = String(message || "").toLowerCase();
  const sinhalaTerms = [
    "\u0d91\u0db1\u0dca\u0dc3\u0dba\u0dd2\u0db8",
    "\u0dc3\u0ddb\u0dbd",
    "\u0dbb\u0dc3\u0dcf\u0dba\u0db1",
    "\u0db4\u0ddc\u0dc2\u0dca\u0dc6\u0dda\u0da7\u0dca",
    "\u0db4\u0dca\u200d\u0dbb\u0ddd\u0da7\u0dd3\u0db1",
    "\u0dbd\u0dd2\u0db4\u0dd2\u0da9",
    "\u0d9a\u0dcf\u0db6\u0ddd\u0dc4\u0dba\u0dd2\u0da9\u0dca\u200d\u0dbb\u0dda\u0da7",
    "\u0d8b\u0dc2\u0dca\u0dab\u0dad\u0dca\u0dc0",
    "\u0db1\u0dd2\u0dc2\u0dca\u0d9a\u0dca\u200d\u0dbb\u0dd2\u0dba",
  ];

  if (sinhalaTerms.some((term) => text.includes(term))) return true;

  return includesAny(text, [
    "biology",
    "bio",
    "ජීව",
    "විද්‍යාව",
    "unit 2",
    "lesson 2",
    "chemical basis",
    "chemical",
    "atp",
    "adenosine",
    "triphosphate",
    "adp",
    "phosphate",
    "pi",
    "hydrolysis",
    "phosphorylation",
    "රසායනික",
    "සෛල",
    "cell",
    "water",
    "protein",
    "carbohydrate",
    "lipid",
    "fat",
    "amino",
    "enzyme",
    "dna",
    "rna",
    "nucleic",
    "mitochondria",
    "chloroplast",
    "mitosis",
    "meiosis",
    "photosynthesis",
    "molecule",
    "organic",
    "genetic",
    "genetics",
    "ecology",
    "evolution",
    "plant",
    "animal",
    "photosynthesis",
    "respiration",
    "inheritance",
    "classification",
    "ජාන",
    "පරිසර",
    "පරිණාම",
    "ශාක",
    "සත්ත්ව",
  ]);
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

  const selectedSubjectIds = Array.isArray(student.subjects)
    ? student.subjects.filter(Boolean)
    : [];

  if (selectedSubjectIds.length > 0) {
    const subjects = await Subject.find({ _id: { $in: selectedSubjectIds } })
      .populate("stream", "name description")
      .sort({ order: 1, createdAt: 1 });
    return { stream: stream || subjects[0]?.stream || null, subjects };
  }

  let subjects = [];

  if (stream) {
    subjects = await Subject.find({ stream: stream._id })
      .populate("stream", "name description")
      .sort({ order: 1, createdAt: 1 });
  } else {
    subjects = await Subject.find()
      .populate("stream", "name description")
      .sort({ order: 1, createdAt: 1 })
      .limit(12);
  }

  const preferredSubjectNames = String(student.subject || "")
    .split(/[,;/|]+/)
    .map((name) => name.trim().toLowerCase())
    .filter(Boolean);

  if (preferredSubjectNames.length > 0) {
    const preferredSubjects = subjects.filter((subject) =>
      preferredSubjectNames.some((name) => subject.name.toLowerCase() === name || subject.name.toLowerCase().includes(name))
    );
    if (preferredSubjects.length > 0) {
      return { stream, subjects: preferredSubjects };
    }
  }

  return { stream, subjects };
}

async function buildActiveSubjects(studentId, subjects) {
  const subjectIds = subjects.map((subject) => subject._id);
  if (subjectIds.length === 0) return [];

  const [lessonCounts, progressItems] = await Promise.all([
    Lesson.aggregate([
      { $match: { subject: { $in: subjectIds } } },
      { $group: { _id: "$subject", lessonCount: { $sum: 1 } } },
    ]),
    StudentProgress.find({ student: studentId, subject: { $in: subjectIds } }).select("subject completed progressPercent"),
  ]);

  const lessonCountMap = new Map(lessonCounts.map((item) => [String(item._id), item.lessonCount]));
  const subjectMap = new Map(subjects.map((subject) => [String(subject._id), subject]));
  const progressMap = progressItems.reduce((acc, item) => {
    const subjectId = String(item.subject);
    if (!acc.has(subjectId)) acc.set(subjectId, { completed: 0, progressTotal: 0, records: 0 });
    const current = acc.get(subjectId);
    current.completed += item.completed || item.progressPercent >= 100 ? 1 : 0;
    current.progressTotal += Number(item.progressPercent || 0);
    current.records += 1;
    return acc;
  }, new Map());

  const activeByName = new Map();

  [...progressMap.keys()].forEach((subjectId) => {
    const subject = subjectMap.get(subjectId);
    if (!subject) return;
    const lessonCount = lessonCountMap.get(subjectId) || 0;
    const progress = progressMap.get(subjectId) || { completed: 0, progressTotal: 0, records: 0 };
    const hasRealActivity = progress.completed > 0 || progress.progressTotal > 0;
    if (!hasRealActivity) return;

    const progressPercent = lessonCount
      ? Math.round(progress.progressTotal / lessonCount)
      : 0;

    const activeSubject = {
      _id: subject._id,
      name: subject.name,
      sinhalaName: subject.sinhalaName || "",
      code: subject.code || "",
      icon: subject.icon || "",
      color: subject.color || "",
      papersCount: subject.papersCount || 0,
      studentsCount: subject.studentsCount || 0,
      stream: subject.stream || null,
      lessonCount,
      completedLessons: progress.completed,
      progressPercent: Math.max(0, Math.min(100, progressPercent)),
    };

    const subjectNameKey = subject.name.trim().toLowerCase();
    const existingSubject = activeByName.get(subjectNameKey);
    if (!existingSubject || activeSubject.progressPercent > existingSubject.progressPercent) {
      activeByName.set(subjectNameKey, activeSubject);
    }
  });

  return [...activeByName.values()];
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

const lessonCardFields =
  "title sinhalaTitle description icon progressPercent videoCount notesCount pastPaperCount order subject createdAt updatedAt";

function toOngoingLessonCard(lesson, progress = null) {
  if (!lesson) return null;
  const lessonObject = typeof lesson.toObject === "function" ? lesson.toObject() : lesson;
  const subject = lessonObject.subject || progress?.subject || null;
  return {
    _id: lessonObject._id,
    title: lessonObject.title,
    sinhalaTitle: lessonObject.sinhalaTitle,
    description: lessonObject.description,
    icon: lessonObject.icon,
    subject,
    chapter: lessonObject.order ? `Chapter ${String(lessonObject.order).padStart(2, "0")}` : "Chapter",
    progressPercent: progress?.progressPercent ?? lessonObject.progressPercent ?? 0,
    status: progress?.status || "not-started",
    completed: Boolean(progress?.completed),
    lastAccessedAt: progress?.lastAccessedAt || null,
    videoCount: lessonObject.videoCount || 0,
    notesCount: lessonObject.notesCount || 0,
    pastPaperCount: lessonObject.pastPaperCount || 0,
  };
}

async function getBiologySubject(subjectIds = []) {
  const filter = { name: /^Biology$/i };
  if (subjectIds.length) filter._id = { $in: subjectIds };
  return Subject.findOne(filter).select("_id name sinhalaName");
}

async function buildOngoingLessons(studentId, subjectIds = [], limit = 3) {
  const biologySubject = await getBiologySubject(subjectIds);
  const subjectFilter = biologySubject
    ? [biologySubject._id]
    : subjectIds;

  const progressFilter = { student: studentId };
  if (subjectFilter.length) progressFilter.subject = { $in: subjectFilter };

  const progressRows = await StudentProgress.find(progressFilter)
    .populate({
      path: "lesson",
      select: lessonCardFields,
      populate: { path: "subject", select: "name sinhalaName" },
    })
    .populate("subject", "name sinhalaName")
    .sort({ lastAccessedAt: -1 })
    .limit(limit);

  const cards = progressRows
    .map((progress) => toOngoingLessonCard(progress.lesson, progress))
    .filter(Boolean);

  if (cards.length >= limit) return cards;

  const usedLessonIds = new Set(cards.map((item) => String(item._id)));
  const lessonFilter = {};
  if (subjectFilter.length) lessonFilter.subject = { $in: subjectFilter };

  const fallbackLessons = await Lesson.find(lessonFilter)
    .select(lessonCardFields)
    .populate("subject", "name sinhalaName")
    .sort({ order: 1, createdAt: 1 })
    .limit(limit * 2);

  fallbackLessons.forEach((lesson) => {
    if (cards.length >= limit) return;
    if (usedLessonIds.has(String(lesson._id))) return;
    cards.push(toOngoingLessonCard(lesson));
    usedLessonIds.add(String(lesson._id));
  });

  return cards;
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
    const allowed = ["name", "phone", "stream", "streamId", "subject", "subjects"];
    const updates = {};

    allowed.forEach((key) => {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    });

    if (updates.name !== undefined) updates.name = String(updates.name).trim();
    if (updates.phone !== undefined) updates.phone = String(updates.phone).trim();
    if (updates.stream !== undefined) updates.stream = String(updates.stream).trim();
    if (updates.subject !== undefined) updates.subject = String(updates.subject).trim();
    if (updates.streamId && !isObjectId(updates.streamId)) {
      return fail(res, 400, "Invalid stream id");
    }
    if (updates.subjects !== undefined) {
      if (!Array.isArray(updates.subjects)) return fail(res, 400, "Subjects must be an array");
      const invalidSubjectId = updates.subjects.find((subjectId) => !isObjectId(subjectId));
      if (invalidSubjectId) return fail(res, 400, "Invalid subject id");
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
    const activeSubjects = await buildActiveSubjects(req.user.id, subjects);
    return ok(res, { selectedStream: stream, subjects, activeSubjects });
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

async function getOngoingLessons(req, res) {
  try {
    const student = await getStudent(req);
    if (!student) return fail(res, 404, "Student profile not found");

    const { subjects } = await getStudentSubjects(student);
    const subjectIds = subjects.map((subject) => subject._id);
    const ongoingLessons = await buildOngoingLessons(req.user.id, subjectIds, 3);

    return ok(res, ongoingLessons);
  } catch (error) {
    return fail(res, 500, "Failed to load ongoing lessons");
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
      ongoingLessons,
      recentProgress,
      recommendedLessons,
      upcomingClasses,
      latestPastPapers,
      progressData,
      attempts,
    ] = await Promise.all([
      buildOngoingLessons(req.user.id, subjectIds, 3),
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
      activeSubjects: await buildActiveSubjects(req.user.id, subjects),
      ongoingLessons,
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
    const chatContext = getRecentChatContext(req, message);
    const resolvedMessage = resolveFollowUpMessage(message, chatContext.explicitHistory);

    const userMessage = await ChatMessage.create({
      student: req.user.id,
      role: "user",
      message,
      lesson: isObjectId(req.body.lessonId) ? req.body.lessonId : null,
      subject: isObjectId(req.body.subjectId) ? req.body.subjectId : null,
    });

    let pdfResources = [];
    let pdfAssistantText =
      getDirectUnit2Reply(message) ||
      getPlatformHelpReply(message) ||
      getFollowUpDirectReply(message, chatContext.explicitHistory);

    if (!pdfAssistantText) {
      if (!isBiologyQuestion(resolvedMessage)) {
        pdfAssistantText = STUDY_ASSISTANT_ONLY_REPLY;
      } else {
        const cleanResources = await findRelevantLessonResources(resolvedMessage, {
          lessonId: userMessage.lesson,
          subjectId: userMessage.subject,
        });
        const hasCleanSummary = cleanResources.some((resource) => resource.type === "clean-summary");
        const cleanAnswer =
          getFunctionIntentReply(resolvedMessage, cleanResources) ||
          (await answerFromCleanResources(resolvedMessage, cleanResources));

        if (cleanAnswer && !isWeakPdfAnswer(cleanAnswer)) {
          pdfAssistantText = cleanAnswer;
          pdfResources = cleanResources;
        } else if (hasCleanSummary) {
          pdfAssistantText = await answerFromGeneralBiology(resolvedMessage);
          if (!pdfAssistantText || isWeakPdfAnswer(pdfAssistantText)) {
            pdfAssistantText = buildNoteBasedReply(cleanResources);
          }
          pdfResources = cleanResources;
        }
      }
    }

    if (!pdfAssistantText) {
      if (!isBiologyQuestion(resolvedMessage)) {
        pdfAssistantText = STUDY_ASSISTANT_ONLY_REPLY;
      } else {
        pdfResources = await findRelevantLessonResources(resolvedMessage, {
          lessonId: userMessage.lesson,
          subjectId: userMessage.subject,
        });
        if (pdfResources.length) {
          pdfAssistantText =
            getFunctionIntentReply(resolvedMessage, pdfResources) ||
            (await answerFromGeneralBiology(resolvedMessage)) ||
            buildNoteBasedReply(pdfResources);
        } else {
          pdfAssistantText =
            getDirectUnit2Reply(message) ||
            (await answerFromGeneralBiology(resolvedMessage)) ||
            LESSON_2_ONLY_REPLY;
        }
      }
    }

    const pdfAssistantMessage = await ChatMessage.create({
      student: req.user.id,
      role: "assistant",
      message: pdfAssistantText,
      lesson: userMessage.lesson,
      subject: userMessage.subject,
    });

    return ok(
      res,
      {
        userMessage,
        assistantMessage: pdfAssistantMessage,
        reply: pdfAssistantText,
        sources: pdfResources.map((resource) => ({
          title: resource.title,
          sourcePdf: resource.sourcePdf,
          pageRange: resource.pageRange,
        })),
      },
      201
    );

    let scopedResources = [];
    let scopedAssistantText = getPlatformHelpReply(message);
    if (!scopedAssistantText) {
      scopedAssistantText = getDirectUnit2Reply(message);
    }

    if (!scopedAssistantText) {
      scopedResources = await findRelevantLessonResources(message, {
        lessonId: userMessage.lesson,
        subjectId: userMessage.subject,
      });

      if (!scopedResources.length) {
        scopedAssistantText = isBiologyQuestion(message) ? LESSON_2_ONLY_REPLY : STUDY_ASSISTANT_ONLY_REPLY;
      } else {
        const scopedContext = buildResourceContext(scopedResources);
        scopedAssistantText = buildNoteBasedReply(scopedResources);
        const hasCleanSummary = scopedResources.some((resource) => resource.type === "clean-summary");

        if (!hasCleanSummary && process.env.GEMINI_API_KEY) {
          try {
            const prompt = [
              "You are Learning Hub AI Assistant for Sri Lankan A/L Biology students.",
              "Use the lesson context when it is relevant. If context is not enough, use your own correct A/L Biology knowledge.",
              "Answer in Sinhala if the student asks in Sinhala. Avoid long English phrases unless the term is unavoidable.",
              "Give useful A/L exam-focused answers. For explanation questions, include at least 3 concise bullet points.",
              "Do not reply with only one short phrase. Give definition, key idea, and exam use when relevant.",
              "For 'ATP කියන්නේ මොකක්ද?', explain definition, structure, and function.",
              "For 'ATP full form', answer: Adenosine Triphosphate / ඇඩිනොසින් ට්‍රයිෆොස්ෆේට්.",
              "Some Sinhala notes were extracted from legacy-font PDFs. Useful mappings: Ôj úoHdj = ජීව විද්‍යාව, Ôùka = ජීවීන්, úoHdj = විද්‍යාව, ridhk = රසායනික, ffi, = සෛල.",
              "",
              scopedContext,
              "",
              `Student question: ${message}`,
            ].join("\n");

            const response = await fetch(
              `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${process.env.GEMINI_API_KEY}`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  contents: [{ role: "user", parts: [{ text: prompt }] }],
                  generationConfig: {
                    temperature: 0.4,
                    topP: 0.9,
                    maxOutputTokens: 350,
                  },
                }),
              }
            );

            const data = await response.json();
            const reply = data?.candidates?.[0]?.content?.parts
              ?.map((part) => part.text || "")
              .join("")
              .trim();

            if (response.ok && reply) scopedAssistantText = reply;
          } catch (error) {
            scopedAssistantText = buildNoteBasedReply(scopedResources);
          }
        }
      }
    }

    const scopedAssistantMessage = await ChatMessage.create({
      student: req.user.id,
      role: "assistant",
      message: scopedAssistantText,
      lesson: userMessage.lesson,
      subject: userMessage.subject,
    });

    return ok(
      res,
      {
        userMessage,
        assistantMessage: scopedAssistantMessage,
        reply: scopedAssistantText,
        sources: scopedResources.map((resource) => ({
          title: resource.title,
          sourcePdf: resource.sourcePdf,
          pageRange: resource.pageRange,
        })),
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
  getOngoingLessons,
  submitStructuredAnswer,
  getClassPosts,
  getChatHistory,
  postChatMessage,
};
