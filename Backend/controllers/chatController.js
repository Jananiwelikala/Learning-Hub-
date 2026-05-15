const {
  findRelevantLessonResources,
  buildResourceContext,
} = require("../utils/lessonResourceSearch");

const GEMINI_MODEL = "gemini-3-flash-preview";

const SYSTEM_PROMPT = [
  "You are Learning Hub AI Assistant for Sri Lankan A/L students.",
  "Give clear, short, exam-focused answers.",
  "Support Sinhala and English naturally based on the student's message.",
  "Focus on Physics, Chemistry, Biology, Maths, ICT, Commerce, Arts, and Technology subjects.",
  "Always check provided lesson material context first. If it is relevant, base the answer on it.",
  "If the provided context is not related or not enough, still answer the student's question using your own correct knowledge.",
  "When useful, explain step by step in a concise way and include exam tips.",
].join(" ");

function normalizeHistory(history = []) {
  return history
    .filter((item) => item && typeof item.text === "string" && item.text.trim())
    .slice(-12)
    .map((item) => ({
      role: item.role === "assistant" ? "model" : "user",
      parts: [{ text: item.text.trim() }],
    }));
}

function extractReply(payload) {
  const parts = payload?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts)) return "";

  return parts
    .map((part) => (typeof part?.text === "string" ? part.text : ""))
    .join("")
    .trim();
}

async function chatWithAssistant(req, res) {
  const apiKey = process.env.GEMINI_API_KEY;
  const message = String(req.body?.message || "").trim();
  const history = normalizeHistory(req.body?.history || []);

  if (!message) {
    return res.status(400).json({ message: "Message is required" });
  }

  if (!apiKey) {
    return res.status(500).json({ message: "Gemini API key is not configured" });
  }

  const endpoint =
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

  try {
    const resources = await findRelevantLessonResources(message, {
      subjectId: req.body?.subjectId,
      lessonId: req.body?.lessonId,
    });
    const resourceContext = buildResourceContext(resources);
    const contextualMessage = resourceContext
      ? [
          "Check the following lesson material context first.",
          "If it is relevant, use it as the main source for the answer.",
          "If it is not related or not enough, answer generally using your own correct knowledge.",
          "",
          resourceContext,
          "",
          `Student question: ${message}`,
        ].join("\n")
      : [
          "No matching lesson material context was found.",
          "Answer the student's question generally using your own correct knowledge.",
          "",
          `Student question: ${message}`,
        ].join("\n");

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: SYSTEM_PROMPT }],
        },
        contents: [
          ...history,
          {
            role: "user",
            parts: [{ text: contextualMessage }],
          },
        ],
        generationConfig: {
          temperature: 0.6,
          topP: 0.9,
          maxOutputTokens: 500,
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      const apiError =
        data?.error?.message || "Gemini request failed";
      return res.status(502).json({ message: apiError });
    }

    const reply = extractReply(data);

    if (!reply) {
      return res.status(502).json({
        message: "The AI assistant could not generate a reply right now",
      });
    }

    return res.json({
      reply,
      sources: resources.map((resource) => ({
        title: resource.title,
        sourcePdf: resource.sourcePdf,
        pageRange: resource.pageRange,
      })),
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to contact the AI assistant",
    });
  }
}

module.exports = {
  chatWithAssistant,
};
