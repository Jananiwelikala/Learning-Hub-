const LessonResource = require("../models/LessonResource");

const BIOLOGY_LESSON_2_ID = "69fecad43aa30c9941247cd9";

const preferredTopics = [
  {
    title: "Competitive Inhibitors",
    terms: ["competitive inhibitor", "competitive inhibition", "competitive", "tharagakari", "තරඟකාරී"],
  },
  {
    title: "Non-competitive Inhibitors",
    terms: ["non competitive", "non-competitive", "allosteric", "noncompetitive", "තරඟකාරී නොවන"],
  },
  {
    title: "Temperature Effect on Enzymes",
    terms: ["temperature", "temp", "ushnathwa", "උෂ්ණත්ව"],
  },
  {
    title: "pH Effect on Enzymes",
    terms: ["ph", "p h", "පීඑච්", "අම්ල", "ක්ෂාර"],
  },
  {
    title: "Enzyme Inhibitors",
    terms: ["inhibitor", "inhibition", "නිෂේධක", "නිෂේධනය"],
  },
  {
    title: "Enzyme Active Site and Substrate",
    terms: ["active site", "substrate", "enzyme substrate", "ක්‍රියාකාරී ස්ථානය", "උපස්තර"],
  },
  {
    title: "Enzyme Properties",
    terms: ["enzyme properties", "properties", "guna", "ගුණ"],
  },
  {
    title: "ATP Hydrolysis",
    terms: [
      "hydrolysis",
      "breakdown",
      "break down",
      "break",
      "bindi",
      "bindina",
      "bindunama",
      "kaduna",
      "adp",
      "pi",
      "energy release",
      "release energy",
      "අකාබනික",
      "පොස්ෆේට්",
      "ජලවිච්ඡේදනය",
      "බිඳ",
      "කැඩ",
    ],
  },
  {
    title: "Phosphorylation Types",
    terms: ["phosphorylation", "photophosphorylation", "oxidative", "substrate level", "පොස්ෆොරිලීකරණ"],
  },
  {
    title: "DNA vs RNA",
    terms: ["dna vs rna", "dna and rna", "dna rna", "ඩීඑන්ඒ", "ආර්එන්ඒ"],
  },
  { title: "Nucleic Acids", terms: ["nucleic", "nucleotide", "න්‍යෂ්ටික"] },
  { title: "Carbohydrates", terms: ["carbohydrate", "glucose", "starch", "කාබෝහයිඩ්‍රේට", "ග්ලූකෝස්"] },
  { title: "Lipids", terms: ["lipid", "fat", "oil", "ලිපිඩ", "මේද"] },
  { title: "Proteins", terms: ["protein", "amino", "peptide", "ප්‍රෝටීන", "ඇමයිනෝ"] },
  { title: "Mitochondria", terms: ["mitochondria", "respiration", "මයිටොකොන්ඩ්‍රියා"] },
  { title: "Chloroplast", terms: ["chloroplast", "photosynthesis", "හරිතලව", "ප්‍රභාසංශ්ලේෂණ"] },
  { title: "Mitosis", terms: ["mitosis", "මයිටෝසිස්"] },
  { title: "Meiosis", terms: ["meiosis", "මියෝසිස්"] },
  { title: "ATP", terms: ["atp", "adenosine", "triphosphate", "ඇඩිනොසින්"] },
  { title: "Enzymes", terms: ["enzyme", "enzymes", "එන්සයිම", "උත්ප්‍රේරක"] },
];

const extraAliases = {
  atp: ["energy", "shakthi", "ශක්තිය", "adp", "pi"],
  bindi: ["hydrolysis", "breakdown", "adp", "pi", "energy"],
  bindina: ["hydrolysis", "breakdown", "adp", "pi", "energy"],
  bindunama: ["hydrolysis", "breakdown", "adp", "pi", "energy"],
  breakdown: ["hydrolysis", "adp", "pi", "energy"],
  enzyme: ["enzymes", "catalyst", "එන්සයිම", "උත්ප්‍රේරක"],
  enzymes: ["enzyme", "catalyst", "එන්සයිම", "උත්ප්‍රේරක"],
  carbohydrate: ["glucose", "starch", "glycogen", "කාබෝහයිඩ්‍රේට"],
  lipid: ["fat", "oil", "phospholipid", "ලිපිඩ", "මේද"],
  protein: ["amino", "peptide", "ප්‍රෝටීන"],
  dna: ["rna", "nucleic", "genetic"],
  rna: ["dna", "nucleic", "genetic"],
};

function tokenize(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((word) => word.length >= 2)
    .slice(0, 50);
}

