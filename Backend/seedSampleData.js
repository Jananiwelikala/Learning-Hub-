const Stream = require("./models/Stream");
const Subject = require("./models/Subject");
const Lesson = require("./models/Lesson");
const MCQ = require("./models/MCQ");
const AssessmentQuestion = require("./models/AssessmentQuestion");
const User = require("./models/User");
const Note = require("./models/Note");
const PastPaper = require("./models/PastPaper");
const bcrypt = require("bcryptjs");

const alStreams = [
  {
    name: "Bio Science",
    code: "bio-science",
    sinhalaName: "ජීව විද්‍යා ධාරාව",
    description: "Biology and Chemistry are core subjects. Students can select Physics or Agricultural Science as the third subject.",
    icon: "microscope",
    color: "green",
    subjects: [
      { name: "Biology", sinhalaName: "ජීව විද්‍යාව", code: "biology", icon: "sprout", color: "green", papersCount: 45, studentsCount: 1200, order: 1 },
      { name: "Chemistry", sinhalaName: "රසායන විද්‍යාව", code: "chemistry", icon: "flask", color: "green", papersCount: 42, studentsCount: 1150, order: 2 },
      { name: "Physics", sinhalaName: "භෞතික විද්‍යාව", code: "physics", icon: "atom", color: "green", papersCount: 40, studentsCount: 1100, isOptional: true, order: 3 },
      { name: "Agricultural Science", sinhalaName: "කෘෂි විද්‍යාව", code: "agricultural-science", icon: "leaf", color: "green", papersCount: 32, studentsCount: 720, isOptional: true, order: 4 },
    ],
  },
  {
    name: "Physical Science",
    code: "physical-science",
    sinhalaName: "ගණිත ධාරාව",
    description: "Main subjects are Combined Mathematics, Physics, and Chemistry or ICT.",
    icon: "calculator",
    color: "blue",
    subjects: [
      { name: "Combined Mathematics", sinhalaName: "සංයුක්ත ගණිතය", code: "combined-mathematics", icon: "grid", color: "blue", papersCount: 50, studentsCount: 980, order: 1 },
      { name: "Physics", sinhalaName: "භෞතික විද්‍යාව", code: "physics", icon: "atom", color: "blue", papersCount: 40, studentsCount: 950, order: 2 },
      { name: "Chemistry", sinhalaName: "රසායන විද්‍යාව", code: "chemistry", icon: "flask", color: "blue", papersCount: 42, studentsCount: 920, order: 3 },
      { name: "ICT", sinhalaName: "තොරතුරු හා සන්නිවේදන තාක්ෂණය", code: "ict", icon: "computer", color: "blue", papersCount: 30, studentsCount: 760, isOptional: true, order: 4 },
    ],
  },
  {
    name: "Commerce",
    code: "commerce",
    sinhalaName: "වාණිජ ධාරාව",
    description: "Commerce students commonly study Accounting, Business Studies, and Economics.",
    icon: "chart",
    color: "orange",
    subjects: [
      { name: "Accounting", sinhalaName: "ගිණුම්කරණය", code: "accounting", icon: "coin", color: "orange", papersCount: 38, studentsCount: 850, order: 1 },
      { name: "Business Studies", sinhalaName: "ව්‍යාපාර අධ්‍යයනය", code: "business-studies", icon: "briefcase", color: "orange", papersCount: 35, studentsCount: 820, order: 2 },
      { name: "Economics", sinhalaName: "ආර්ථික විද්‍යාව", code: "economics", icon: "trend", color: "orange", papersCount: 36, studentsCount: 800, order: 3 },
    ],
  },
  {
    name: "Arts",
    code: "arts",
    sinhalaName: "කලා ධාරාව",
    description: "Arts students select three subjects from social sciences, languages, and aesthetic subject baskets.",
    icon: "book",
    color: "purple",
    subjects: [
      { name: "Sinhala", sinhalaName: "සිංහල", code: "sinhala", icon: "language", color: "purple", papersCount: 32, studentsCount: 750, order: 1 },
      { name: "History", sinhalaName: "ඉතිහාසය", code: "history", icon: "archive", color: "purple", papersCount: 30, studentsCount: 720, order: 2 },
      { name: "Geography", sinhalaName: "භූගෝල විද්‍යාව", code: "geography", icon: "globe", color: "purple", papersCount: 28, studentsCount: 700, order: 3 },
      { name: "Political Science", sinhalaName: "දේශපාලන විද්‍යාව", code: "political-science", icon: "scale", color: "purple", papersCount: 29, studentsCount: 680, order: 4 },
      { name: "Media", sinhalaName: "මාධ්‍ය අධ්‍යයනය", code: "media", icon: "media", color: "purple", papersCount: 24, studentsCount: 610, order: 5 },
    ],
  },
  {
    name: "Technology",
    code: "technology",
    sinhalaName: "තාක්ෂණවේදය ධාරාව",
    description: "Science for Technology is compulsory. Students select ET or BST with an additional subject such as ICT.",
    icon: "cpu",
    color: "teal",
    subjects: [
      { name: "Science for Technology", sinhalaName: "තාක්ෂණවේදය සඳහා විද්‍යාව", code: "sft", icon: "flask", color: "teal", papersCount: 34, studentsCount: 780, order: 1 },
      { name: "Engineering Technology", sinhalaName: "ඉංජිනේරු තාක්ෂණවේදය", code: "et", icon: "tool", color: "teal", papersCount: 31, studentsCount: 700, isOptional: true, order: 2 },
      { name: "Bio-systems Technology", sinhalaName: "ජෛව පද්ධති තාක්ෂණවේදය", code: "bst", icon: "leaf", color: "teal", papersCount: 30, studentsCount: 690, isOptional: true, order: 3 },
      { name: "ICT", sinhalaName: "තොරතුරු හා සන්නිවේදන තාක්ෂණය", code: "ict", icon: "computer", color: "teal", papersCount: 30, studentsCount: 760, isOptional: true, order: 4 },
    ],
  },
];

