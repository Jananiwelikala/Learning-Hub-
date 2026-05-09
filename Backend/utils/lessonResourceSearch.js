const LessonResource = require("../models/LessonResource");
const BIOLOGY_LESSON_2_ID = "69fecad43aa30c9941247cd9";

function tokenize(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((word) => word.length >= 3)
    .slice(0, 40);
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function messageIncludesAny(text, terms) {
  return terms.some((term) => text.includes(term));
}

function getPreferredCleanTitle(message) {
  const text = String(message || "").toLowerCase();
  const sinhalaEnzyme = "\u0d91\u0db1\u0dca\u0dc3\u0dba\u0dd2\u0db8";
  const sinhalaPh = "\u0db4\u0dd3\u0d91\u0da0\u0dca";
  const sinhalaTemperature = "\u0d8b\u0dc2\u0dca\u0dab\u0dad\u0dca\u0dc0";
  const asksEnergyRelease = messageIncludesAny(text, [
    "energy release",
    "release energy",
    "energy",
    "shakthi",
    "shakthiya",
    "release",
    "නිදහස්",
    "ශක්ති",
    "ශක්තිය",
  ]);
  const asksFunction = messageIncludesAny(text, [
    "function",
    "role",
    "work",
    "activity",
    "karya",
    "kaarya",
    "karaya",
    "mokakda",
    "\u0d9a\u0dcf\u0dbb\u0dca\u0dba",
    "\u0d9a\u0dcf\u0dbb\u0dca\u0dba\u0dba",
    "\u0db8\u0ddc\u0d9a\u0d9a\u0dca\u0daf",
  ]);

  if (messageIncludesAny(text, ["competitive inhibitor", "competitive inhibition"])) {
    return "Competitive Inhibitors";
  }
  if (messageIncludesAny(text, ["non competitive", "non-competitive", "allosteric"])) {
    return "Non-competitive Inhibitors";
  }
  if (messageIncludesAny(text, ["denaturation", "denature"])) {
    return "Enzyme Denaturation";
  }
  if (messageIncludesAny(text, ["temperature", sinhalaTemperature])) {
    return "Temperature Effect on Enzymes";
  }
  if (messageIncludesAny(text, ["ph", sinhalaPh])) {
    return "pH Effect on Enzymes";
  }
  if (messageIncludesAny(text, ["enzyme activity", "reaction rate"]) || (asksFunction && messageIncludesAny(text, ["enzyme", "enzymes", sinhalaEnzyme]))) {
    return "Enzyme Activity";
  }
  if (messageIncludesAny(text, ["hydrolysis", "adp", "pi"]) || (text.includes("atp") && asksEnergyRelease)) {
    return "ATP Hydrolysis";
  }
  if (messageIncludesAny(text, [
    "phosphate",
    "pospate",
    "pospet",
    "fosfate",
    "fosfet",
    "akabanika",
    "akabanik",
    "\u0d85\u0d9a\u0dcf\u0db6\u0db1\u0dd2\u0d9a",
    "\u0db4\u0ddc\u0dc3\u0dca\u0dc6\u0dda\u0da7\u0dca",
  ])) {
    return "ATP Hydrolysis";
  }
  if (messageIncludesAny(text, ["atp"])) {
    return "ATP - Adenosine Triphosphate";
  }
  if (messageIncludesAny(text, ["enzyme", "enzymes", sinhalaEnzyme])) {
    return "Enzymes";
  }

  return "";
}

const biologyAliases = {
  "ජීව": ["biology", "ôj", "ôùka"],
  "විද්‍යාව": ["science", "úohdj", "úoHdj"],
  "ජීවවිද්‍යාව": ["biology", "ôj", "úohdj", "úoHdj"],
  "සෛල": ["cell", "ffi,"],
  "රසායනික": ["chemical", "ridhk"],
  "ජීවීන්": ["organisms", "ôùka"],
  "පරිසර": ["environment", "mßir"],
  "පරිණාම": ["evolution"],
  "ශාක": ["plant", "Ydl"],
  "සත්ත්ව": ["animal", "i;a;aj"],
};

function expandSearchWords(words, originalMessage = "") {
  const expanded = new Set(words);
  const rawMessage = String(originalMessage || "").toLowerCase();
  words.forEach((word) => {
    const compactWord = word.replace(/\s+/g, "");
    (biologyAliases[word] || biologyAliases[compactWord] || []).forEach((alias) => {
      if (alias.length >= 3) expanded.add(alias.toLowerCase());
    });
  });

  const phrase = `${words.join("")} ${rawMessage}`;
  if (phrase.includes("ජීව") && phrase.includes("විද්")) {
    ["biology", "ôj", "úohdj", "úoHdj"].forEach((alias) => expanded.add(alias.toLowerCase()));
  }
  Object.entries(biologyAliases).forEach(([term, aliases]) => {
    if (rawMessage.includes(term)) {
      aliases.forEach((alias) => {
        if (alias.length >= 3) expanded.add(alias.toLowerCase());
      });
    }
  });

  return [...expanded].slice(0, 60);
}

function scoreResource(resource, words) {
  const title = String(resource.title || "").toLowerCase();
  const keywords = (resource.keywords || []).join(" ").toLowerCase();
  const haystack = [title, resource.unit, resource.content, keywords].join(" ").toLowerCase();

  const matchScore = words.reduce((score, word) => score + (haystack.includes(word) ? 1 : 0), 0);
  const titleBoost = words.reduce((score, word) => score + (title.includes(word) ? 12 : 0), 0);
  const keywordBoost = words.reduce((score, word) => score + (keywords.includes(word) ? 8 : 0), 0);
  const topicPenalty =
    title.includes("hydrolysis") && !words.some((word) => ["hydrolysis", "breakdown", "adp", "pi"].includes(word))
      ? 18
      : 0;
  const cleanBoost = resource.type === "clean-summary" ? 100 : 0;
  return cleanBoost + titleBoost + keywordBoost + matchScore - topicPenalty;
}

async function searchResources(words, filter) {
  const cleanFilter = {
    ...filter,
    type: "clean-summary",
    $or: words.map((word) => ({
      keywords: { $regex: escapeRegex(word), $options: "i" },
    })),
  };

  let resources = await LessonResource.find(cleanFilter).limit(12).lean();

  try {
    const textResources = await LessonResource.find(
      {
        ...filter,
        $text: { $search: words.join(" ") },
      },
      { score: { $meta: "textScore" } }
    )
      .sort({ score: { $meta: "textScore" } })
      .limit(12)
      .lean();
    resources = [...resources, ...textResources];
  } catch (error) {
    const fallbackResources = await LessonResource.find(filter).limit(80).lean();
    resources = [...resources, ...fallbackResources];
  }

  if (!resources.length) {
    resources = await LessonResource.find(filter).limit(80).lean();
  }

  const uniqueResources = [...new Map(resources.map((resource) => [String(resource._id), resource])).values()];

  return uniqueResources
    .map((resource) => ({
      ...resource,
      relevance: (resource.score || 0) + scoreResource(resource, words),
    }))
    .filter((resource) => resource.relevance > 0)
    .sort((a, b) => {
      if (a.type === "clean-summary" && b.type !== "clean-summary") return -1;
      if (a.type !== "clean-summary" && b.type === "clean-summary") return 1;
      return b.relevance - a.relevance;
    });
}

async function findRelevantLessonResources(message, options = {}) {
  const words = expandSearchWords(tokenize(message), message);
  const preferredTitle = getPreferredCleanTitle(message);
  const filter = { lesson: BIOLOGY_LESSON_2_ID };

  if (preferredTitle) {
    const preferredResource = await LessonResource.findOne({
      ...filter,
      type: "clean-summary",
      title: preferredTitle,
    }).lean();

    if (preferredResource && words.length === 0) return [preferredResource];

    const resources = words.length > 0 ? await searchResources(words, filter) : [];
    const merged = preferredResource ? [preferredResource, ...resources] : resources;
    return [...new Map(merged.map((resource) => [String(resource._id), resource])).values()].slice(0, 3);
  }

  if (words.length === 0) return [];

  const resources = await searchResources(words, filter);
  return resources.slice(0, 3);
}

function buildResourceContext(resources = []) {
  if (!resources.length) return "";

  return resources
    .map((resource, index) => {
      const sourceName = resource.source || resource.sourcePdf || "Lesson resource";
      const source = `${resource.title} (${sourceName}${resource.pageRange ? `, ${resource.pageRange}` : ""})`;
      return `Context ${index + 1} - ${source}\n${resource.content}`;
    })
    .join("\n\n");
}

module.exports = {
  findRelevantLessonResources,
  buildResourceContext,
};