function getPreferredCleanTitle(message) {
  const text = String(message || "").toLowerCase();
  const topic = preferredTopics.find((item) => item.terms.some((term) => text.includes(term.toLowerCase())));
  return topic ? topic.title : "";
}

function expandSearchWords(words, originalMessage = "") {
  const expanded = new Set(words);
  const rawMessage = String(originalMessage || "").toLowerCase();

  words.forEach((word) => {
    (extraAliases[word] || []).forEach((alias) => expanded.add(alias.toLowerCase()));
  });

  preferredTopics.forEach((topic) => {
    if (topic.terms.some((term) => rawMessage.includes(term.toLowerCase()))) {
      expanded.add(topic.title.toLowerCase());
      topic.terms.forEach((term) => {
        tokenize(term).forEach((word) => expanded.add(word));
      });
    }
  });

  return [...expanded].slice(0, 80);
}

function scoreResource(resource, words, preferredTitle = "") {
  const title = String(resource.title || "").toLowerCase();
  const sinhalaTitle = String(resource.sinhalaTitle || "").toLowerCase();
  const keywords = (resource.keywords || []).join(" ").toLowerCase();
  const content = String(resource.content || "").toLowerCase();
  const haystack = [title, sinhalaTitle, keywords, content].join(" ");

  const exactTitleBoost = preferredTitle && title === preferredTitle.toLowerCase() ? 300 : 0;
  const titleBoost = words.reduce(
    (score, word) => score + (title.includes(word) || sinhalaTitle.includes(word) ? 18 : 0),
    0
  );
  const keywordBoost = words.reduce((score, word) => score + (keywords.includes(word) ? 12 : 0), 0);
  const contentScore = words.reduce((score, word) => score + (haystack.includes(word) ? 1 : 0), 0);

  return exactTitleBoost + titleBoost + keywordBoost + contentScore;
}

async function findByTextOrAll(filter, words) {
  if (!words.length) return LessonResource.find(filter).limit(80).lean();

  try {
    const textMatches = await LessonResource.find(
      { ...filter, $text: { $search: words.join(" ") } },
      { textScore: { $meta: "textScore" } }
    )
      .sort({ textScore: { $meta: "textScore" } })
      .limit(30)
      .lean();

    if (textMatches.length) return textMatches;
  } catch (error) {
    // Text indexes can lag on local/dev databases. Scoring all scoped docs is a safe fallback.
  }

  return LessonResource.find(filter).limit(80).lean();
}

async function searchCleanResources(words, filter, preferredTitle) {
  const cleanFilter = { ...filter, type: "clean-summary" };
  const resources = await findByTextOrAll(cleanFilter, words);

  return resources
    .map((resource) => ({
      ...resource,
      relevance: scoreResource(resource, words, preferredTitle),
    }))
    .filter((resource) => resource.relevance > 0 || resource.title === preferredTitle)
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, 3);
}

async function searchPdfFallback(words, filter) {
  const resources = await findByTextOrAll({ ...filter, type: { $ne: "clean-summary" } }, words);

  return resources
    .map((resource) => ({
      ...resource,
      relevance: scoreResource(resource, words),
    }))
    .filter((resource) => resource.relevance > 0)
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, 3);
}

async function findRelevantLessonResources(message) {
  const preferredTitle = getPreferredCleanTitle(message);
  const words = expandSearchWords(tokenize(message), message);
  const filter = { lesson: BIOLOGY_LESSON_2_ID };

  if (preferredTitle) {
    const preferredResource = await LessonResource.findOne({
      ...filter,
      type: "clean-summary",
      title: preferredTitle,
    }).lean();

    const cleanMatches = await searchCleanResources(words, filter, preferredTitle);
    const merged = preferredResource ? [preferredResource, ...cleanMatches] : cleanMatches;
    const unique = [...new Map(merged.map((resource) => [String(resource._id), resource])).values()];
    if (unique.length) return unique.slice(0, 3);
  }

  const cleanResources = await searchCleanResources(words, filter, preferredTitle);
  if (cleanResources.length) return cleanResources;

  return searchPdfFallback(words, filter);
}

function buildResourceContext(resources = []) {
  if (!resources.length) return "";

  return resources
    .map((resource, index) => {
      const sourceName = resource.source || resource.sourcePdf || "Lesson resource";
      const title = resource.sinhalaTitle || resource.title;
      const source = `${title} (${sourceName}${resource.pageRange ? `, ${resource.pageRange}` : ""})`;
      return `Context ${index + 1} - ${source}\n${resource.content}`;
    })
    .join("\n\n");
}

module.exports = {
  findRelevantLessonResources,
  buildResourceContext,
};