async function upsertSeedUser({ name, email, password, role, phone = "", stream = "", subject = "" }) {
  const normalizedEmail = email.trim().toLowerCase();
  const existingUser = await User.findOne({ email: normalizedEmail });

  if (!existingUser) {
    const hashedPassword = await bcrypt.hash(password, 10);
    await User.create({
      name,
      email: normalizedEmail,
      phone,
      password: hashedPassword,
      role,
      stream,
      subject,
    });
    return;
  }

  const updates = {};
  if (existingUser.role !== role) updates.role = role;
  if (!existingUser.name) updates.name = name;
  if (!existingUser.phone && phone) updates.phone = phone;
  if (!existingUser.stream && stream) updates.stream = stream;
  if (!existingUser.subject && subject) updates.subject = subject;

  const shouldRefreshDemoPassword = process.env.NODE_ENV !== "production";
  const passwordMatches = await bcrypt.compare(password, existingUser.password);
  if (shouldRefreshDemoPassword && !passwordMatches) {
    updates.password = await bcrypt.hash(password, 10);
  }

  if (Object.keys(updates).length > 0) {
    await User.updateOne({ _id: existingUser._id }, { $set: updates });
  }
}

// Creates a small demo dataset for Biology -> Physics -> Measurements.
async function seedSampleData() {
  const streamDocs = {};
  const subjectDocs = {};

  for (const streamData of alStreams) {
    const stream = await Stream.findOneAndUpdate(
      { code: streamData.code },
      {
        name: streamData.name,
        code: streamData.code,
        sinhalaName: streamData.sinhalaName,
        description: streamData.description,
        icon: streamData.icon,
        color: streamData.color,
        order: alStreams.indexOf(streamData) + 1,
      },
      { new: true, upsert: true }
    );

    streamDocs[streamData.name] = stream;

    for (const subjectData of streamData.subjects) {
      const subject = await Subject.findOneAndUpdate(
        { name: subjectData.name, stream: stream._id },
        {
          ...subjectData,
          stream: stream._id,
          isCore: !subjectData.isOptional,
          isOptional: Boolean(subjectData.isOptional),
        },
        { new: true, upsert: true }
      );

      subjectDocs[`${streamData.name}:${subjectData.name}`] = subject;
    }
  }

  await upsertSeedUser({
    name: "Learning Hub Admin",
    email: "admin@learninghub.lk",
    password: "Admin123",
    role: "admin",
  });

  await upsertSeedUser({
    name: "Test Student",
    email: "student@test.com",
    password: "123456",
    role: "student",
    phone: "+94 71 000 0001",
    stream: "Bio Science",
  });

  await upsertSeedUser({
    name: "Test Teacher",
    email: "teacher@test.com",
    password: "123456",
    role: "teacher",
    phone: "+94 77 000 0002",
    subject: "Biology",
  });
}

module.exports = seedSampleData;
