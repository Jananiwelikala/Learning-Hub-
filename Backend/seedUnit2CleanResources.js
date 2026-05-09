require("dotenv").config();

const mongoose = require("mongoose");
const LessonResource = require("./models/LessonResource");

const SUBJECT_ID = "69fd96c7bab01bd7ab93501d";
const LESSON_ID = "69fecad43aa30c9941247cd9";
const SOURCE = "Clean Unit 2 Summary";

const resources = [
  {
    title: "ATP - Adenosine Triphosphate",
    keywords: ["ATP", "adenosine triphosphate", "energy carrier", "ශක්ති වාහක", "ඇඩිනොසින් ට්‍රයිෆොස්ෆේට්", "ADP", "Pi"],
    content:
      "ATP (Adenosine Triphosphate / ඇඩිනොසින් ට්‍රයිෆොස්ෆේට්) යනු සෛලයේ ප්‍රධාන ශක්ති වාහක අණුවයි. එය ඇඩිනීන් නයිට්‍රජන් භෂ්මය, රයිබෝස් සීනි සහ පොස්ෆේට් කණ්ඩ 3කින් සමන්විත නියුක්ලියෝටයිඩයකි. ATP බිඳී ADP + Pi බවට පත්වන විට ශක්තිය නිදහස් වේ. එම ශක්තිය සෛලීය ක්‍රියාවලීන්, active transport, muscle contraction, biosynthesis සහ nerve impulse transmission සඳහා භාවිතා වේ. A/L exam point: ATP is called the immediate energy currency of the cell.",
  },
  {
    title: "ATP Hydrolysis",
    keywords: ["ATP hydrolysis", "ADP", "Pi", "energy release", "hydrolysis", "ATP බිඳීම", "ශක්තිය නිදහස්"],
    content:
      "ATP hydrolysis යනු ATP අණුව ජලය භාවිතයෙන් ADP සහ inorganic phosphate (Pi) බවට බිඳීමයි. ප්‍රතික්‍රියාව: ATP + H2O -> ADP + Pi + energy. අවසාන පොස්ෆේට් බැඳීම කැඩෙන විට භාවිතා කළ හැකි ශක්තිය නිදහස් වේ. මෙම ශක්තිය endergonic reactions, active transport, muscle contraction සහ macromolecule synthesis සඳහා couple කර භාවිතා කරයි. A/L exam point: ATP stores energy temporarily and releases it quickly when cells need energy.",
  },
  {
    title: "Enzymes",
    keywords: ["enzyme", "enzymes", "biological catalyst", "active site", "substrate", "එන්සයිම", "ජීව උත්ප්‍රේරක"],
    content:
      "Enzymes / එන්සයිම යනු ජීව උත්ප්‍රේරක වේ. ඒවා සෛල තුළ සිදුවන biochemical reactions වල activation energy අඩු කර ප්‍රතික්‍රියා වේගය වැඩි කරයි. බොහෝ enzymes proteins වන අතර, ඒවාට specific active site එකක් ඇත. Substrate එක active site එකට බැඳී enzyme-substrate complex එක සාදයි. Enzyme ප්‍රතික්‍රියාවෙන් පසු වෙනස් නොවී නැවත භාවිතා කළ හැක. A/L exam point: enzymes are specific, reusable and affected by temperature, pH and inhibitors.",
  },
  {
    title: "Enzyme Activity",
    keywords: ["enzyme activity", "rate of reaction", "substrate concentration", "active site", "enzyme substrate complex", "එන්සයිම ක්‍රියාකාරිත්වය"],
    content:
      "Enzyme activity යනු enzyme එකක් catalyse කරන ප්‍රතික්‍රියාවේ වේගයයි. එය substrate concentration, enzyme concentration, temperature, pH සහ inhibitors මත රඳා පවතී. Substrate concentration වැඩි වන විට reaction rate මුලින් වැඩි වුවත්, සියලු active sites occupied වූ පසු rate එක උපරිම අගයකට පැමිණ තවදුරටත් වැඩි නොවේ. මෙම අවස්ථාව saturation ලෙස හැඳින්වේ. A/L exam point: rate increases until active sites become saturated.",
  },
  {
    title: "pH Effect on Enzymes",
    keywords: ["pH", "optimum pH", "enzyme activity", "denaturation", "acid", "alkaline", "pH effect"],
    content:
      "pH අගය enzyme activity මත විශාල බලපෑමක් කරයි. සෑම enzyme එකකටම optimum pH එකක් ඇත, එහිදී enzyme activity උපරිම වේ. pH අගය optimum අගයෙන් ඉතා වෙනස් වුවහොත් enzyme protein එකේ ionic bonds සහ hydrogen bonds වෙනස් වී active site shape වෙනස් විය හැක. එවිට substrate bind වීම අඩුවී reaction rate අඩුවේ. අධික pH වෙනස්වීම් denaturation ඇති කළ හැක. A/L exam point: pH changes alter active site shape and reduce enzyme-substrate complex formation.",
  },
  {
    title: "Temperature Effect on Enzymes",
    keywords: ["temperature", "optimum temperature", "enzyme activity", "kinetic energy", "denaturation", "උෂ්ණත්වය"],
    content:
      "Temperature වැඩි වන විට enzyme සහ substrate අණු වල kinetic energy වැඩි වන නිසා collisions වැඩි වී reaction rate වැඩි වේ. Optimum temperature එකේදී enzyme activity උපරිම වේ. එයට ඉහළ උෂ්ණත්වයකදී enzyme protein එකේ bonds බිඳී active site shape වෙනස් වන අතර denaturation සිදුවේ. එවිට reaction rate තියුණු ලෙස අඩුවේ. අඩු උෂ්ණත්වයේදී enzyme denature නොවෙයි, නමුත් kinetic energy අඩු නිසා reaction rate අඩු වේ. A/L exam point: high temperature denatures enzymes, low temperature only slows them.",
  },
  {
    title: "Enzyme Denaturation",
    keywords: ["denaturation", "enzyme denaturation", "active site", "protein structure", "heat", "pH", "denature"],
    content:
      "Enzyme denaturation යනු enzyme protein එකේ three-dimensional structure වෙනස් වීමයි. Heat, extreme pH, heavy metals හෝ chemicals නිසා hydrogen bonds, ionic bonds සහ other interactions බිඳී active site shape වෙනස් වේ. එවිට substrate එක active site එකට නිවැරදිව bind විය නොහැකි නිසා enzyme activity අඩුවේ හෝ නවතී. Denaturation බොහෝ විට irreversible වේ. A/L exam point: denaturation changes active site shape and prevents enzyme-substrate complex formation.",
  },
  {
    title: "Competitive Inhibitors",
    keywords: ["competitive inhibitor", "competitive inhibition", "active site", "substrate", "inhibitor", "තරඟකාරී අවහිරක"],
    content:
      "Competitive inhibitors substrate එකට සමාන හැඩයක් ඇති molecules වේ. ඒවා enzyme active site එකට bind වී substrate එක bind වීම තරඟකාරීව අවහිර කරයි. Substrate concentration වැඩි කළහොත් substrate molecules වැඩි නිසා inhibitor effect එක අඩු කළ හැක. Competitive inhibition සාමාන්‍යයෙන් reversible වේ. A/L exam point: competitive inhibitors bind to the active site and their effect can be reduced by increasing substrate concentration.",
  },
  {
    title: "Non-competitive Inhibitors",
    keywords: ["non competitive inhibitor", "non-competitive inhibitor", "allosteric site", "active site shape", "inhibition", "අතරඟකාරී අවහිරක"],
    content:
      "Non-competitive inhibitors enzyme එකේ active site එකට නොව වෙනත් allosteric site එකකට bind වේ. එයින් enzyme එකේ three-dimensional shape වෙනස් වී active site shape ද වෙනස් වේ. Substrate concentration වැඩි කළත් inhibition පහසුවෙන් අඩු නොවේ, මන්ද inhibitor එක active site එකට තරඟ නොකරයි. A/L exam point: non-competitive inhibitors bind away from active site and cannot be overcome by adding more substrate.",
  },
];

async function seedUnit2CleanResources() {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is missing in Backend/.env");
  }

  await mongoose.connect(process.env.MONGO_URI);

  await LessonResource.deleteMany({
    subject: SUBJECT_ID,
    lesson: LESSON_ID,
    type: "clean-summary",
    source: SOURCE,
  });

  const docs = resources.map((resource) => ({
    subject: SUBJECT_ID,
    lesson: LESSON_ID,
    unit: "2",
    title: resource.title,
    content: resource.content,
    source: SOURCE,
    type: "clean-summary",
    sourcePdf: "",
    pageRange: "",
    keywords: resource.keywords,
  }));

  await LessonResource.insertMany(docs);
  console.log(`Seeded ${docs.length} clean Biology Unit 2 lessonresources.`);
}

seedUnit2CleanResources()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
