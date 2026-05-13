import { useState, useEffect } from "react";
import "./App.css";
import styles from "./StudentDashboard.module.css";
import {
  getApprovedPosts,
  createComment,
  getStudentSubjects,
  getStudentLessons,
  getStudentOngoingLessons,
  getStudentLessonDetails,
  getStudentLessonPastPapers,
  getStudentMcqsByLesson,
  getVirtualPaperQuestions,
  submitStudentMcqs,
  sendStudentChatMessage,
  getSubjects,
  getSubjectLessons,
  getQuestionsForLesson,
} from "./api";
import LoadingSpinner from "./components/LoadingSpinner";
import ErrorMessage from "./components/ErrorMessage";
import EmptyState from "./components/EmptyState";
import StructuredQuestionWithImage from "./components/StructuredQuestionWithImage";

function StudentDashboard({ onLogout, onBackHome, studentData }) {
  const [activeView, setActiveView] = useState("home");
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [isAiMaximized, setIsAiMaximized] = useState(false);
  const [aiInput, setAiInput] = useState("");
  const [aiMessages, setAiMessages] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [selectedClassPost, setSelectedClassPost] = useState(null);
  const [selectedNews, setSelectedNews] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedLearningLesson, setSelectedLearningLesson] = useState(null);
  const [selectedPaperYear, setSelectedPaperYear] = useState(2025);
  const [selectedPaperType, setSelectedPaperType] = useState("mcq");
  const [selectedPaperSubject, setSelectedPaperSubject] = useState("All");
  const [currentPapers, setCurrentPapers] = useState([]);
  const [papersLoading, setPapersLoading] = useState(false);
  const [papersError, setPapersError] = useState("");
  const [showMcqPractice, setShowMcqPractice] = useState(false);
  const [mcqQuestions, setMcqQuestions] = useState([]);
  const [mcqAnswers, setMcqAnswers] = useState({});
  const [mcqResult, setMcqResult] = useState(null);
  const [mcqLoading, setMcqLoading] = useState(false);
  const [mcqError, setMcqError] = useState("");
  const [showStructuredPractice, setShowStructuredPractice] = useState(false);
  const [structuredQuestions, setStructuredQuestions] = useState([]);
  const [structuredLoading, setStructuredLoading] = useState(false);
  const [structuredError, setStructuredError] = useState("");
  const [expandedSubject, setExpandedSubject] = useState(null);
  const [classPosts, setClassPosts] = useState([]);
  const [studentSubjectRecords, setStudentSubjectRecords] = useState([]);
  const [activeSubjectRecords, setActiveSubjectRecords] = useState([]);
  const [studentLessonRecords, setStudentLessonRecords] = useState([]);
  const [studentOngoingLessons, setStudentOngoingLessons] = useState([]);
  const [lessonLoading, setLessonLoading] = useState(false);
  const [lessonError, setLessonError] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchFilters, setSearchFilters] = useState({
    subject: "",
    grade: "",
    location: ""
  });

  const [student, setStudent] = useState({
    name: studentData?.name || "Janani Upeksha",
    email: studentData?.email || "student@example.com",
    phone: studentData?.phone || "07XXXXXXXX",
    stream: studentData?.stream || "Bio Science",
    alYear: studentData?.alYear || "2026 A/L",
    joinedDate: studentData?.joinedDate || "May 2025",
    // Dashboard specific data
    progress: 65,
    completedLessons: 24,
    pendingTasks: 5,
    studyStreak: 7,
  });

  const [settings, setSettings] = useState({
    darkMode: false,
    notifications: true,
  });

  // Load approved class posts on component mount
  useEffect(() => {
    loadClassPosts();
    loadStudentSubjects();
    loadOngoingLessons();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadStudentSubjects() {
    const token = localStorage.getItem("token");
    if (!token) return;

    const result = await getStudentSubjects(token);
    if (result.success) {
      setStudentSubjectRecords(result.data?.subjects || []);
      setActiveSubjectRecords(result.data?.activeSubjects || result.data?.subjects || []);
    }
  }

  async function loadOngoingLessons() {
    const token = localStorage.getItem("token");
    if (token) {
      const result = await getStudentOngoingLessons(token);
      if (result.success) {
        setStudentOngoingLessons(result.lessons || []);
        return;
      }
    }

    const biologySubject = await resolveSubjectRecordByName("Biology");
    if (biologySubject?._id || biologySubject?.id) {
      const result = await getSubjectLessons(token || "", biologySubject._id || biologySubject.id);
      if (result.success) {
        setStudentOngoingLessons((result.lessons || []).slice(0, 3));
      }
    }
  }

  async function resolveSubjectRecordByName(subjectName) {
    const existingRecord = studentSubjectRecords.find(
      (record) => normalizeName(record.name) === normalizeName(subjectName)
    );
    if (existingRecord) return existingRecord;

    const publicSubjects = await getSubjects();
    if (!publicSubjects.success) return null;

    const matchedRecord = (publicSubjects.subjects || []).find((record) =>
      normalizeName(record.name) === normalizeName(subjectName)
    );

    if (matchedRecord) {
      setStudentSubjectRecords((prev) => {
        const exists = prev.some((record) => String(record._id || record.id) === String(matchedRecord._id || matchedRecord.id));
        return exists ? prev : [...prev, matchedRecord];
      });
    }

    return matchedRecord || null;
  }
  async function loadClassPosts(filters = {}) {
    setLoading(true);
    setError(null);
    const result = await getApprovedPosts(filters);
    if (result.success) {
      setClassPosts(result.posts);
    } else {
      setError(result.error);
      console.error("Failed to load class posts:", result.error);
    }
    setLoading(false);
  }

  // Handle search and filtering
  useEffect(() => {
    loadClassPosts(searchFilters);
  }, [searchFilters]);

  // Load past papers when lesson or filters change
  useEffect(() => {
    const lessonId = selectedLearningLesson?.rawLesson?._id || selectedLearningLesson?.id;
    console.log('useEffect loadPastPapers: selectedLearningLesson', selectedLearningLesson, 'lessonId', lessonId);
    if (lessonId) {
      loadPastPapers(lessonId);
    }
  }, [selectedLearningLesson, selectedPaperYear, selectedPaperType]);

  const motivationText = "Stay focused. Small daily progress leads to big A/L results.";
  const getColomboGreeting = () => {
    const colomboHour = Number(new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Colombo",
      hour: "2-digit",
      hour12: false,
    }).format(new Date()));

    if (colomboHour < 12) return "Good Morning";
    if (colomboHour < 17) return "Good Afternoon";
    if (colomboHour < 21) return "Good Evening";
    return "Have a calm study session";
  };
  const dashboardGreeting = `${getColomboGreeting()}, ${student.name.split(" ")[0] || student.name}!`;
  const motivationSinhala = "අද ඔබ තබන සෑම කුඩා පියවරක්ම, හෙට ඔබේ විශිෂ්ට ජයග්‍රහණයට පදනමයි.";
  const alExamDate = new Date("2026-11-25"); // Sample A/L Exam Date
  const today = new Date();
  const daysLeft = Math.ceil((alExamDate - today) / (1000 * 60 * 60 * 24));

  const latestNews = [
    {
      id: 1,
      title: "2026 A/L timetable expected to be released next month",
      sinhala: "2026 A/L කාලසටහන ලබන මාසයේ නිකුත් වේ",
      tag: "Exam",
      date: "Apr 20, 2026",
      details:
        "The official 2026 A/L timetable is expected soon. Students should keep revision plans flexible and continue covering syllabus units while waiting for the confirmed dates.",
      sinhalaDetails:
        "2026 A/L කාලසටහන ඉදිරියේදී නිකුත් වීමට නියමිතයි. නිල දිනයන් එන තුරු syllabus පාඩම් සහ revision සැලැස්ම අඛණ්ඩව කරගෙන යන්න.",
    },
    {
      id: 2,
      title: "Science stream revision seminar announced for May 2026",
      sinhala: "විද්‍යා ධාරා සංශෝධන සම්මන්ත්‍රණයක් 2026 මැයි මසදී",
      tag: "Seminar",
      date: "Apr 18, 2026",
      details:
        "A revision seminar for science stream students is planned for May 2026. Focus areas include Physics, Chemistry and Biology theory recap with past paper practice.",
      sinhalaDetails:
        "විද්‍යා ධාරා සිසුන් සඳහා මැයි 2026 සංශෝධන සම්මන්ත්‍රණයක් සැලසුම් කර ඇත. Physics, Chemistry, Biology theory සහ past paper practice ප්‍රධාන කරුණු වේ.",
    },
    {
      id: 3,
      title: "Department releases updated past paper guidance for 2026",
      sinhala: "දෙපාර්තමේන්තුව 2026 සඳහා නවතම මාර්ගෝපදේශ නිකුත් කරයි",
      tag: "Update",
      date: "Apr 15, 2026",
      details:
        "Updated past paper guidance helps students understand how to practice recent papers, identify weak areas and improve answer timing before the A/L exam.",
      sinhalaDetails:
        "නව past paper මාර්ගෝපදේශයෙන් ප්‍රශ්න පත්‍ර පුහුණුව, දුර්වල තැන් හඳුනාගැනීම සහ answer timing වැඩි දියුණු කරගැනීමට උදව් වේ.",
    },
    {
      id: 4,
      title: "Biology practical revision notes updated",
      sinhala: "Biology practical revision සටහන් යාවත්කාලීන කර ඇත",
      tag: "Biology",
      date: "Apr 12, 2026",
      details:
        "New Biology practical revision notes are available with diagrams, key observations and common exam-style questions for quick practice.",
      sinhalaDetails:
        "Biology practical සඳහා diagrams, observations සහ exam-style questions ඇතුළත් නව revision සටහන් දැන් ලබාගත හැක.",
    },
    {
      id: 5,
      title: "Combined Maths model paper discussion added",
      sinhala: "Combined Maths model paper සාකච්ඡාවක් එක් කර ඇත",
      tag: "Maths",
      date: "Apr 10, 2026",
      details:
        "A new Combined Maths model paper discussion is added to help students improve problem-solving speed and identify repeated question patterns.",
      sinhalaDetails:
        "Combined Maths model paper discussion එකෙන් problem-solving speed වැඩි කරගැනීමට සහ නැවත නැවත එන question patterns හඳුනාගැනීමට උදව් වේ.",
    },
    {
      id: 6,
      title: "Chemistry organic reactions short notes released",
      sinhala: "Chemistry organic reactions කෙටි සටහන් නිකුත් කර ඇත",
      tag: "Chemistry",
      date: "Apr 08, 2026",
      details:
        "Short notes for organic reaction mechanisms are now available with summary tables and important conversion paths.",
      sinhalaDetails:
        "Organic reaction mechanisms සඳහා summary tables සහ වැදගත් conversion paths ඇතුළත් කෙටි සටහන් දැන් ලබාගත හැක.",
    },
    {
      id: 7,
      title: "Physics mechanics MCQ practice set updated",
      sinhala: "Physics mechanics MCQ පුහුණු ප්‍රශ්න යාවත්කාලීන කර ඇත",
      tag: "Physics",
      date: "Apr 05, 2026",
      details:
        "The mechanics MCQ practice set now includes more exam-focused questions with instant answer checking and feedback.",
      sinhalaDetails:
        "Mechanics MCQ set එකට exam-focused questions වැඩි කර ඇති අතර instant answer checking සහ feedback ලබාගත හැක.",
    },
    {
      id: 8,
      title: "Accounting final accounts revision class announced",
      sinhala: "Accounting final accounts revision පන්තියක් නිවේදනය කර ඇත",
      tag: "Commerce",
      date: "Apr 02, 2026",
      details:
        "A focused revision class for final accounts has been announced for commerce students preparing for the 2026 A/L exam.",
      sinhalaDetails:
        "2026 A/L සඳහා සූදානම් වන Commerce සිසුන්ට final accounts පිළිබඳ focused revision පන්තියක් නිවේදනය කර ඇත.",
    },
  ];

  const isRecentNotification = (dateValue, days = 30) => {
    if (!dateValue) return false;
    const timestamp = new Date(dateValue).getTime();
    if (Number.isNaN(timestamp)) return false;
    return Date.now() - timestamp <= days * 24 * 60 * 60 * 1000;
  };

  const classUpdateCount = classPosts.filter((post) =>
    isRecentNotification(post.updatedAt || post.createdAt)
  ).length;
  const subjectUpdateCount = latestNews.filter((item) => item.tag === "Update").length;
  const notificationItems = [
    ...classPosts
      .filter((post) => isRecentNotification(post.updatedAt || post.createdAt))
      .slice(0, 5)
      .map((post) => ({
        id: `class-${post._id || post.id}`,
        type: "Class Update",
        title: post.title || "New class details updated",
        text: `${post.subject || "Subject"} class details updated`,
        date: post.updatedAt || post.createdAt,
      })),
    ...latestNews
      .filter((item) => item.tag === "Update")
      .map((item) => ({
        id: `subject-${item.id}`,
        type: "Subject Update",
        title: item.title,
        text: item.sinhala || "Subject details updated",
        date: item.date,
      })),
  ];
  const notificationCount = settings.notifications
    ? classUpdateCount + subjectUpdateCount
    : 0;
  const notificationBadgeText = notificationCount > 99 ? "99+" : String(notificationCount);

  const ongoingLessons = [];

  const newClasses = [
    {
      id: 1,
      title: "Physics Revision Class",
      sinhala: "භෞතික විද්‍යා සංශෝධන පන්තිය",
      teacher: "Mr. Perera",
      date: "Oct 28",
      time: "4:00 PM",
      tag: "Online",
      color: "blue",
    },
    {
      id: 2,
      title: "Chemistry Theory Class",
      sinhala: "රසායන විද්‍යා න්‍යාය පන්තිය",
      teacher: "Ms. Silva",
      date: "Nov 01",
      time: "9:00 AM",
      tag: "Physical",
      color: "green",
    },
    {
      id: 3,
      title: "Combined Maths MCQ Class",
      sinhala: "සංයුක්ත ගණිත MCQ පන්තිය",
      teacher: "Mr. Fernando",
      date: "Nov 05",
      time: "6:00 PM",
      tag: "Online",
      color: "purple",
    },
  ];

  const [showAiBubble] = useState(true);

  // Legacy fallback map kept only to avoid disturbing earlier dashboard data.
  // eslint-disable-next-line no-unused-vars
  const subjectMap = {
    Science: [
      { name: "Physics", progress: 68, icon: "⚛️" },
      { name: "Chemistry", progress: 62, icon: "🧪" },
      { name: "Biology", progress: 71, icon: "🌿" },
      { name: "Combined Maths", progress: 55, icon: "📈" },
      { name: "ICT", progress: 60, icon: "💻" },
    ],
    Commerce: [
      { name: "Accounting", progress: 64, icon: "📘" },
      { name: "Economics", progress: 58, icon: "💹" },
      { name: "Business Studies", progress: 70, icon: "🏢" },
      { name: "ICT", progress: 61, icon: "💻" },
    ],
    Arts: [
      { name: "Political Science", progress: 66, icon: "🏛️" },
      { name: "History", progress: 60, icon: "📜" },
      { name: "Sinhala", progress: 74, icon: "📝" },
      { name: "Geography", progress: 63, icon: "🌍" },
      { name: "Logic", progress: 57, icon: "🧠" },
    ],
  };

  // Legacy fallback details kept while the exact stream map is active below.
  // eslint-disable-next-line no-unused-vars
  const subjectDetailsMap = {
    Science: [
      { name: "Physics", sinhala: "භෞතික විද්‍යාව", progress: 62, icon: "Ω", lessons: "24 lessons", completed: "15/24", color: "blue" },
      { name: "Chemistry", sinhala: "රසායන විද්‍යාව", progress: 48, icon: "△", lessons: "28 lessons", completed: "13/28", color: "green" },
      { name: "Biology", sinhala: "ජීව විද්‍යාව", progress: 75, icon: "◇", lessons: "32 lessons", completed: "24/32", color: "teal" },
      { name: "Combined Maths", sinhala: "සංයුක්ත ගණිතය", progress: 35, icon: "▦", lessons: "40 lessons", completed: "14/40", color: "orange" },
      { name: "ICT", sinhala: "තොරතුරු තාක්ෂණය", progress: 90, icon: "▭", lessons: "18 lessons", completed: "16/18", color: "sky" },
    ],
    Commerce: [
      { name: "Accounting", sinhala: "ගිණුම්කරණය", progress: 64, icon: "▣", lessons: "22 lessons", completed: "14/22", color: "green" },
      { name: "Economics", sinhala: "ආර්ථික විද්‍යාව", progress: 58, icon: "◇", lessons: "24 lessons", completed: "14/24", color: "orange" },
      { name: "Business Studies", sinhala: "ව්‍යාපාර අධ්‍යයනය", progress: 70, icon: "▦", lessons: "26 lessons", completed: "18/26", color: "blue" },
      { name: "ICT", sinhala: "තොරතුරු තාක්ෂණය", progress: 61, icon: "▭", lessons: "18 lessons", completed: "11/18", color: "sky" },
    ],
    Arts: [
      { name: "Political Science", sinhala: "දේශපාලන විද්‍යාව", progress: 66, icon: "▥", lessons: "24 lessons", completed: "16/24", color: "blue" },
      { name: "History", sinhala: "ඉතිහාසය", progress: 60, icon: "▤", lessons: "20 lessons", completed: "12/20", color: "orange" },
      { name: "Sinhala", sinhala: "සිංහල", progress: 74, icon: "✎", lessons: "22 lessons", completed: "16/22", color: "teal" },
      { name: "Geography", sinhala: "භූගෝල විද්‍යාව", progress: 63, icon: "◎", lessons: "20 lessons", completed: "13/20", color: "green" },
      { name: "Logic", sinhala: "තර්ක ශාස්ත්‍රය", progress: 57, icon: "◇", lessons: "18 lessons", completed: "10/18", color: "purple" },
    ],
  };

  const streamSubjectMap = {
    "Bio Science": {
      title: "Biology Stream",
      sinhala: "ජීව විද්‍යා ධාරාව",
      icon: "♙",
      color: "green",
      subjects: [
        { name: "Biology", sinhala: "ජීව විද්‍යාව", icon: "♧", papers: 45, students: 1200, color: "green" },
        { name: "Chemistry", sinhala: "රසායන විද්‍යාව", icon: "⚗", papers: 42, students: 1150, color: "green" },
        { name: "Physics", sinhala: "භෞතික විද්‍යාව", icon: " ", papers: 40, students: 1100, color: "green" },
      ],
    },
    "Physical Science": {
      title: "Mathematics Stream",
      sinhala: "ගණිත ධාරාව",
      icon: "▦",
      color: "blue",
      subjects: [
        { name: "Combined Mathematics", sinhala: "ඒකාබද්ධ ගණිතය", icon: "▦", papers: 50, students: 980, color: "blue" },
        { name: "Physics", sinhala: "භෞතික විද්‍යාව", icon: " ", papers: 40, students: 950, color: "blue" },
        { name: "Chemistry", sinhala: "රසායන විද්‍යාව", icon: "⚗", papers: 42, students: 920, color: "blue" },
      ],
    },
    Commerce: {
      title: "Commerce Stream",
      sinhala: "වාණිජ ධාරාව",
      icon: "▥",
      color: "orange",
      subjects: [
        { name: "Accounting", sinhala: "ගිණුම්කරණය", icon: "⊙", papers: 38, students: 850, color: "orange" },
        { name: "Business Studies", sinhala: "ව්‍යාපාර අධ්‍යයනය", icon: "▤", papers: 35, students: 820, color: "orange" },
        { name: "Economics", sinhala: "ආර්ථික විද්‍යාව", icon: "⌁", papers: 36, students: 800, color: "orange" },
      ],
    },
    Arts: {
      title: "Arts Stream",
      sinhala: "කලා ධාරාව",
      icon: "▯",
      color: "purple",
      subjects: [
        { name: "Sinhala", sinhala: "සිංහල", icon: "文", papers: 32, students: 750, color: "purple" },
        { name: "History", sinhala: "ඉතිහාසය", icon: "▤", papers: 30, students: 720, color: "purple" },
        { name: "Geography", sinhala: "භූගෝල විද්‍යාව", icon: "◔", papers: 28, students: 700, color: "purple" },
      ],
    },
    Technology: {
      title: "Technology Stream",
      sinhala: "තාක්ෂණවේදය ධාරාව",
      icon: "⚙",
      color: "teal",
      subjects: [
        { name: "Science for Technology", sinhala: "තාක්ෂණවේදය සඳහා විද්‍යාව", icon: "⚗", papers: 34, students: 780, color: "teal" },
        { name: "Engineering Technology", sinhala: "ඉංජිනේරු තාක්ෂණවේදය", icon: "⚒", papers: 31, students: 700, color: "teal" },
        { name: "Bio-systems Technology", sinhala: "ජෛව පද්ධති තාක්ෂණවේදය", icon: "♧", papers: 30, students: 690, color: "teal" },
      ],
    },
  };

  const selectedStream = streamSubjectMap[student.stream]
    ? student.stream
    : student.stream === "Science"
      ? "Bio Science"
      : "Bio Science";
  const currentStream = streamSubjectMap[selectedStream];
  const normalizeName = (value) => String(value || "").trim().toLowerCase();
  const getMcqOptionLabel = (option, index) =>
    typeof option === "object" ? String(option.label ?? option.value ?? index + 1) : String(index + 1);
  const getMcqOptionText = (option) =>
    typeof option === "object" ? String(option.text ?? option.label ?? option.value ?? "") : String(option ?? "");
  const getMcqAnswerText = (answer) =>
    typeof answer === "object" ? String(answer.text ?? answer.label ?? answer.value ?? "") : String(answer ?? "");
  const findStudentSubjectRecord = (subjectName) =>
    studentSubjectRecords.find((record) => normalizeName(record.name) === normalizeName(subjectName));
  const dbSubjectsForCurrentStream = studentSubjectRecords.filter((record) => {
    const streamName = record.stream?.name || selectedStream;
    return normalizeName(streamName) === normalizeName(selectedStream);
  });
  const dbSubjectCards = dbSubjectsForCurrentStream.map((record) => ({
    name: record.name,
    sinhala: record.sinhalaName || record.name,
    icon: record.icon || "□",
    papers: record.papersCount ?? 0,
    students: record.studentsCount ?? 0,
    color: record.color || currentStream.color,
    id: record._id || record.id,
    dbSubject: record,
  }));
  const baseCurrentSubjects = [
    ...currentStream.subjects,
    ...dbSubjectCards.filter((record) =>
      !currentStream.subjects.some((subject) => normalizeName(subject.name) === normalizeName(record.name))
    ),
  ];
  const currentSubjects = baseCurrentSubjects.map((subject) => {
    const record = findStudentSubjectRecord(subject.name);
    return {
      ...subject,
      id: subject.id || record?._id || record?.id,
      dbSubject: subject.dbSubject || record || null,
      sinhala: record?.sinhalaName || subject.sinhala,
      papers: record?.papersCount ?? subject.papers,
      students: record?.studentsCount ?? subject.students,
      icon: record?.icon || subject.icon,
      color: record?.color || subject.color,
    };
  });
  const subjectIconMap = {
    physics: "⚛",
    atom: "⚛",
    chemistry: "△",
    biology: "♧",
    sprout: "♧",
    leaf: "♧",
    flask: "△",
    "combined maths": "▦",
    "combined mathematics": "▦",
    maths: "▦",
    mathematics: "▦",
    ict: "▱",
    accounting: "⊙",
    economics: "⌁",
    commerce: "▥",
  };
  const subjectColorMap = {
    physics: "teal",
    chemistry: "teal",
    biology: "green",
    "combined maths": "orange",
    "combined mathematics": "orange",
    ict: "sky",
    accounting: "green",
    economics: "orange",
  };
  const getSubjectIcon = (subject) => {
    const iconKey = normalizeName(subject.icon);
    const nameKey = normalizeName(subject.name);
    return subjectIconMap[iconKey] || subjectIconMap[nameKey] || subject.icon || "□";
  };
  const getSubjectCardColor = (subject) =>
    subjectColorMap[normalizeName(subject.name)] || subject.color || "green";
  const activeSubjectMap = new Map();
  activeSubjectRecords
    .forEach((subject) => {
      const streamName = subject.stream?.name || selectedStream;
      const hasActivity =
        Number(subject.completedLessons || 0) > 0 ||
        Number(subject.progressPercent || 0) > 0;

      if (normalizeName(streamName) !== normalizeName(selectedStream) || !hasActivity) return;

      const fallback = currentSubjects.find((item) => normalizeName(item.name) === normalizeName(subject.name)) || {};
      const lessonCount = subject.lessonCount ?? fallback.lessonsCount ?? fallback.lessonCount ?? 0;
      const completedLessons = subject.completedLessons ?? 0;
      const progressPercent = subject.progressPercent ?? fallback.progress ?? 0;
      const activeSubject = {
        ...fallback,
        ...subject,
        id: subject._id || subject.id || fallback.id,
        sinhala: subject.sinhalaName || subject.sinhala || fallback.sinhala,
        icon: getSubjectIcon({ ...fallback, ...subject }),
        color: getSubjectCardColor({ ...fallback, ...subject }),
        lessonCount,
        completedLessons,
        progressPercent,
      };
      const subjectNameKey = normalizeName(activeSubject.name);
      const existingSubject = activeSubjectMap.get(subjectNameKey);
      if (!existingSubject || activeSubject.progressPercent > existingSubject.progressPercent) {
        activeSubjectMap.set(subjectNameKey, activeSubject);
      }
    });
  const activeSubjects = [...activeSubjectMap.values()];
  const currentSubjectNames = currentSubjects.map((subject) => subject.name).join(", ");
  const currentSubjectSet = new Set(currentSubjects.map((subject) => subject.name));
  const getYoutubeEmbedUrl = (url) => {
    if (!url) return "";
    const text = String(url);
    const watchMatch = text.match(/[?&]v=([^&]+)/);
    if (watchMatch) return `https://www.youtube.com/embed/${watchMatch[1]}`;
    const shortMatch = text.match(/youtu\.be\/([^?]+)/);
    if (shortMatch) return `https://www.youtube.com/embed/${shortMatch[1]}`;
    return text;
  };
  const splitVideoLinks = (value) => {
    if (!value) return [];
    if (Array.isArray(value)) return value.flatMap((item) => splitVideoLinks(item));
    if (typeof value === "object") {
      return splitVideoLinks(value.url || value.link || value.videoLink || value.videoUrl || Object.values(value));
    }
    const text = String(value);
    const urls = text.match(/https?:\/\/[^\s,;]+/g);
    if (urls) return urls;
    return text
      .split(/[\n,;]+/)
      .map((item) => item.trim())
      .filter(Boolean);
  };
  const getLessonVideoItems = (lesson) => {
    const structuredVideos = Array.isArray(lesson.videos)
      ? lesson.videos
          .map((video, index) => ({
            title:
              typeof video === "object" && video?.title
                ? video.title
                : `${lesson.title} - Video ${index + 1}`,
            url: getYoutubeEmbedUrl(
              typeof video === "string"
                ? video
                : video?.url || video?.link || video?.videoLink || video?.videoUrl
            ),
            duration:
              typeof video === "object" && video?.durationMinutes
                ? video.durationMinutes
                : lesson.durationMinutes || 0,
          }))
      : [];

    const linkVideos = [
      ...splitVideoLinks(lesson.videoLink),
      ...splitVideoLinks(lesson.videoUrl),
      ...splitVideoLinks(lesson.videoLinks),
      ...splitVideoLinks(lesson.videoUrls),
    ].map((url, index) => ({
      title: index === 0 && lesson.videoTitle ? lesson.videoTitle : `${lesson.title} - Video ${index + 1}`,
      url: getYoutubeEmbedUrl(url),
      duration: lesson.durationMinutes || 0,
    }));

    const uniqueVideos = [...structuredVideos, ...linkVideos].filter(
      (video, index, all) => video.url && all.findIndex((item) => item.url === video.url) === index
    );

    return uniqueVideos;
  };
  const getPublicFileUrl = (url) => {
    if (!url) return "";
    const text = String(url).trim();
    if (/^https?:\/\//i.test(text)) return text;
    return text.startsWith("/") ? text : `/${text}`;
  };
  const getLessonNoteItems = (lesson) => {
    const structuredNotes = Array.isArray(lesson.notes)
      ? lesson.notes
          .map((note, index) => {
            const fileUrl = typeof note === "string" ? note : note?.fileUrl || note?.url || note?.path || note?.notesUrl;
            return {
              title:
                typeof note === "object" && note?.title
                  ? note.title
                  : `${lesson.title} Notes ${index + 1}`,
              sinhalaTitle: typeof note === "object" ? note?.sinhalaTitle || "" : "",
              fileUrl: getPublicFileUrl(fileUrl),
              pages: typeof note === "object" ? note?.pages || 0 : 0,
              size: typeof note === "object" ? note?.fileSize || note?.size || "" : "",
            };
          })
          .filter((note) => note.fileUrl)
      : [];

    if (structuredNotes.length > 0) return structuredNotes;
    if (lesson.notesUrl) {
      return [{
        title: `${lesson.title} Notes`,
        sinhalaTitle: "",
        fileUrl: getPublicFileUrl(lesson.notesUrl),
        pages: 0,
        size: "",
      }];
    }
    return [];
  };
  const lessonIconMap = {
    "book-open": "▯",
    book: "▯",
    flask: "△",
    microscope: "♙",
    leaf: "♧",
    dna: "♢",
  };
  const dbLessonCards = studentLessonRecords.map((lesson, index) => ({
    id: lesson._id || lesson.id || `${lesson.title}-${index}`,
    title: lesson.title,
    sinhala: lesson.sinhalaTitle || lesson.description || "",
    icon: lessonIconMap[lesson.icon] || lesson.icon || "▯",
    progress: lesson.progressPercent ?? 0,
    videoItems: getLessonVideoItems(lesson),
    videos: getLessonVideoItems(lesson).length,
    noteItems: getLessonNoteItems(lesson),
    notes: getLessonNoteItems(lesson).length,
    papers: lesson.pastPaperCount ?? 0,
    duration: lesson.durationMinutes || 45,
    views: lesson.viewCount ? Number(lesson.viewCount).toLocaleString() : "0",
    updated: lesson.updatedLabel || (lesson.createdAt ? new Date(lesson.createdAt).toLocaleDateString() : "Recently"),
    videoUrl: getLessonVideoItems(lesson)[0]?.url || "",
    rawLesson: lesson,
  }));
  const selectedLessonCards = dbLessonCards;
  const selectedLessonStats = selectedLessonCards.reduce(
    (total, lesson) => ({
      videos: total.videos + Number(lesson.videos || 0),
      notes: total.notes + Number(lesson.notes || 0),
      papers: total.papers + Number(lesson.papers || 0),
    }),
    { videos: 0, notes: 0, papers: 0 }
  );
  const paperYears = [2025, 2024, 2023, 2022, 2021, 2020];
  const paperTypeLabels = { mcq: "MCQ", structured: "Structure", essay: "Essay" };
  const mapOngoingLessonCard = (lesson, index) => {
    const subjectName = lesson.subject?.name || lesson.subject || "Biology";
    return {
      id: lesson._id || lesson.id || `${lesson.title}-${index}`,
      title: lesson.title,
      sinhala: lesson.sinhalaTitle || lesson.description || "",
      subject: subjectName,
      progress: lesson.progressPercent ?? 0,
      chapter: lesson.chapter || (lesson.order ? `Chapter ${String(lesson.order).padStart(2, "0")}` : `Chapter ${String(index + 1).padStart(2, "0")}`),
      color: "green",
      icon: lessonIconMap[lesson.icon] || lesson.icon || "⌂",
      rawLesson: lesson,
    };
  };
  const homeLessons = studentOngoingLessons.map(mapOngoingLessonCard).slice(0, 3);
  const homeClasses = [
    {
      id: "mock-physics-revision",
      title: "Physics Revision Class",
      sinhala: "භෞතික විද්‍යා සංශෝධන පන්තිය",
      teacher: "Mr. Perera",
      date: "Oct 28",
      time: "4:00 PM",
      tag: "Online",
      color: "orange",
      action: "Join Class",
    },
    {
      id: "mock-chemistry-theory",
      title: "Chemistry Theory Class",
      sinhala: "රසායන විද්‍යා න්‍යාය පන්තිය",
      teacher: "Ms. Silva",
      date: "Nov 01",
      time: "9:00 AM",
      tag: "Physical",
      color: "rose",
      action: "View Details",
    },
    {
      id: "mock-combined-maths-mcq",
      title: "Combined Maths MCQ Class",
      sinhala: "ඒකාබද්ධ ගණිත MCQ පන්තිය",
      teacher: "Mr. Fernando",
      date: "Nov 05",
      time: "6:00 PM",
      tag: "Online",
      color: "teal",
      action: "Join Class",
    },
  ];

  const classColorCycle = ["orange", "rose", "teal", "blue", "green"];
  const dashboardHomeClasses = classPosts.slice(0, 3).map((post, index) => ({
    id: post._id || post.id,
    title: post.title,
    sinhala: post.description,
    subject: post.subject,
    teacher: post.teacher?.name || "Teacher",
    date: post.createdAt ? new Date(post.createdAt).toLocaleDateString() : "Recently",
    time: post.schedule || post.duration || "Schedule TBA",
    tag: post.location?.toLowerCase().includes("online") ? "Online" : post.location || post.grade,
    color: classColorCycle[index % classColorCycle.length],
    rawPost: post,
  }));
  const groupedClasses = classPosts.reduce((acc, post) => {
    if (!acc[post.subject]) acc[post.subject] = [];
    acc[post.subject].push({
      id: post._id,
      title: post.title,
      sinhala: post.title,
      subject: post.subject,
      teacher: post.teacher?.name || "Teacher",
      date: new Date(post.createdAt).toLocaleDateString(),
      time: post.schedule || "TBD",
      tag: post.location?.includes("Online") ? "Online" : "Physical",
      color: "blue",
      description: post.description,
      grade: post.grade,
      location: post.location,
      schedule: post.schedule,
      duration: post.duration,
      fee: post.fee,
      contactInfo: post.contactInfo,
      rawPost: post,
    });
    return acc;
  }, {});

  const pastPaperItems = [
    "2023 Physics Paper",
    "2022 Chemistry Paper",
    "2021 Biology Paper",
    "2024 Combined Maths Paper",
  ];

  const paperSubjectOptions = [
    "All",
    ...new Set(
      [
        ...currentPapers.map((paper) => paper.subject).filter(Boolean),
        ...studentSubjectRecords.map((subject) => subject.name || subject.subject || subject.title).filter(Boolean),
      ]
    ),
  ];

  const filteredCurrentPapers = currentPapers.filter((paper) => {
    if (selectedPaperSubject === "All") return true;
    return paper.subject === selectedPaperSubject;
  });

  useEffect(() => {
    if (selectedPaperSubject !== "All" && !paperSubjectOptions.includes(selectedPaperSubject)) {
      setSelectedPaperSubject("All");
    }
  }, [paperSubjectOptions, selectedPaperSubject]);

  // Handlers
  const handleToggleSetting = (field) => {
    setSettings((prev) => {
      const updated = {
        ...prev,
        [field]: !prev[field],
      };

      if (field === "darkMode") {
        document.body.classList.toggle("dark-mode", updated[field]);
      }

      return updated;
    });
  };

  async function submitComment(postId, commentText) {
    const token = localStorage.getItem("token");
    const result = await createComment(token, {
      postId,
      content: commentText
    });

    if (result.success) {
      alert("Comment submitted successfully! The teacher will respond soon.");
      // Could refresh comments if we had a comments view
    } else {
      alert("Error: " + result.error);
    }
  }

  async function handleSelectSubject(subject) {
    let subjectForLessons = subject;
    setSelectedLearningLesson(null);
    setStudentLessonRecords([]);
    setLessonError("");

    if (!subjectForLessons?.id) {
      const token = localStorage.getItem("token");
      if (token) {
        const freshSubjects = await getStudentSubjects(token);
        if (freshSubjects.success) {
          const records = freshSubjects.data?.subjects || [];
          setStudentSubjectRecords(records);
          const matchedRecord = records.find((record) => normalizeName(record.name) === normalizeName(subject.name));
          if (matchedRecord) {
            subjectForLessons = {
              ...subject,
              id: matchedRecord._id || matchedRecord.id,
              dbSubject: matchedRecord,
              sinhala: matchedRecord.sinhalaName || subject.sinhala,
              papers: matchedRecord.papersCount ?? subject.papers,
              students: matchedRecord.studentsCount ?? subject.students,
              icon: matchedRecord.icon || subject.icon,
              color: matchedRecord.color || subject.color,
            };
          }
        }
      }
    }

    if (!subjectForLessons?.id) {
      const publicSubjects = await getSubjects();
      if (publicSubjects.success) {
        const matchedRecord = (publicSubjects.subjects || []).find((record) =>
          normalizeName(record.name) === normalizeName(subject.name) &&
          normalizeName(record.stream?.name) === normalizeName(selectedStream)
        );
        if (matchedRecord) {
          subjectForLessons = {
            ...subject,
            id: matchedRecord._id || matchedRecord.id,
            dbSubject: matchedRecord,
            sinhala: matchedRecord.sinhalaName || subject.sinhala,
            papers: matchedRecord.papersCount ?? subject.papers,
            students: matchedRecord.studentsCount ?? subject.students,
            icon: matchedRecord.icon || subject.icon,
            color: matchedRecord.color || subject.color,
          };
        }
      }
    }

    setSelectedSubject(subjectForLessons);

    if (!subjectForLessons?.id) {
      setLessonError("This subject is not linked with the database yet. Please check the Biology subject in MongoDB.");
      return;
    }

    const token = localStorage.getItem("token");
    setLessonLoading(true);
    const studentResult = token
      ? await getStudentLessons(token, subjectForLessons.id)
      : { success: false };

    if (studentResult.success) {
      setStudentLessonRecords(studentResult.lessons || []);
    } else {
      const publicResult = await getSubjectLessons(token || "", subjectForLessons.id);
      if (publicResult.success) {
        setStudentLessonRecords(publicResult.lessons || []);
      } else {
        setLessonError(publicResult.error || studentResult.error || "Failed to load lessons.");
      }
    }
    setLessonLoading(false);
  }

  // eslint-disable-next-line no-unused-vars
  async function openBiologySubject() {
    const biologySubject = currentSubjects.find((subject) => normalizeName(subject.name) === "biology") || {
      name: "Biology",
      sinhala: "ජීව විද්‍යාව",
      color: "green",
      icon: "⌂",
    };

    await handleSelectSubject(biologySubject);
    setActiveView("subjects");
  }

  async function handleStartMcqPractice(paper = null) {
    const lessonId = selectedLearningLesson?.rawLesson?._id || selectedLearningLesson?.id;
    if (!lessonId) {
      setMcqError("Lesson id is missing.");
      setShowMcqPractice(true);
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      setMcqError("Please login again to start MCQ practice.");
      setShowMcqPractice(true);
      return;
    }

    setShowMcqPractice(true);
    setMcqLoading(true);
    setMcqError("");
    setMcqResult(null);
    setMcqAnswers({});

    // Check if this is a virtual MCQ paper
    if (paper && paper.isVirtual && paper.paperType === 'mcq') {
      const result = await getVirtualPaperQuestions(token, paper.id);
      if (result.success) {
        setMcqQuestions(result.data.questions || []);
        if (!result.data.questions?.length) {
          setMcqError("No MCQ questions found for this paper.");
        }
      } else {
        setMcqQuestions([]);
        setMcqError(result.error || "Failed to load MCQ questions.");
      }
    } else {
      // Use the existing endpoint for all MCQs in the lesson
      const result = await getStudentMcqsByLesson(token, lessonId);
      let loadedMcqs = [];

      if (result.success && result.mcqs?.length > 0) {
        loadedMcqs = result.mcqs;
      } else {
        const fallback = await getQuestionsForLesson(token, lessonId, "mcq");
        if (fallback.success && fallback.questions?.length > 0) {
          loadedMcqs = fallback.questions.map((question) => ({
            _id: question._id || question.id,
            id: question._id || question.id,
            questionText: question.prompt || question.questionText || "",
            options: (question.options || []).map((option, index) => {
              if (typeof option === "object") {
                return {
                  label: option.label || option.value || String(index + 1),
                  text: option.text || option.label || option.value || "",
                };
              }
              return {
                label: String(index + 1),
                text: String(option || ""),
              };
            }),
            year: question.examYear || question.year,
            questionNumber: question.questionNumber || 0,
          }));
        }
      }

      if (loadedMcqs.length > 0) {
        setMcqQuestions(loadedMcqs);
      } else {
        setMcqQuestions([]);
        setMcqError("No MCQ questions found for this lesson.");
      }
    }
    setMcqLoading(false);
  }

  async function handleStartStructuredPractice(paper) {
    const lessonId = selectedLearningLesson?.rawLesson?._id || selectedLearningLesson?.id;
    if (!lessonId) {
      setStructuredError("Lesson id is missing.");
      setShowStructuredPractice(true);
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      setStructuredError("Please login again to start structured practice.");
      setShowStructuredPractice(true);
      return;
    }

    setShowStructuredPractice(true);
    setStructuredLoading(true);
    setStructuredError("");

    // Check if this is a virtual paper (from AssessmentQuestion collection)
    if (paper.isVirtual) {
      const result = await getVirtualPaperQuestions(token, paper.id);
      if (result.success) {
        setStructuredQuestions(result.data.questions || []);
        if (!result.data.questions?.length) {
          setStructuredError("No structured questions found for this paper.");
        }
      } else {
        setStructuredQuestions([]);
        setStructuredError(result.error || "Failed to load structured questions.");
      }
    } else {
      // For real past papers, use existing logic or show message
      setStructuredQuestions([]);
      setStructuredError("Structured questions are only available for virtual papers created from assessment questions.");
    }
    
    setStructuredLoading(false);
  }

  async function handleSubmitMcqPractice() {
    const lessonId = selectedLearningLesson?.rawLesson?._id || selectedLearningLesson?.id;
    const token = localStorage.getItem("token");
    if (!lessonId || !token) return;

    setMcqLoading(true);
    setMcqError("");
    const result = await submitStudentMcqs(token, {
      lessonId,
      answers: mcqQuestions.map((question) => ({
        questionId: question._id || question.id,
        selectedAnswer: mcqAnswers[question._id || question.id] || "",
      })),
    });

    if (result.success) {
      setMcqResult(result.result);
    } else {
      setMcqError(result.error || "Failed to submit MCQ answers.");
    }
    setMcqLoading(false);
  }

  async function handleContinueHomeLesson(lesson) {
    const lessonId = lesson?.rawLesson?._id || lesson?.id;
    if (!lessonId) {
      setSelectedLearningLesson(lesson);
      setActiveView("subjects");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      setSelectedLearningLesson(lesson);
      setActiveView("subjects");
      return;
    }

    const result = await getStudentLessonDetails(token, lessonId);
    const rawLesson = result.success ? result.data?.lesson || lesson.rawLesson || lesson : lesson.rawLesson || lesson;
    const lessonCard = {
      ...lesson,
      title: rawLesson.title || lesson.title,
      sinhala: rawLesson.sinhalaTitle || rawLesson.description || lesson.sinhala,
      rawLesson,
      videoItems: getLessonVideoItems(rawLesson),
      videos: getLessonVideoItems(rawLesson).length,
      noteItems: getLessonNoteItems(rawLesson),
      notes: getLessonNoteItems(rawLesson).length,
      papers: rawLesson.pastPaperCount ?? lesson.papers ?? 0,
      mcqCount: result.data?.mcqs?.length ?? 0,
    };
    setSelectedLearningLesson(lessonCard);
    setActiveView("subjects");
    loadOngoingLessons();
    loadPastPapers(lessonId); // Load past papers for the selected lesson
  }

  async function loadPastPapers(lessonId) {
    if (!lessonId) {
      console.log('loadPastPapers: no lessonId provided');
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      console.log('loadPastPapers: no token');
      return;
    }

    console.log('loadPastPapers: calling API with', { lessonId, year: selectedPaperYear, type: selectedPaperType });

    setPapersLoading(true);
    setPapersError("");

    const result = await getStudentLessonPastPapers(token, lessonId, selectedPaperYear, selectedPaperType);
    console.log('loadPastPapers: API result', result);

    if (result.success) {
      setCurrentPapers(result.pastPapers || []);
      console.log('loadPastPapers: set papers', result.pastPapers?.length || 0);
    } else {
      setPapersError(result.error || "Failed to load past papers");
      setCurrentPapers([]);
    }
    setPapersLoading(false);
  }

  async function handleSendAiMessage(nextMessage) {
    const message = String(nextMessage ?? aiInput).trim();
    if (!message || aiLoading) return;

    const token = localStorage.getItem("token");
    if (!token) {
      setAiError("Please login again to use AI assistant.");
      return;
    }

    const userMessage = { role: "user", text: message };
    setAiMessages((prev) => [...prev, userMessage]);
    setAiInput("");
    setAiLoading(true);
    setAiError("");

    const result = await sendStudentChatMessage(token, {
      message,
      history: aiMessages.slice(-6),
      lessonId: selectedLearningLesson?.rawLesson?._id || selectedLearningLesson?.id || null,
      subjectId: selectedSubject?.id || selectedSubject?.dbSubject?._id || null,
    });

    if (result.success) {
      setAiMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: result.data?.reply || "I could not generate an answer right now.",
        },
      ]);
    } else {
      setAiError(result.error || "Failed to send your question.");
      setAiMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "Sorry, I could not send that question. Please try again.",
        },
      ]);
    }

    setAiLoading(false);
  }

  function renderChatText(text) {
    return String(text || "")
      .split(/(\*\*[^*]+\*\*)/g)
      .map((part, index) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return <strong key={index}>{part.slice(2, -2)}</strong>;
        }
        return <span key={index}>{part}</span>;
      });
  }

  function handleUpdateProfile(key, value) {
    setStudent(prev => ({
      ...prev,
      [key]: value
    }));
    if (key === "stream") {
      setSelectedSubject(null);
      setSelectedLearningLesson(null);
      setStudentLessonRecords([]);
      loadStudentSubjects();
    }
  }

  // Kept as a fallback while the compact dashboard design is active.
  // eslint-disable-next-line no-unused-vars
  const renderHome = () => (
    <div className="home-view">
      <div className="motivation-banner">
        <div className="motivation-content">
          <div className="motivation-icon">🌟</div>
          <p>{motivationText}</p>
        </div>
      </div>

      <div className="home-top-grid">
        <div className="dashboard-card countdown-card">
          <h3>ඔබේ විභාග සූදානම</h3>
          <p className="exam-date">Date: {alExamDate.toDateString()}</p>
          <p className="days-left"><strong>{daysLeft}</strong> Days Left</p>
        </div>

        <div className="dashboard-card news-card">
          <h3>නවතම A/L පුවත්</h3>
          <ul className="news-list">
            {latestNews.map((news) => (
              <li key={news.id}>
                <button type="button" onClick={() => setSelectedNews(news)}>
                  {news.title}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <section className="home-section">
        <h3>Ongoing Lessons</h3>
          <div className="lesson-cards-grid">
            {ongoingLessons.map((lesson) => (
              <div key={lesson.id} className="lesson-card-item">
                <h4>{lesson.title}</h4>
                <p className="lesson-meta">{lesson.subject} • {lesson.chapter}</p>
                <div className="lesson-progress-bar">
                  <div
                    className="lesson-progress-fill"
                    style={{ width: `${lesson.progress}%` }}
                  ></div>
                </div>
                <small>{lesson.progress}% Completed</small>
                <button className="btn solid sm">Continue</button>
              </div>
            ))}
          </div>
      </section>

      <section className="home-section">
        <div className="section-topline">
          <div>
            <h3>New Class Details</h3>
            <p className="section-subtitle">නව පන්ති විස්තර</p>
          </div>
          <button
            type="button"
            className="view-all-btn"
            onClick={() => {
              setSelectedSubject(null);
              setSelectedLearningLesson(null);
              setActiveView("classes");
            }}
          >
            View All
          </button>
        </div>
        <div className="class-cards-list">
          {(dashboardHomeClasses.length > 0 ? dashboardHomeClasses : homeClasses).map((cls) => (
            <div key={cls.id} className={`class-card-item ${cls.color}`}>
              <div className="class-card-top">
                <span className={`mini-icon ${cls.color}`}>▻</span>
                <small>{cls.tag}</small>
              </div>
              <div>
                <h4>{cls.title}</h4>
                <p className="lesson-sinhala">{cls.sinhala}</p>
                <p className="class-meta">Teacher: {cls.teacher}</p>
                <p className="class-meta">Date: {cls.date} &middot; {cls.time}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="home-section">
        <h3>Active Subjects</h3>
          <div className="subject-card-grid-home">
            {activeSubjects.map((subject) => (
              <button
                type="button"
                key={subject.name}
                className="subject-card-modern-home"
                onClick={() => {
                  handleSelectSubject(subject);
                  setActiveView("subjects");
                }}
              >
                <div className="subject-emoji">{subject.icon}</div>
                <h4>{subject.name}</h4>
                <p>{subject.sinhala}</p>
                <div className="active-subject-progress-meta">
                  <span>{subject.completedLessons}/{subject.lessonCount}</span>
                  <strong>{subject.progressPercent}%</strong>
                </div>
                <div className="active-subject-progress">
                  <span style={{ width: `${subject.progressPercent}%` }}></span>
                </div>
                <small>{subject.lessonCount} lessons</small>
              </button>
            ))}
            {activeSubjects.length === 0 && (
              <EmptyState
                title="No active subjects yet"
                message="Subjects you start learning will appear here."
              />
            )}
          </div>
      </section>
    </div>
  );

  const renderCompactHome = () => (
    <div className="home-view compact-dashboard">
      <div className="motivation-banner">
        <div className="motivation-content">
          <div className="motivation-icon">☀</div>
          <div>
            <p className="hero-greeting">{dashboardGreeting}</p>
            <h2>{motivationText}</h2>
            <p className="sinhala-line">{motivationSinhala}</p>
          </div>
        </div>
        <div className="hero-count-box">
          <strong>{daysLeft}</strong>
          <span>Days to A/L</span>
          <small>A/L දක්වා දින</small>
        </div>
      </div>

      <div className="home-top-grid">
        <div className="dashboard-card countdown-card compact-card">
          <div className="card-title-row">
            <span className="mini-icon blue">⏱</span>
            <div>
              <h3>A/L Exam Countdown</h3>
            </div>
          </div>
          <div className="countdown-number">
            <strong>{daysLeft}</strong>
            <span>Days Left / දින ඉතිරි</span>
          </div>
          <div className="detail-list">
            <p><span>Exam Date</span><strong>25 November 2026</strong></p>
            <p><span>Stream</span><strong>{selectedStream}</strong></p>
            <p><span>Subjects</span><strong>{currentSubjectNames}</strong></p>
          </div>
        </div>

        <div className="dashboard-card news-card compact-card">
          <div className="section-topline">
            <div className="card-title-row">
              <span className="mini-icon orange">▤</span>
              <div>
                <h3>නවතම A/L පුවත්</h3>
                <p className="section-subtitle">නවතම A/L පුවත්</p>
              </div>
            </div>
          </div>

          <div className="news-list compact-news-list">
            {latestNews.map((news) => (
              <button
                type="button"
                className="news-item"
                key={news.id}
                onClick={() => setSelectedNews(news)}
              >
                <span className="news-icon">▣</span>
                <div>
                  <h4>{news.title}</h4>
                  <p>{news.sinhala}</p>
                  <div className="tag-line">
                    <span>{news.tag}</span>
                    <small>{news.date}</small>
                  </div>
                </div>
                <strong>›</strong>
              </button>
            ))}
          </div>
        </div>
      </div>

      <section className="home-section">
        <div className="section-topline">
          <div>
            <h3>Ongoing Lessons</h3>
            <p className="section-subtitle">දැනට කරගෙන යන පාඩම්</p>
          </div>
        </div>
        <div className="lesson-cards-grid">
          {homeLessons.map((lesson) => (
            <div key={lesson.id} className={`lesson-card-item ${lesson.color}`}>
              <div className="lesson-card-top">
                <span className={`mini-icon ${lesson.color}`}>⌂</span>
                <small>{lesson.chapter}</small>
              </div>
              <h4>{lesson.title}</h4>
              <p className="lesson-sinhala">{lesson.sinhala}</p>
              <p className="lesson-meta">{lesson.subject}</p>
              <div className="mini-progress-row">
                <span>Progress</span>
                <strong>{lesson.progress}%</strong>
              </div>
              <div className="lesson-progress-bar">
                <div className="lesson-progress-fill" style={{ width: `${lesson.progress}%` }}></div>
              </div>
              <button
                type="button"
                className="btn solid sm"
                onClick={() => handleContinueHomeLesson(lesson)}
              >
                Continue / ඉදිරියට
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="home-section">
        <div className="section-topline">
          <div>
            <h3>New Class Details</h3>
            <p className="section-subtitle">නව පන්ති විස්තර</p>
          </div>
          <button
            type="button"
            className="view-all-btn"
            onClick={() => {
              setSelectedSubject(null);
              setSelectedLearningLesson(null);
              setActiveView("classes");
            }}
          >
            View All
          </button>
        </div>
        <div className="class-cards-list">
          {(dashboardHomeClasses.length > 0 ? dashboardHomeClasses : homeClasses).map((cls) => (
            <div key={cls.id} className={`class-card-item ${cls.color}`}>
              <div className="class-card-top">
                <span className={`mini-icon ${cls.color}`}>▻</span>
                <small>{cls.tag}</small>
              </div>
              <div>
                <h4>{cls.title}</h4>
                <p className="lesson-sinhala">{cls.sinhala}</p>
                <p className="class-meta">Teacher: {cls.teacher}</p>
                <p className="class-meta">Date: {cls.date} &middot; {cls.time}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="home-section">
        <div className="section-topline">
          <div>
            <h3>Active Subjects</h3>
            <p className="section-subtitle">සක්‍රීය විෂයන්</p>
          </div>
          <button
            type="button"
            className="view-all-btn"
            onClick={() => {
              setSelectedSubject(null);
              setSelectedLearningLesson(null);
              setActiveView("subjects");
            }}
          >
            View All
          </button>
        </div>
        <div className="subject-card-grid-home">
          {activeSubjects.map((subject) => (
            <button
              type="button"
              key={subject.name}
              className={`subject-card-modern-home ${subject.color}`}
              onClick={() => {
                handleSelectSubject(subject);
                setActiveView("subjects");
              }}
            >
              <div className="subject-emoji">{subject.icon}</div>
              <h4>{subject.name}</h4>
              <p>{subject.sinhala}</p>
              <div className="active-subject-progress-meta">
                <span>{subject.completedLessons}/{subject.lessonCount}</span>
                <strong>{subject.progressPercent}%</strong>
              </div>
              <div className="active-subject-progress">
                <span style={{ width: `${subject.progressPercent}%` }}></span>
              </div>
              <small className="lesson-count">{subject.lessonCount} lessons</small>
            </button>
          ))}
          {activeSubjects.length === 0 && (
            <EmptyState
              title="No active subjects yet"
              message="Subjects you start learning will appear here."
            />
          )}
        </div>
      </section>

      {false && (
      <div className="summary-grid">
        <div className="summary-card"><span>▯</span><strong>82</strong><p>පාඩම් බලන්න</p><small>සම්පූර්ණ කළ පාඩම්</small></div>
        <div className="summary-card"><span>▤</span><strong>34</strong><p>පසුගිය ප්‍රශ්න පත්‍ර</p><small>ප්‍රශ්න පත්‍ර පුහුණුව</small></div>
        <div className="summary-card"><span>◷</span><strong>126</strong><p>Study Hours</p><small>අධ්‍යයන පැය</small></div>
        <div className="summary-card"><span>◎</span><strong>74%</strong><p>Average Score</p><small>සාමාන්‍ය ලකුණු</small></div>
      </div>
      )}
    </div>
  );

  const renderLearningLesson = () => (
    <div className="dashboard-view-content lesson-resource-view">
      <button type="button" className="lesson-back-btn" onClick={() => setSelectedLearningLesson(null)}>
        Back to Lessons
      </button>
      <div className="lesson-resource-hero">
        <div className={`subject-stream-icon ${getSubjectCardColor(selectedSubject || {})}`}>
          <span className="subject-display-icon">{getSubjectIcon(selectedSubject || {})}</span>
        </div>
        <div>
          <h2>{selectedLearningLesson.sinhala || selectedLearningLesson.title}</h2>
          <p>{selectedLearningLesson.title}</p>
          <small>Biology • Biology Stream</small>
        </div>
        {false && <button type="button" className="btn outline" onClick={() => setSelectedLearningLesson(null)}>
          Back to Lessons
        </button>}
      </div>

      <section className="resource-panel video-resource-panel">
        <div className="resource-title-row">
          <span className="resource-icon video">▹</span>
          <h3>Video Lesson • වීඩියෝ පාඩම</h3>
        </div>
        {selectedLearningLesson.videoItems?.length === 0 && (
          <div className="video-empty-state">
            No video links added for this lesson yet.
          </div>
        )}
        <div className="video-resource-grid">
          {(selectedLearningLesson.videoItems || []).map((video, index) => (
            <article className="video-card" key={`${video.url}-${index}`}>
              <div className="video-frame">
                <iframe
                  title={video.title || `${selectedLearningLesson.title} video ${index + 1}`}
                  src={video.url}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
              <h4>{video.title || `${selectedLearningLesson.title} - Video ${index + 1}`}</h4>
              {video.duration > 0 && <p>Duration: {video.duration} min</p>}
            </article>
          ))}
        </div>
        {false && <div className="video-meta-row">
          <span>Videos: {(selectedLearningLesson.videoItems || []).length}</span>
          <span>◷ Duration: {selectedLearningLesson.duration} min</span>
          <span>◎ {selectedLearningLesson.views} views</span>
          <span>□ Updated: {selectedLearningLesson.updated}</span>
        </div>}
      </section>

      <section className="resource-panel">
        <div className="resource-title-row">
          <span className="resource-icon notes">▤</span>
          <h3>Downloadable Notes • බාගත කළ හැකි සටහන්</h3>
        </div>
        {selectedLearningLesson.noteItems?.length === 0 && (
          <div className="video-empty-state">
            No notes added for this lesson yet.
          </div>
        )}
        <div className="notes-resource-grid">
          {(selectedLearningLesson.noteItems || []).map((note) => (
            <article className="note-resource-card" key={note.fileUrl || note.title}>
              <span>▤</span>
              <div>
                <h4>{note.title}</h4>
                {note.sinhalaTitle && <p>{note.sinhalaTitle}</p>}
                <p>{note.pages ? `${note.pages} pages` : "PDF note"}{note.size ? ` · ${note.size}` : ""}</p>
              </div>
              <div className="note-actions">
                <a href={note.fileUrl} target="_blank" rel="noreferrer">View PDF</a>
                <a href={note.fileUrl} download>Download PDF</a>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="resource-panel">
        <div className="resource-title-row">
          <span className="resource-icon papers">▥</span>
          <h3>Past Papers • පසුගිය ප්‍රශ්න පත්‍ර</h3>
        </div>
        <div className="simple-mcq-start-card">
          <div>
            <h4>MCQ පුහුණුව</h4>
            <p>MongoDB එකේ තියෙන MCQ ප්‍රශ්න වලට පිළිතුරු දෙන්න.</p>
          </div>
          <button type="button" onClick={handleStartMcqPractice}>
            Start MCQ Practice
          </button>
        </div>
        <div className="paper-selector">
          <strong>Select Subject • විෂය තෝරන්න</strong>
          <div className="paper-subject-row">
            <select
              value={selectedPaperSubject}
              onChange={(e) => setSelectedPaperSubject(e.target.value)}
            >
              {paperSubjectOptions.map((subjectOption) => (
                <option key={subjectOption} value={subjectOption}>
                  {subjectOption}
                </option>
              ))}
            </select>
          </div>

          <strong>Select Year • වර්ෂය තෝරන්න</strong>
          <div className="paper-year-row">
            {paperYears.map((year) => (
              <button
                type="button"
                className={selectedPaperYear === year ? "active" : ""}
                onClick={() => setSelectedPaperYear(year)}
                key={year}
              >
                {year}
              </button>
            ))}
          </div>
          <div className="paper-type-tabs">
            {Object.entries(paperTypeLabels).map(([type, label]) => (
              <button
                type="button"
                className={selectedPaperType === type ? "active" : ""}
                onClick={() => setSelectedPaperType(type)}
                key={type}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="paper-resource-grid">
          {papersLoading ? (
            <LoadingSpinner message="Loading past papers..." />
          ) : papersError ? (
            <ErrorMessage message={papersError} showIcon={false} />
          ) : filteredCurrentPapers.length === 0 ? (
            <EmptyState
              icon="▥"
              title="No papers found"
              message={`No ${paperTypeLabels[selectedPaperType]} papers found for ${selectedPaperYear}${selectedPaperSubject && selectedPaperSubject !== "All" ? ` / ${selectedPaperSubject}` : ""}`}
            />
          ) : (
            filteredCurrentPapers.map((paper) => (
              <article className="paper-resource-card" key={paper.id || paper._id}>
                <div className="paper-card-head">
                  <h4>{paper.title || `${paperTypeLabels[paper.paperType]} Questions`}</h4>
                  {paper.difficulty && <span className={paper.difficulty === "Hard" ? "hard" : ""}>{paper.difficulty}</span>}
                </div>
                <p>ⓘ {paper.questionsCount || 0} Questions</p>
                <div className="paper-actions">
                  {paper.paperType === "structured" ? (
                    <button
                      type="button"
                      className="start"
                      onClick={() => handleStartStructuredPractice(paper)}
                    >
                      ⊙ Start Structured
                    </button>
                  ) : paper.paperType === "mcq" ? (
                    <button
                      type="button"
                      className="start"
                      onClick={() => handleStartMcqPractice(paper)}
                    >
                      ⊙ Start MCQ
                    </button>
                  ) : (
                    <button type="button" className="start" disabled>
                      ⊙ Coming Soon
                    </button>
                  )}
                </div>
              </article>
            ))
          )}
        </div>
        {showMcqPractice && (
          <div className="mcq-practice-panel">
            <div className="mcq-practice-head">
              <div>
                <h3>MCQ පුහුණුව</h3>
                <p>{selectedLearningLesson.title}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowMcqPractice(false);
                  setMcqResult(null);
                  setMcqError("");
                }}
              >
                Close
              </button>
            </div>

            {mcqLoading && <LoadingSpinner message="Loading MCQs..." />}
            {mcqError && <ErrorMessage message={mcqError} showIcon={false} />}

            {!mcqLoading && mcqQuestions.length > 0 && (
              <div className="mcq-question-list">
                {mcqQuestions.map((question, index) => {
                  const questionId = question._id || question.id;
                  const resultItem = mcqResult?.results?.find((item) => String(item.questionId) === String(questionId));
                  return (
                    <article className="mcq-question-card" key={questionId}>
                      <div className="mcq-question-top">
                        <strong>Question {question.questionNumber || index + 1}</strong>
                        {question.year && <span>{question.year}</span>}
                      </div>
                      <h4>{question.questionText}</h4>
                      <p className="mcq-label">පිළිතුර තෝරන්න</p>
                      <div className="mcq-options">
                        {(question.options || []).map((option, optionIndex) => (
                          <label key={`${questionId}-${optionIndex}`} className="mcq-option">
                            <input
                              type="radio"
                              name={`mcq-${questionId}`}
                              value={getMcqOptionLabel(option, optionIndex)}
                              checked={mcqAnswers[questionId] === getMcqOptionLabel(option, optionIndex)}
                              disabled={Boolean(mcqResult)}
                              onChange={() =>
                                setMcqAnswers((prev) => ({
                                  ...prev,
                                  [questionId]: getMcqOptionLabel(option, optionIndex),
                                }))
                              }
                            />
                            <span>{getMcqOptionLabel(option, optionIndex)}. {getMcqOptionText(option)}</span>
                          </label>
                        ))}
                      </div>
                      {resultItem && (
                        <div className={resultItem.isCorrect ? "mcq-feedback correct" : "mcq-feedback wrong"}>
                          <strong>{resultItem.isCorrect ? "නිවැරදි පිළිතුර" : "වැරදි පිළිතුර"}</strong>
                          <p>Correct answer: {getMcqAnswerText(resultItem.correctAnswer)}</p>
                          {resultItem.explanation && <p>{resultItem.explanation}</p>}
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            )}

            {!mcqLoading && mcqQuestions.length > 0 && !mcqResult && (
              <button type="button" className="mcq-submit-btn" onClick={handleSubmitMcqPractice}>
                පිළිතුරු යවන්න
              </button>
            )}

            {mcqResult && (
              <div className="mcq-score-card">
                <span>ඔබේ ලකුණු</span>
                <strong>{mcqResult.score} / {mcqResult.total}</strong>
                <p>{mcqResult.percentage}%</p>
              </div>
            )}
          </div>
        )}
        {showStructuredPractice && (
          <div className="structured-practice-panel">
            <div className="structured-practice-head">
              <div>
                <h3>Structured Questions Practice</h3>
                <p>{selectedLearningLesson.title}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowStructuredPractice(false);
                  setStructuredError("");
                }}
              >
                Close
              </button>
            </div>

            {structuredLoading && <LoadingSpinner message="Loading structured questions..." />}
            {structuredError && <ErrorMessage message={structuredError} showIcon={false} />}

            {!structuredLoading && structuredQuestions.length > 0 && (
              <StructuredQuestionWithImage
                questions={structuredQuestions}
                token={localStorage.getItem("token")}
                lessonId={selectedLearningLesson?.rawLesson?._id || selectedLearningLesson?.id}
                onClose={() => setShowStructuredPractice(false)}
              />
            )}
          </div>
        )}
      </section>
    </div>
  );

  const renderSubjectOverview = () => selectedLearningLesson ? renderLearningLesson() : (
    <div className="dashboard-view-content subject-overview-view">
      <button
        type="button"
        className="subject-back-btn"
        onClick={() => {
          setSelectedSubject(null);
          setSelectedLearningLesson(null);
          setStudentLessonRecords([]);
          setLessonError("");
        }}
      >
        Back
      </button>
      <div className="subject-detail-hero">
        <div className={`subject-stream-icon ${getSubjectCardColor(selectedSubject || {})}`}>
          <span className="subject-display-icon">{getSubjectIcon(selectedSubject || {})}</span>
          {selectedSubject?.icon || "♧"}
        </div>
        <div>
          <div className="subject-title-row">
            <h2>{selectedSubject?.name}</h2>
            <span>Active</span>
          </div>
          <p>{selectedSubject?.sinhala}</p>
          <small>□ {currentStream.title} • {currentStream.sinhala}</small>
        </div>
        {false && <div className="subject-detail-actions">
          <button
            type="button"
            className="btn outline"
            onClick={() => {
              setSelectedSubject(null);
              setSelectedLearningLesson(null);
              setStudentLessonRecords([]);
              setLessonError("");
            }}
          >
            Back
          </button>
          <button type="button" className="btn solid" onClick={() => setActiveView("home")}>Dashboard</button>
        </div>}
      </div>

      <div className="subject-stat-grid">
        <div className="subject-stat-card"><span>▯</span><strong>{selectedLessonCards.length}</strong><p>Lessons</p></div>
        <div className="subject-stat-card"><span>▹</span><strong>{selectedLessonStats.videos}</strong><p>Videos</p></div>
        <div className="subject-stat-card"><span>▤</span><strong>{selectedLessonStats.notes}</strong><p>Notes</p></div>
        <div className="subject-stat-card"><span>▥</span><strong>{selectedLessonStats.papers}</strong><p>Past Papers</p></div>
      </div>

      <section className="biology-lessons-section">
        <h3>Lessons • පාඩම්</h3>
        {lessonLoading && <LoadingSpinner message="Loading lessons..." />}
        {lessonError && <ErrorMessage message={lessonError} />}
        {!lessonLoading && !lessonError && selectedLessonCards.length === 0 && (
          <EmptyState title="No lessons yet" message="Add lessons in MongoDB for this subject to show them here." />
        )}
        <div className="biology-lesson-grid">
          {!lessonLoading && !lessonError && selectedLessonCards.map((lesson) => (
            <article className="biology-lesson-card" key={lesson.id || lesson.title}>
              <div className="lesson-card-topline">
                <span className="bio-lesson-icon">
                  <span className="subject-display-icon">{getSubjectIcon(selectedSubject || {})}</span>
                </span>
                <strong>{lesson.progress}% Complete</strong>
              </div>
              <h4>{lesson.title}</h4>
              <p>{lesson.sinhala}</p>
              <div className="biology-progress"><span style={{ width: `${lesson.progress}%` }}></span></div>
              <div className="biology-counts">
                <span>▹ {lesson.videos}</span>
                <span>▤ {lesson.notes}</span>
                <span>▥ {lesson.papers}</span>
              </div>
              <button type="button" className="btn solid" onClick={() => handleContinueHomeLesson(lesson)}>
                Start Learning →
              </button>
            </article>
          ))}
        </div>
      </section>
    </div>
  );

  const renderSubjects = () => selectedSubject ? renderSubjectOverview() : (
    <div className="dashboard-view-content">
      <div className="stream-subject-head">
        <div className={`stream-head-icon ${currentStream.color}`}>{currentStream.icon}</div>
        <div>
          <h2>{currentStream.title}</h2>
          <p>{currentStream.sinhala}</p>
        </div>
      </div>

      <div className="stream-subject-grid">
        {currentSubjects.map((subject) => (
          <article key={subject.name} className="stream-subject-card">
            <div className="subject-card-topline">
              <span className={`subject-square-icon ${getSubjectCardColor(subject)}`}>{getSubjectIcon(subject)}</span>
              <strong>Available</strong>
            </div>
            <h4>{subject.name}</h4>
            <p>{subject.sinhala}</p>
            {false && <div className="subject-meta-row">
              <span>▤ {subject.papers} Papers</span>
              <span>♙ {subject.students} Students</span>
            </div>}
            <button type="button" className="btn solid subject-btn" onClick={() => handleSelectSubject(subject)}>
              View Lessons
            </button>
          </article>
        ))}
      </div>
    </div>
  );
  // Legacy classes renderer kept as fallback.
  // eslint-disable-next-line no-unused-vars
  const renderClasses = () => (
    <div className="dashboard-view-content">
      <div className="section-head page-head">
        <div>
          <h3>Classes</h3>
          <p className="page-subtext">Explore online and physical classes from top teachers.</p>
        </div>
      </div>
      <div className="dashboard-card classes-list-card">
        {newClasses.map((cls) => (
          <div key={cls.id} className="class-card-item large">
            <div>
              <h4>{cls.title}</h4>
              <p className="class-meta">{cls.teacher} • {cls.date} {cls.time}</p>
            </div>
            <button className="btn solid">View Details</button>
          </div>
        ))}
      </div>
    </div>
  );

  // Filter classes based on search criteria
  const getFilteredClasses = (subjectName) => {
    const subjectClasses = groupedClasses[subjectName] || [];
    return subjectClasses.filter(cls => {
      const matchesSubject = !searchFilters.subject ||
        cls.subject.toLowerCase().includes(searchFilters.subject.toLowerCase()) ||
        cls.title.toLowerCase().includes(searchFilters.subject.toLowerCase()) ||
        String(cls.teacher?.name || cls.teacher || '').toLowerCase().includes(searchFilters.subject.toLowerCase());

      const matchesGrade = !searchFilters.grade || cls.grade === searchFilters.grade;
      const matchesLocation = !searchFilters.location ||
        String(cls.location || '').toLowerCase().includes(searchFilters.location.toLowerCase());

      return matchesSubject && matchesGrade && matchesLocation;
    });
  };

  const renderStreamClasses = () => (
    <div className="dashboard-view-content premium-dashboard">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-main">
            {/* Main Heading */}
            <h1 className="hero-title">Class Details</h1>

            {/* Subtitle */}
            <p className="hero-subtitle">
              Find online and physical classes shared by teachers across Sri Lanka. Select a subject to view class details and contact teachers directly.
            </p>

            {/* Bottom Feature Row */}
            <div className="hero-features">
              <div className="feature-item">
                <div className="feature-icon">
                  <span>🔍</span>
                </div>
                <div className="feature-content">
                  <h4>Discover Classes</h4>
                  <p>Browse classes posted by teachers</p>
                </div>
              </div>

              <div className="feature-item">
                <div className="feature-icon">
                  <span>📞</span>
                </div>
                <div className="feature-content">
                  <h4>Contact Directly</h4>
                  <p>Get teacher contact information easily</p>
                </div>
              </div>

              <div className="feature-item">
                <div className="feature-icon">
                  <span>🏫</span>
                </div>
                <div className="feature-content">
                  <h4>Online or Physical</h4>
                  <p>Find the right class that fits your needs</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Search and Filter Section */}
      <section className="search-section">
        <div className="search-container">
          <div className="search-bar">
            <input
              type="text"
              placeholder="Search classes by subject, location, or teacher..."
              value={searchFilters.subject}
              onChange={(e) => setSearchFilters(prev => ({ ...prev, subject: e.target.value }))}
            />
            <button className="search-btn">🔍</button>
          </div>
          <div className="filter-row">
            <select
              value={searchFilters.grade}
              onChange={(e) => setSearchFilters(prev => ({ ...prev, grade: e.target.value }))}
            >
              <option value="">All Grades</option>
              <option value="Grade 6">Grade 6</option>
              <option value="Grade 7">Grade 7</option>
              <option value="Grade 8">Grade 8</option>
              <option value="Grade 9">Grade 9</option>
              <option value="Grade 10">Grade 10</option>
              <option value="Grade 11">Grade 11</option>
              <option value="A/L">A/L</option>
              <option value="O/L">O/L</option>
            </select>
            <input
              type="text"
              placeholder="Location (e.g., Colombo)"
              value={searchFilters.location}
              onChange={(e) => setSearchFilters(prev => ({ ...prev, location: e.target.value }))}
            />
          </div>
        </div>
      </section>

      {/* Subject Cards Grid */}
      <section className="subjects-section">
        <div className="subjects-grid premium-grid">
          <div className="subject-card premium-card biology-card" onClick={() => setExpandedSubject(expandedSubject === 'Biology' ? null : 'Biology')}>
            <div className="card-icon-area">
              <div className="card-icon">🌿</div>
            </div>
            <div className="card-content">
              <h3>Biology</h3>
              <p className="sinhala-text">ජීව විද්‍යාව</p>
              <p className="card-description">Study of living organisms and life processes</p>
              <div className="class-count-badge">
                {getFilteredClasses('Biology').length} classes available
              </div>
            </div>
            <button className="card-button biology-btn">
              View Class Details
            </button>
          </div>

          <div className="subject-card premium-card chemistry-card" onClick={() => setExpandedSubject(expandedSubject === 'Chemistry' ? null : 'Chemistry')}>
            <div className="card-icon-area">
              <div className="card-icon">🧪</div>
            </div>
            <div className="card-content">
              <h3>Chemistry</h3>
              <p className="sinhala-text">රසායන විද්‍යාව</p>
              <p className="card-description">Study of matter, its properties and reactions</p>
              <div className="class-count-badge">
                {getFilteredClasses('Chemistry').length} classes available
              </div>
            </div>
            <button className="card-button chemistry-btn">
              View Class Details
            </button>
          </div>

          <div className="subject-card premium-card physics-card" onClick={() => setExpandedSubject(expandedSubject === 'Physics' ? null : 'Physics')}>
            <div className="card-icon-area">
              <div className="card-icon">⚛️</div>
            </div>
            <div className="card-content">
              <h3>Physics</h3>
              <p className="sinhala-text">භෞතික විද්‍යාව</p>
              <p className="card-description">Study of matter, energy and their interactions</p>
              <div className="class-count-badge">
                {getFilteredClasses('Physics').length} classes available
              </div>
            </div>
            <button className="card-button physics-btn">
              View Class Details
            </button>
          </div>

          <div className="subject-card premium-card agri-card" onClick={() => setExpandedSubject(expandedSubject === 'Agricultural Science' ? null : 'Agricultural Science')}>
            <div className="card-icon-area">
              <div className="card-icon">🚜</div>
            </div>
            <div className="card-content">
              <h3>Agricultural Science</h3>
              <p className="sinhala-text">කෘෂි විද්‍යාව</p>
              <p className="card-description">Study of farming, crops and agricultural practices</p>
              <div className="class-count-badge">
                {getFilteredClasses('Agricultural Science').length} classes available
              </div>
            </div>
            <button className="card-button agri-btn">
              View Class Details
            </button>
          </div>

          <div className="subject-card premium-card other-card" onClick={() => setExpandedSubject(expandedSubject === 'Other' ? null : 'Other')}>
            <div className="card-icon-area">
              <div className="card-icon">🌍</div>
            </div>
            <div className="card-content">
              <h3>Other Classes</h3>
              <p className="sinhala-text">වෙනත් පන්ති</p>
              <p className="card-description">Explore classes from other streams and subjects</p>
              <div className="class-count-badge">
                {getFilteredClasses('Other').length} classes available
              </div>
            </div>
            <button className="card-button other-btn">
              View Other Classes
            </button>
          </div>
        </div>
      </section>

      {/* Expanded Subject Details */}
      {expandedSubject && expandedSubject !== 'Other' && (
        <section className="expanded-section premium-expanded">
          <div className="expanded-header">
            <div className="expanded-title">
              <h2>{expandedSubject} Class Posts</h2>
              <p>Recent class details, materials and announcements</p>
            </div>
            <button className="close-btn" onClick={() => setExpandedSubject(null)}>
              ✕
            </button>
          </div>

          <div className="class-posts-grid premium-posts">
            {loading ? (
              <LoadingSpinner message="Loading class posts..." />
            ) : error ? (
              <ErrorMessage
                title="Failed to load classes"
                message={error}
                onRetry={() => loadClassPosts(searchFilters)}
              />
            ) : getFilteredClasses(expandedSubject).length === 0 ? (
              <EmptyState
                icon="📚"
                title="No classes found"
                message={`No ${expandedSubject} classes match your current filters. Try adjusting your search criteria.`}
                actionText="Clear Filters"
                onAction={() => setSearchFilters({ subject: "", grade: "", location: "" })}
              />
            ) : (
              getFilteredClasses(expandedSubject).map((cls) => (
                <div
                  key={cls._id || cls.id}
                  className="class-post-card premium-post"
                  onClick={() => setSelectedClassPost(cls)}
                >
                  <div className="post-header">
                    <div className="post-icon">📚</div>
                    <div className="post-meta">
                      <span className="post-tag">{cls.grade}</span>
                      <span className="post-teacher">{cls.teacher?.name || 'Teacher'}</span>
                    </div>
                  </div>
                  <div className="post-content">
                    <h4>{cls.title}</h4>
                    <p className="post-description">{cls.description}</p>
                    <div className="post-details">
                      <span>📍 {cls.location}</span>
                      <span>⏰ {cls.schedule}</span>
                      <span>💰 Rs. {cls.fee}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      )}

      {expandedSubject === 'Other' && (
        <section className="expanded-section premium-expanded">
          <div className="expanded-header">
            <div className="expanded-title">
              <h2>Other Classes</h2>
              <p>Classes from other streams and subjects</p>
            </div>
            <button className="close-btn" onClick={() => setExpandedSubject(null)}>
              ✕
            </button>
          </div>

          <div className="class-posts-grid premium-posts">
            {Object.keys(groupedClasses).filter(sub => !currentSubjectSet.has(sub)).map(subject => 
              groupedClasses[subject].map(cls => (
                <div
                  key={cls.id}
                  className="class-post-card premium-post other-post"
                  onClick={() => setSelectedClassPost(cls)}
                >
                  <div className="post-header">
                    <div className="post-icon">📚</div>
                    <div className="post-meta">
                      <span className="post-subject">{subject}</span>
                      <span className="post-tag">{cls.tag}</span>
                    </div>
                  </div>
                  <div className="post-content">
                    <h4>{cls.title}</h4>
                    <p className="sinhala-text">{cls.sinhala}</p>
                    <p className="post-description">{cls.description}</p>
                    <div className="post-details">
                      <span>👨‍🏫 {cls.teacher}</span>
                      <span>📅 {cls.date}</span>
                      <span>⏰ {cls.time}</span>
                    </div>
                  </div>
                </div>
              ))
            ).flat()}
          </div>
        </section>
      )}

      {/* Class Post Detail Modal */}
      {selectedClassPost && (
        <div className="modal-overlay" onClick={() => setSelectedClassPost(null)}>
          <div className="modal-content premium-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                <h3>{selectedClassPost.subject}</h3>
                <h2>{selectedClassPost.title}</h2>
              </div>
              <button className="modal-close" onClick={() => setSelectedClassPost(null)}>
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div className="modal-info">
                <p className="modal-description">{selectedClassPost.description}</p>

                <div className="modal-meta premium-meta">
                  <div className="meta-item">
                    <span className="meta-icon">👨‍🏫</span>
                    <span>Teacher: {selectedClassPost.teacher?.name || "Teacher"}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-icon">📍</span>
                    <span>Location: {selectedClassPost.location}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-icon">📅</span>
                    <span>Schedule: {selectedClassPost.schedule}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-icon">⏱️</span>
                    <span>Duration: {selectedClassPost.duration}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-icon">💰</span>
                    <span>Fee: Rs. {selectedClassPost.fee}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-icon">📞</span>
                    <span>Contact: {selectedClassPost.contactInfo}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-icon">🎓</span>
                    <span>Grade: {selectedClassPost.grade}</span>
                  </div>
                </div>
              </div>

              <div className="comments-section premium-comments">
                <h4>💬 Contact Teacher</h4>
                <div className="add-comment">
                  <input
                    type="text"
                    placeholder="Ask a question or express interest..."
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        const input = e.target;
                        const commentText = input.value.trim();
                        if (commentText) {
                          submitComment(selectedClassPost._id, commentText);
                          input.value = "";
                        }
                      }
                    }}
                  />
                  <button
                    className="comment-btn"
                    onClick={(e) => {
                      const input = e.target.previousElementSibling;
                      const commentText = input.value.trim();
                      if (commentText) {
                        submitComment(selectedClassPost._id, commentText);
                        input.value = "";
                      }
                    }}
                  >
                    Send Message
                  </button>
                </div>
                <div className="contact-info">
                  <p>💡 <strong>Tip:</strong> Teachers typically respond within 24 hours. Check your email for updates!</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
  const renderPastPapers = () => (
    <div className="dashboard-view-content">
      <div className="section-head page-head">
        <div>
          <h3>පසුගිය ප්‍රශ්න පත්‍ර</h3>
          <p className="page-subtext">Quick access to recent papers and practice material.</p>
        </div>
      </div>

      <div className="dashboard-card papers-card">
        {pastPaperItems.map((paper, index) => (
          <div className="paper-row" key={index}>
            <div className="paper-left">
              <span className="paper-icon">📄</span>
              <div>
                <strong>{paper}</strong>
                <p>{student.stream} stream practice resource</p>
              </div>
            </div>
            <button className="btn solid sm">Open</button>
          </div>
        ))}
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="dashboard-view-content">
      <div className="section-head page-head">
        <div>
          <h3>Settings</h3>
          <p className="page-subtext">Manage your stream, exam year, and preferences.</p>
        </div>
      </div>

      <div className="dashboard-card settings-card-modern">
        <form className="settings-form" onSubmit={(e) => e.preventDefault()}>
          <div className="settings-group">
            <label>Study Stream</label>
            <div className="input-wrap select-wrap">
              <select
                value={student.stream}
                onChange={(e) => handleUpdateProfile("stream", e.target.value)}
              >
                <option value="Bio Science">Bio Science</option>
                <option value="Physical Science">Physical Science</option>
                <option value="Commerce">Commerce</option>
                <option value="Arts">Arts</option>
                <option value="Technology">Technology</option>
              </select>
            </div>
          </div>

          <div className="settings-group">
            <label>A/L Examination Year</label>
            <div className="input-wrap select-wrap">
              <select
                value={student.alYear}
                onChange={(e) => handleUpdateProfile("alYear", e.target.value)}
              >
                <option value="2026 A/L">2026 A/L</option>
                <option value="2027 A/L">2027 A/L</option>
                <option value="2028 A/L">2028 A/L</option>
              </select>
            </div>
          </div>

          <div className="settings-group">
            <label>Full Name</label>
            <div className="input-wrap">
              <input
                type="text"
                value={student.name}
                onChange={(e) => handleUpdateProfile("name", e.target.value)}
              />
            </div>
          </div>

          <div className="settings-group">
            <label>Email Address</label>
            <div className="input-wrap">
              <input
                type="email"
                value={student.email}
                onChange={(e) => handleUpdateProfile("email", e.target.value)}
              />
            </div>
          </div>

          <div className="toggle-group">
            <div className="toggle-item">
              <span>Dark Mode</span>
              <input
                type="checkbox"
                checked={settings.darkMode}
                onChange={() => handleToggleSetting("darkMode")}
              />
            </div>

            <div className="toggle-item">
              <span>Email Notifications</span>
              <input
                type="checkbox"
                checked={settings.notifications}
                onChange={() => handleToggleSetting("notifications")}
              />
            </div>
          </div>

          <button
            type="button"
            className="btn solid"
            onClick={() => alert("Settings saved successfully!")}
          >
            Save Changes
          </button>
        </form>
      </div>
    </div>
  );

  const renderChatScreen = () => (
    <div className="dashboard-view-content ai-chat-screen">
      <div className="ai-chat-screen-header">
        <div>
          <h2>AI Study Chat</h2>
          <p>Ask your A/L study questions in one focused screen.</p>
        </div>
        <button type="button" className="btn outline" onClick={() => setActiveView("home")}>
          Back to Dashboard
        </button>
      </div>

      <div className="ai-chat-screen-body">
        {aiMessages.map((chatMessage, index) => (
          <p
            key={`${chatMessage.role}-${index}`}
            className={chatMessage.role === "user" ? "ai-user-message" : "ai-assistant-message"}
          >
            {renderChatText(chatMessage.text)}
          </p>
        ))}
        {aiLoading && <p className="ai-assistant-message">Preparing answer...</p>}
        {aiError && <p className="ai-error-message">{aiError}</p>}
        {aiMessages.length === 0 && (
          <p className="ai-assistant-message">Ayubowan! Ask about your A/L subjects, lessons, or weak areas.</p>
        )}
      </div>

      <div className="ai-chat-screen-input">
        <input
          value={aiInput}
          placeholder="Ask anything..."
          onChange={(event) => setAiInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              handleSendAiMessage();
            }
          }}
        />
        <button type="button" disabled={aiLoading} onClick={() => handleSendAiMessage()}>
          Send
        </button>
      </div>
    </div>
  );

  return (
    <div className={`dashboard-shell ${settings.darkMode ? "dark" : ""} ${styles.dashboardRoot}`}>
      <header className="dashboard-header">
        <div className="header-container">
          <div className="brand" onClick={() => setActiveView("home")}>
            <div className="brand-mark brand-logo-shell">
              <img src="/logo1.png" alt="Learning Hub logo" className="brand-logo-image" />
            </div>
            <div className="brand-copy">
              <span className="brand-name">Learning Hub</span>
              <small>A/L Platform</small>
            </div>
          </div>

          <nav className={`header-nav ${showMobileMenu ? "active" : ""}`}>
            <button className={activeView === "home" ? "active" : ""} onClick={() => {setActiveView("home"); setShowMobileMenu(false)}}>Home</button>
            <button
              className={activeView === "subjects" ? "active" : ""}
              onClick={() => {
                setSelectedSubject(null);
                setSelectedLearningLesson(null);
                setActiveView("subjects");
                setShowMobileMenu(false);
              }}
            >
              Subjects
            </button>
            <button className={activeView === "classes" ? "active" : ""} onClick={() => {setActiveView("classes"); setShowMobileMenu(false)}}>Classes</button>
            <button className={activeView === "pastpapers" ? "active" : ""} onClick={() => {setActiveView("pastpapers"); setShowMobileMenu(false)}}>Past Papers</button>
          </nav>

          <div className="header-actions">
            <button
              type="button"
              className="notification-btn"
              onClick={() => {
                setShowNotifications((prev) => !prev);
                setShowProfileMenu(false);
              }}
              aria-label={
                notificationCount > 0
                  ? `${notificationCount} notifications`
                  : "Notifications"
              }
            >
              <img src="/bell.png" alt="" className="notification-bell-image" aria-hidden="true" />
              {notificationCount > 0 && (
                <span className="notification-count">{notificationBadgeText}</span>
              )}
            </button>
            {showNotifications && (
              <div className="notification-panel">
                <div className="notification-panel-header">
                  <div>
                    <h3>Notifications</h3>
                    <p>පන්ති සහ විෂය updates</p>
                  </div>
                  <span>{notificationBadgeText}</span>
                </div>

                <div className="notification-list">
                  {notificationCount > 0 ? (
                    notificationItems.map((item) => (
                      <button
                        type="button"
                        className="notification-item"
                        key={item.id}
                        onClick={() => {
                          if (item.type === "Class Update") {
                            setActiveView("classes");
                          } else {
                            setActiveView("subjects");
                          }
                          setShowNotifications(false);
                          setShowMobileMenu(false);
                        }}
                      >
                        <span className="notification-item-dot"></span>
                        <span className="notification-item-copy">
                          <strong>{item.title}</strong>
                          <small>{item.text}</small>
                        </span>
                        <em>{item.type}</em>
                      </button>
                    ))
                  ) : (
                    <div className="notification-empty">
                      <strong>No new notifications</strong>
                      <span>අලුත් updates නැහැ</span>
                    </div>
                  )}
                </div>
              </div>
            )}
            <div className="profile-menu-wrap">
              <button
                type="button"
                className="profile-pill"
                onClick={() => {
                  setShowProfileMenu((prev) => !prev);
                  setShowNotifications(false);
                }}
              >
                <div className="profile-avatar">{student.name.charAt(0)}</div>
                <span className="profile-name">
                  <strong>{student.name}</strong>
                  <small>{student.stream} · {student.alYear}</small>
                </span>
                <span className="profile-chevron">⌄</span>
              </button>

              {showProfileMenu && (
                <div className="profile-dropdown">
                  <button
                    type="button"
                    className="profile-menu-item"
                    onClick={() => {
                      setActiveView("settings");
                      setShowProfileMenu(false);
                      setShowMobileMenu(false);
                    }}
                  >
                    Settings
                  </button>
                  <button
                    type="button"
                    className="profile-menu-item danger"
                    onClick={() => {
                      setShowProfileMenu(false);
                      onLogout();
                    }}
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
            <button className="menu-toggle" onClick={() => setShowMobileMenu(!showMobileMenu)}>
              {showMobileMenu ? "✕" : "☰"}
            </button>
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="dashboard-container">
            {activeView === "home" && renderCompactHome()}
            {activeView === "subjects" && renderSubjects()}
            {activeView === "classes" && renderStreamClasses()}
            {activeView === "pastpapers" && renderPastPapers()}
            {activeView === "settings" && renderSettings()}
            {activeView === "chat" && renderChatScreen()}
        </div>
      </main>

      <footer className="site-footer student-footer">
        <div className="footer-grid">
          <div>
            <div className="brand footer-brand">
              <span className="brand-mark brand-logo-shell">
                <img src="/logo1.png" alt="Learning Hub logo" className="brand-logo-image" />
              </span>
              <span className="brand-name">Learning Hub</span>
            </div>
            <p>AI-powered learning platform for Sri Lankan G.C.E. Advanced Level students.</p>
            <p className="footer-accent">උසස් පෙළ ඉගෙනීම එකම තැනකින්</p>
          </div>
          <div>
            <h4>Learn</h4>
            <ul>
              <li>Video lessons</li>
              <li>Notes</li>
              <li>Past papers</li>
              <li>MCQ practice</li>
            </ul>
          </div>
          <div>
            <h4>Platform</h4>
            <ul>
              <li>AI chatbot</li>
              <li>Progress tracking</li>
              <li>Teacher classes</li>
              <li>Admin approval</li>
            </ul>
          </div>
          <div>
            <h4>Contact</h4>
            <ul>
              <li>info@learninghub.lk</li>
              <li>+94 11 234 5678</li>
            </ul>
          </div>
        </div>
        <div className="footer-divider" />
        <p className="footer-copy">© 2026 Learning Hub. All rights reserved.</p>
      </footer>

      {showAiBubble && (
        <button
          className="ai-floating-btn"
          onClick={() => setShowAiPanel((prev) => !prev)}
          title="AI Assistant"
        >
          🤖
        </button>
      )}

      {showAiPanel && (
        <div className={`ai-chat-panel ${isAiMaximized ? "maximized" : ""}`}>
          <div className="ai-chat-head">
            <div>
              <strong>AI සහාය ලබාගන්න</strong>
              <small>ඔබේ දුර්වල තැන් හඳුනාගන්න</small>
            </div>
            <div className="ai-chat-actions">
              <button
                type="button"
                aria-label="Open chatbot screen"
                title="Open chat screen"
                onClick={() => {
                  setIsAiMaximized(false);
                  setShowAiPanel(false);
                  setActiveView("chat");
                }}
              >
                {isAiMaximized ? "−" : "□"}
              </button>
              <button type="button" aria-label="Close chatbot" onClick={() => setShowAiPanel(false)}>×</button>
            </div>
          </div>
          <div className="ai-chat-body">
            {aiMessages.map((chatMessage, index) => (
              <p
                key={`${chatMessage.role}-${index}`}
                className={chatMessage.role === "user" ? "ai-user-message" : "ai-assistant-message"}
              >
                {renderChatText(chatMessage.text)}
              </p>
            ))}
            {aiLoading && <p className="ai-assistant-message">පිළිතුර සූදානම් කරනවා...</p>}
            {aiError && <p className="ai-error-message">{aiError}</p>}
            <p>ආයුබෝවන්! ඔබේ A/L විෂයන් ගැන අහන්න. ඔබේ දුර්වල තැන් හඳුනාගන්න මම උදව් කරන්නම්.</p>
          </div>
          <div className="ai-chat-input">
            <input
              placeholder="Ask anything... / ප්‍රශ්නයක් අසන්න..."
              onChange={(event) => setAiInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  const message = event.currentTarget.value;
                  event.currentTarget.value = "";
                  handleSendAiMessage(message);
                }
              }}
            />
            <button
              type="button"
              disabled={aiLoading}
              onClick={(event) => {
                const input = event.currentTarget.parentElement?.querySelector("input");
                const message = input?.value || "";
                if (input) input.value = "";
                handleSendAiMessage(message);
              }}
            >
              Send
            </button>
          </div>
        </div>
      )}
      {selectedNews && (
        <div className="modal-overlay news-modal-overlay" onClick={() => setSelectedNews(null)}>
          <div className="modal-content news-detail-modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header news-detail-header">
              <div className="modal-title">
                <span className="news-detail-tag">{selectedNews.tag}</span>
                <h2>{selectedNews.title}</h2>
                <p>{selectedNews.date}</p>
              </div>
              <button className="modal-close" type="button" onClick={() => setSelectedNews(null)}>
                ✕
              </button>
            </div>

            <div className="modal-body news-detail-body">
              <p className="news-detail-sinhala">{selectedNews.sinhala}</p>
              <p>{selectedNews.details}</p>
              <div className="news-detail-note">
                <strong>සිසුන් සඳහා</strong>
                <span>{selectedNews.sinhalaDetails}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        * {
          box-sizing: border-box;
        }

        .dashboard-shell {
          min-height: 100vh;
          background:
            radial-gradient(circle at top left, rgba(120, 190, 255, 0.18), transparent 32%),
            linear-gradient(180deg, #f7fbff 0%, #eef6ff 42%, #f9fcff 100%);
          color: #14213d;
          font-family: "Inter", Arial, sans-serif;
        }

        .dashboard-header {
          background: rgba(255, 255, 255, 0.88);
          border-bottom: 1px solid rgba(202, 221, 248, 0.8);
          min-height: 84px;
          position: sticky;
          top: 0;
          z-index: 1000;
          display: flex;
          align-items: center;
          backdrop-filter: blur(14px);
          box-shadow: 0 12px 30px rgba(22, 52, 99, 0.05);
        }

        .header-container {
          width: 100%;
          max-width: 1360px;
          margin: 0 auto;
          padding: 16px 34px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
        }

        .brand-mark {
          width: 44px;
          height: 44px;
          background: linear-gradient(145deg, #ffffff, #dbeafe);
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          border-radius: 50%;
          font-size: 19px;
          box-shadow:
            0 14px 28px rgba(37, 99, 235, 0.18),
            inset -4px -4px 10px rgba(255, 255, 255, 0.92),
            inset 4px 4px 12px rgba(191, 219, 254, 0.8);
          overflow: hidden;
        }

        .brand-logo-shell {
          padding: 4px;
        }

        .brand-logo-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 50%;
          display: block;
          filter: saturate(1.08) contrast(1.02);
        }

        .brand-name {
          font-size: 20px;
          font-weight: 800;
          color: #2355d8;
        }

        .header-nav {
          display: flex;
          gap: 12px;
          padding: 8px 10px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.66);
          border: 1px solid rgba(218, 230, 248, 0.9);
          box-shadow: 0 10px 24px rgba(25, 54, 101, 0.04);
        }

        .header-nav button {
          background: none;
          border: none;
          padding: 10px 16px;
          font-size: 15px;
          font-weight: 700;
          color: #334766;
          cursor: pointer;
          border-radius: 999px;
          transition: 0.22s ease;
        }

        .header-nav button:hover {
          background: #edf4ff;
          color: #2563eb;
        }

        .header-nav button.active {
          color: #2563eb;
          background: #e9f1ff;
          box-shadow: inset 0 -2px 0 #2563eb;
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 14px;
          position: relative;
        }

        .profile-menu-wrap {
          position: relative;
        }

        .profile-pill {
          display: flex;
          align-items: center;
          gap: 10px;
          background: rgba(255, 255, 255, 0.88);
          padding: 6px 14px 6px 6px;
          border-radius: 999px;
          cursor: pointer;
          border: 1px solid #dbe8fb;
          appearance: none;
          box-shadow: 0 10px 24px rgba(20, 50, 94, 0.05);
        }

        .profile-avatar {
          width: 36px;
          height: 36px;
          background: linear-gradient(135deg, #2563eb, #14b8a6);
          color: #fff;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 14px;
        }

        .profile-name {
          font-weight: 700;
          font-size: 14px;
          color: #1e293b;
        }

        .profile-dropdown {
          position: absolute;
          top: calc(100% + 10px);
          right: 0;
          min-width: 180px;
          background: #ffffff;
          border: 1px solid #dce8fb;
          border-radius: 20px;
          box-shadow: 0 22px 44px rgba(15, 23, 42, 0.14);
          padding: 8px;
          display: grid;
          gap: 4px;
          z-index: 20;
        }

        .profile-menu-item {
          width: 100%;
          border: none;
          background: transparent;
          border-radius: 12px;
          padding: 12px 14px;
          text-align: left;
          font-size: 14px;
          font-weight: 600;
          color: #334155;
          cursor: pointer;
          transition: background 0.2s ease, color 0.2s ease;
        }

        .profile-menu-item:hover {
          background: #f1f7ff;
          color: #2563eb;
        }

        .profile-menu-item.danger {
          color: #dc2626;
        }

        .profile-menu-item.danger:hover {
          background: #fef2f2;
          color: #dc2626;
        }

        .menu-toggle {
          display: none;
          font-size: 24px;
          background: none;
          border: none;
          cursor: pointer;
          color: #1f3b70;
        }

        .dashboard-main {
          padding: 34px 0 40px;
        }

        .dashboard-container {
          max-width: 1320px;
          margin: 0 auto;
          padding: 0 34px;
        }

        .motivation-banner {
          background:
            linear-gradient(135deg, rgba(36, 99, 235, 0.96), rgba(14, 165, 233, 0.9));
          padding: 24px 28px;
          border-radius: 28px;
          color: #fff;
          margin-bottom: 26px;
          box-shadow: 0 22px 40px rgba(37, 99, 235, 0.18);
          position: relative;
          overflow: hidden;
        }

        .motivation-banner::after {
          content: "";
          position: absolute;
          width: 260px;
          height: 260px;
          right: -100px;
          top: -140px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.14);
        }

        .motivation-content {
          position: relative;
          z-index: 1;
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .motivation-icon {
          width: 58px;
          height: 58px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.18);
          box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.18);
        }

        .motivation-banner p {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
          line-height: 1.5;
        }

        .home-top-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 22px;
          margin-bottom: 28px;
        }

        .dashboard-card {
          background: rgba(255, 255, 255, 0.82);
          padding: 24px;
          border-radius: 28px;
          border: 1px solid rgba(214, 227, 248, 0.9);
          box-shadow: 0 20px 38px rgba(24, 50, 94, 0.07);
          backdrop-filter: blur(10px);
        }

        .countdown-card,
        .news-card,
        .settings-card-modern,
        .papers-card,
        .classes-list-card {
          position: relative;
          overflow: hidden;
        }

        .countdown-card::before,
        .news-card::before,
        .settings-card-modern::before,
        .papers-card::before,
        .classes-list-card::before {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.34), rgba(255, 255, 255, 0));
        }

        .countdown-card h3,
        .news-card h3,
        .home-section h3,
        .page-head h3 {
          margin: 0 0 16px;
          font-size: 22px;
          color: #11223f;
          letter-spacing: -0.02em;
        }

        .days-left {
          font-size: 28px;
          color: #2563eb;
          margin: 10px 0 0;
        }

        .exam-date,
        .page-subtext,
        .class-meta,
        .lesson-meta,
        .paper-left p {
          color: #5b6d86;
        }

        .page-head {
          margin-bottom: 22px;
          padding: 4px 2px 0;
        }

        .news-list {
          padding: 0;
          list-style: none;
          margin: 0;
        }

        .news-list li {
          padding: 12px 0;
          border-bottom: 1px solid #edf3fb;
          font-size: 14px;
          color: #475569;
        }

        .news-list li:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }

        .news-list li button {
          width: 100%;
          border: 0;
          background: transparent;
          padding: 0;
          color: inherit;
          font: inherit;
          text-align: left;
          cursor: pointer;
        }

        .news-list li button:hover {
          color: #4C1D95;
        }

        .home-section {
          margin-bottom: 34px;
        }

        .dashboard-view-content {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .lesson-cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 20px;
        }

        .lesson-card-item {
          background: rgba(255, 255, 255, 0.9);
          padding: 22px;
          border-radius: 24px;
          border: 1px solid #e0ecfb;
          box-shadow: 0 18px 34px rgba(16, 38, 76, 0.06);
          transition: transform 0.22s ease, box-shadow 0.22s ease;
        }

        .lesson-card-item:hover,
        .class-card-item:hover,
        .subject-card-modern-home:hover,
        .subject-card-modern.large:hover,
        .paper-row:hover {
          transform: translateY(-4px);
          box-shadow: 0 24px 40px rgba(16, 38, 76, 0.1);
        }

        .lesson-card-item h4 {
          margin: 0 0 8px;
          font-size: 18px;
          color: #14233f;
        }

        .lesson-meta {
          font-size: 13px;
          margin-bottom: 16px;
        }

        .lesson-progress-bar {
          height: 10px;
          background: #edf3fb;
          border-radius: 999px;
          overflow: hidden;
          margin-bottom: 10px;
        }

        .lesson-progress-fill {
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(90deg, #2563eb, #22a7f0);
        }

        .class-cards-list {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 18px;
        }

        .class-card-item {
          background: rgba(255, 255, 255, 0.9);
          padding: 18px 20px;
          border-radius: 22px;
          border: 1px solid #e0ecfb;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          box-shadow: 0 16px 30px rgba(16, 38, 76, 0.05);
          transition: transform 0.22s ease, box-shadow 0.22s ease;
        }

        .class-card-item h4 {
          margin: 0 0 6px;
          color: #14233f;
        }

        .class-card-item.large {
          padding: 22px 24px;
        }

        .subject-card-grid-home {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
          gap: 20px;
        }

        .subject-card-modern-home {
          min-height: 236px;
          background: #ffffff;
          padding: 20px;
          border-radius: 28px;
          border: 1px solid #e7eaee;
          width: 100%;
          color: inherit;
          font: inherit;
          text-align: center;
          cursor: pointer;
          box-shadow: none;
          transition: border-color 0.22s ease, transform 0.22s ease, box-shadow 0.22s ease;
        }

        .subject-card-modern-home:hover {
          border-color: rgba(16, 185, 129, 0.32);
          box-shadow: 0 18px 34px rgba(15, 23, 42, 0.06);
          transform: translateY(-2px);
        }

        .subject-emoji {
          width: 60px;
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;
          margin: 0 auto 16px;
          border-radius: 18px;
          color: #10b981;
          background: #e8fbf2;
        }

        .subject-card-modern-home h4,
        .subject-card-modern.large h4 {
          margin: 0 0 8px;
          color: #0f172a;
          font-size: 16px;
        }

        .subject-card-modern-home p,
        .subject-card-modern.large p {
          margin: 0;
          color: #8b949e;
          font-size: 13px;
          font-weight: 600;
        }

        .active-subject-progress-meta {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-top: 18px;
          color: #9ca3af;
          font-size: 12px;
          font-weight: 700;
        }

        .active-subject-progress-meta strong {
          color: #111827;
        }

        .active-subject-progress {
          height: 7px;
          margin-top: 8px;
          border-radius: 999px;
          overflow: hidden;
          background: #f0f1f2;
        }

        .active-subject-progress span {
          display: block;
          height: 100%;
          border-radius: inherit;
          background: #2dd4bf;
        }

        .subject-card-modern-home.green .subject-emoji,
        .subject-card-modern-home.biology .subject-emoji {
          color: #65c90f;
          background: #effdde;
        }

        .subject-card-modern-home.orange .subject-emoji {
          color: #f59e0b;
          background: #fff7df;
        }

        .subject-card-modern-home.sky .subject-emoji {
          color: #06b6d4;
          background: #e6fbfb;
        }

        .subject-card-modern-home.orange .active-subject-progress span {
          background: #fbbf24;
        }

        .subject-card-modern-home.green .active-subject-progress span {
          background: #84e51d;
        }

        .subject-card-modern-home.sky .active-subject-progress span {
          background: #22c9d6;
        }

        .subject-progress-home {
          height: 8px;
          background: #edf3fb;
          border-radius: 999px;
          overflow: hidden;
          margin-top: 14px;
        }

        .subject-progress-fill-home {
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(90deg, #2563eb, #14b8a6);
        }

        .subject-card-grid.full {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 20px;
        }

        .subject-card-modern.large {
          background: rgba(255, 255, 255, 0.92);
          border: 1px solid #deebfb;
          border-radius: 26px;
          padding: 24px;
          box-shadow: 0 18px 34px rgba(16, 38, 76, 0.07);
          transition: transform 0.22s ease, box-shadow 0.22s ease;
        }

        .subject-progress {
          height: 8px;
          background: #edf3fb;
          border-radius: 999px;
          overflow: hidden;
          margin: 14px 0 18px;
        }

        .subject-progress-fill {
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(90deg, #2563eb, #14b8a6);
        }

        .subject-btn {
          width: 100%;
        }

        .settings-form {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 18px;
        }

        .settings-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .settings-group label {
          font-weight: 700;
          color: #22314d;
        }

        .toggle-group {
          grid-column: span 2;
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-top: 8px;
          padding-top: 14px;
          border-top: 1px solid #e6eefc;
        }

        .toggle-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          color: #4f5d78;
          font-weight: 600;
        }

        .input-wrap input,
        .input-wrap select {
          width: 100%;
          border: 1px solid #d6e4fb;
          background: #f8fbff;
          border-radius: 16px;
          padding: 14px 16px;
          font-size: 15px;
          color: #20304d;
          outline: none;
          transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
        }

        .input-wrap input:focus,
        .input-wrap select:focus {
          border-color: #77aaf8;
          box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.08);
          background: #ffffff;
        }

        .btn {
          border: none;
          border-radius: 999px;
          padding: 12px 20px;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          transition: 0.2s ease;
        }

        .btn.solid {
          background: linear-gradient(135deg, #2f6df6, #169de5);
          color: white;
          box-shadow: 0 16px 28px rgba(37, 99, 235, 0.18);
        }

        .btn.solid:hover {
          transform: translateY(-2px);
        }

        .btn.outline {
          background: white;
          color: #2563eb;
          border: 1px solid #cdddf7;
          box-shadow: 0 10px 20px rgba(37, 99, 235, 0.06);
        }

        .btn.sm {
          padding: 10px 16px;
          border-radius: 999px;
        }

        .papers-card {
          display: grid;
          gap: 14px;
        }

        .paper-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 18px 20px;
          background: rgba(255, 255, 255, 0.88);
          border: 1px solid #e5eefc;
          border-radius: 22px;
          box-shadow: 0 14px 28px rgba(16, 38, 76, 0.05);
          transition: transform 0.22s ease, box-shadow 0.22s ease;
        }

        .paper-left {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .paper-left strong {
          display: block;
          margin-bottom: 4px;
          color: #13233f;
        }

        .paper-left p {
          margin: 0;
          font-size: 13px;
        }

        .paper-icon {
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 15px;
          background: linear-gradient(135deg, #edf4ff, #f3fbff);
          font-size: 22px;
        }

        .ai-floating-btn {
          position: fixed;
          right: 24px;
          bottom: 24px;
          width: 62px;
          height: 62px;
          border: none;
          border-radius: 50%;
          background: linear-gradient(135deg, #2563eb, #14b8a6);
          color: white;
          font-size: 28px;
          box-shadow: 0 20px 40px rgba(37, 99, 235, 0.28);
          cursor: pointer;
          z-index: 30;
        }

        .dashboard-shell {
          background: #f7fbff;
        }

        .dashboard-header {
          min-height: 74px;
          background: rgba(255, 255, 255, 0.96);
          border-bottom: 1px solid #e8eef7;
          box-shadow: 0 8px 22px rgba(20, 42, 78, 0.04);
        }

        .header-container {
          max-width: 1840px;
          padding: 6px 40px;
        }

        .brand {
          min-width: 220px;
          gap: 12px;
        }

        .brand-mark {
          width: 54px;
          height: 54px;
          border-radius: 13px;
          background: transparent;
          box-shadow: none;
        }

        .brand-copy {
          display: grid;
          gap: 3px;
        }

        .brand-name {
          font-size: 21px;
          line-height: 1;
          color: #18243a;
          letter-spacing: -0.02em;
        }

        .brand-copy small {
          color: #2563eb;
          font-size: 13px;
          font-weight: 600;
        }

        .header-nav {
          gap: 10px;
          padding: 0;
          border: 0;
          border-radius: 0;
          background: transparent;
          box-shadow: none;
        }

        .header-nav button {
          min-width: 88px;
          min-height: 56px;
          padding: 9px 16px;
          border-radius: 18px;
          color: #39455f;
          font-size: 18px;
          font-weight: 500;
          line-height: 1.1;
        }

        .header-nav button.active {
          color: #ffffff;
          background: linear-gradient(135deg, rgba(37, 99, 235, 0.82), rgba(14, 165, 233, 0.64));
          border: 1px solid rgba(255, 255, 255, 0.38);
          box-shadow:
            0 14px 28px rgba(37, 99, 235, 0.22),
            inset 0 1px 0 rgba(255, 255, 255, 0.34),
            inset 0 -10px 20px rgba(30, 64, 175, 0.16);
          backdrop-filter: blur(12px);
        }

        .header-nav button:hover {
          color: #1d4ed8;
          background: #edf4ff;
        }

        .header-nav button.active:hover {
          color: #ffffff;
          background: linear-gradient(135deg, rgba(37, 99, 235, 0.88), rgba(14, 165, 233, 0.7));
        }

        .notification-btn {
          position: relative;
          width: 46px;
          height: 46px;
          border: 1px solid #e4ebf5;
          border-radius: 50%;
          background: #f8fbff;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .notification-bell {
          position: relative;
          width: 16px;
          height: 17px;
          border: 2px solid #42526a;
          border-bottom: 0;
          border-radius: 9px 9px 4px 4px;
        }

        .notification-bell::before {
          content: "";
          position: absolute;
          left: 50%;
          top: -5px;
          width: 5px;
          height: 5px;
          border: 2px solid #42526a;
          border-bottom: 0;
          border-radius: 999px 999px 0 0;
          transform: translateX(-50%);
        }

        .notification-bell::after {
          content: "";
          position: absolute;
          left: 50%;
          bottom: -5px;
          width: 7px;
          height: 4px;
          border-radius: 0 0 999px 999px;
          background: #42526a;
          transform: translateX(-50%);
        }

        .notification-bell-image {
          width: 22px;
          height: 22px;
          display: block;
          object-fit: contain;
        }

        .notification-count {
          position: absolute;
          top: 3px;
          right: 3px;
          min-width: 18px;
          height: 18px;
          padding: 0 5px;
          border-radius: 999px;
          background: #ef4444;
          color: #ffffff;
          border: 2px solid #ffffff;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          font-weight: 800;
          line-height: 1;
          box-shadow: 0 8px 14px rgba(239, 68, 68, 0.24);
        }

        .notification-panel {
          position: absolute;
          top: calc(100% + 12px);
          right: 0;
          width: min(360px, calc(100vw - 32px));
          background: rgba(255, 255, 255, 0.96);
          border: 1px solid rgba(124, 58, 237, 0.14);
          border-radius: 22px;
          box-shadow: 0 24px 56px rgba(76, 29, 149, 0.18);
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
          padding: 14px;
          z-index: 1200;
        }

        .notification-panel-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          padding: 8px 8px 12px;
          border-bottom: 1px solid rgba(124, 58, 237, 0.12);
        }

        .notification-panel-header h3 {
          margin: 0;
          color: #1E1B4B;
          font-size: 18px;
          line-height: 1.1;
        }

        .notification-panel-header p {
          margin: 4px 0 0;
          color: #6d5d86;
          font-size: 13px;
          font-weight: 600;
        }

        .notification-panel-header > span {
          min-width: 30px;
          height: 30px;
          padding: 0 9px;
          border-radius: 999px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #7C3AED, #C084FC);
          color: #ffffff;
          font-size: 12px;
          font-weight: 800;
        }

        .notification-list {
          display: grid;
          gap: 8px;
          padding-top: 10px;
          max-height: 340px;
          overflow: auto;
        }

        .notification-item {
          width: 100%;
          border: 0;
          border-radius: 16px;
          background: transparent;
          display: grid;
          grid-template-columns: 10px 1fr auto;
          align-items: center;
          gap: 10px;
          padding: 11px 10px;
          text-align: left;
          cursor: pointer;
          transition: background 0.2s ease, transform 0.2s ease;
        }

        .notification-item:hover {
          background: #F3E8FF;
          transform: translateY(-1px);
        }

        .notification-item-dot {
          width: 9px;
          height: 9px;
          border-radius: 999px;
          background: #7C3AED;
          box-shadow: 0 0 0 4px rgba(124, 58, 237, 0.12);
        }

        .notification-item-copy {
          display: grid;
          gap: 4px;
          min-width: 0;
        }

        .notification-item-copy strong {
          color: #1E1B4B;
          font-size: 14px;
          line-height: 1.25;
        }

        .notification-item-copy small {
          color: #6d5d86;
          font-size: 12px;
          font-weight: 600;
          line-height: 1.3;
        }

        .notification-item em {
          color: #7C3AED;
          font-size: 11px;
          font-style: normal;
          font-weight: 800;
          white-space: nowrap;
        }

        .notification-empty {
          display: grid;
          gap: 4px;
          place-items: center;
          padding: 28px 12px;
          color: #6d5d86;
          text-align: center;
        }

        .notification-empty strong {
          color: #1E1B4B;
        }

        .news-modal-overlay {
          z-index: 1400;
        }

        .news-detail-modal {
          width: min(620px, calc(100vw - 32px));
          border-radius: 24px;
          background: rgba(255, 255, 255, 0.98);
          border: 1px solid rgba(124, 58, 237, 0.16);
          box-shadow: 0 28px 70px rgba(76, 29, 149, 0.24);
          overflow: hidden;
        }
        .news-detail-header {
          padding: 24px 26px;
          background: linear-gradient(135deg, #F3E8FF, #ffffff);
          border-bottom: 1px solid rgba(124, 58, 237, 0.12);
        }

        .news-detail-header .modal-title {
          display: grid;
          gap: 8px;
        }

        .news-detail-header h2 {
          margin: 0;
          color: #1E1B4B;
          font-size: 26px;
          line-height: 1.2;
        }

        .news-detail-header p {
          margin: 0;
          color: #6d5d86;
          font-weight: 700;
        }

        .news-detail-tag {
          width: fit-content;
          padding: 6px 12px;
          border-radius: 999px;
          background: #4C1D95;
          color: #ffffff;
          font-size: 12px;
          font-weight: 800;
        }

        .news-detail-body {
          display: grid;
          gap: 16px;
          padding: 24px 26px 28px;
        }

        .news-detail-body p {
          margin: 0;
          color: #334155;
          font-size: 16px;
          line-height: 1.7;
        }

        .news-detail-sinhala {
          color: #4C1D95 !important;
          font-weight: 800;
        }

        .news-detail-note {
          display: grid;
          gap: 8px;
          padding: 16px;
          border-radius: 18px;
          background: #FAF5FF;
          border: 1px solid rgba(124, 58, 237, 0.14);
        }

        .news-detail-note strong {
          color: #4C1D95;
        }

        .news-detail-note span {
          color: #4b5563;
          line-height: 1.65;
        }
        .profile-pill {
          min-width: 230px;
          height: 50px;
          padding: 5px 12px 5px 6px;
          border: 1px solid #e3ebf6;
          background: #f8fbff;
          box-shadow: none;
        }

        .profile-avatar {
          width: 36px;
          height: 36px;
          background: #2f8df2;
        }

        .profile-name {
          display: grid;
          gap: 2px;
          text-align: left;
          min-width: 0;
        }

        .profile-name strong {
          color: #1f2937;
          font-size: 15px;
          line-height: 1;
          white-space: nowrap;
        }

        .profile-name small {
          color: #65738a;
          font-size: 12px;
          font-weight: 500;
          line-height: 1;
        }

        .profile-chevron {
          margin-left: auto;
          color: #9aa7b8;
        }

        .dashboard-main {
          padding: 30px 0 52px;
        }

        .dashboard-container {
          max-width: 1670px;
          padding: 0 36px;
        }

        .student-footer {
          margin-top: 28px;
          padding: 46px 4% 28px;
          color: #d7e3ee;
          background:
            linear-gradient(135deg, rgba(14, 165, 164, 0.16), rgba(37, 99, 235, 0.12)),
            #061826;
        }

        .student-footer .footer-grid {
          display: grid;
          grid-template-columns: 1.4fr repeat(3, 1fr);
          gap: 28px;
        }

        .student-footer .footer-brand,
        .student-footer h4 {
          color: #ffffff;
        }

        .student-footer .footer-brand {
          display: inline-flex;
          margin-bottom: 14px;
        }

        .student-footer .brand-name {
          color: #ffffff;
        }

        .student-footer h4 {
          margin: 0 0 12px;
        }

        .student-footer ul {
          display: grid;
          gap: 8px;
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .student-footer p {
          line-height: 1.65;
        }

        .student-footer .footer-accent {
          color: #67e8f9;
          font-weight: 800;
        }

        .student-footer .footer-divider {
          height: 1px;
          margin: 28px 0 16px;
          background: rgba(255, 255, 255, 0.1);
        }

        .student-footer .footer-copy {
          margin: 0;
          color: #94a3b8;
          text-align: center;
        }

        .ai-chat-screen {
          min-height: 620px;
          display: grid;
          grid-template-rows: auto 1fr auto;
          gap: 18px;
        }

        .ai-chat-screen-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
          padding: 24px;
          border-radius: 18px;
          background: #ffffff;
          box-shadow: 0 18px 45px rgba(15, 23, 42, 0.08);
        }

        .ai-chat-screen-header h2 {
          margin: 0 0 6px;
          color: #0f172a;
        }

        .ai-chat-screen-header p {
          margin: 0;
          color: #64748b;
        }

        .ai-chat-screen-body {
          min-height: 460px;
          overflow-y: auto;
          padding: 24px;
          border-radius: 18px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
        }

        .ai-chat-screen-input {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 12px;
          padding: 16px;
          border-radius: 18px;
          background: #ffffff;
          box-shadow: 0 18px 45px rgba(15, 23, 42, 0.08);
        }

        .ai-chat-screen-input input {
          min-height: 48px;
          border: 1px solid #dbe4ef;
          border-radius: 12px;
          padding: 0 16px;
          font: inherit;
        }

        .ai-chat-screen-input button {
          border: 0;
          border-radius: 12px;
          padding: 0 24px;
          color: #ffffff;
          background: #0f766e;
          font-weight: 800;
          cursor: pointer;
        }

        .stream-subject-head,
        .subject-detail-hero {
          display: flex;
          align-items: center;
          gap: 16px;
          margin: 2px 0 30px;
        }

        .stream-head-icon,
        .subject-stream-icon {
          width: 64px;
          height: 64px;
          border-radius: 16px;
          color: #ffffff;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 30px;
          font-weight: 800;
          flex-shrink: 0;
        }

        .stream-head-icon.green,
        .subject-stream-icon.green { background: #1db954; }
        .stream-head-icon.blue,
        .subject-stream-icon.blue { background: #2f6df6; }
        .stream-head-icon.orange,
        .subject-stream-icon.orange { background: #f97316; }
        .stream-head-icon.purple,
        .subject-stream-icon.purple { background: #a142f4; }
        .stream-head-icon.teal,
        .subject-stream-icon.teal { background: #0f9b8a; }

        .subject-square-icon.green {
          color: #65c90f;
          background: #effdde;
        }

        .subject-square-icon.orange {
          color: #f59e0b;
          background: #fff7df;
        }

        .subject-square-icon.sky,
        .subject-square-icon.teal {
          color: #06b6d4;
          background: #e6fbfb;
        }

        .subject-square-icon.blue,
        .subject-square-icon.purple {
          color: #10b981;
          background: #e8fbf2;
        }

        .stream-subject-head h2,
        .subject-title-row h2 {
          margin: 0;
          color: #00163d;
          font-size: 32px;
          letter-spacing: 0;
        }

        .stream-subject-head p,
        .subject-detail-hero p,
        .subject-detail-hero small {
          margin: 4px 0 0;
          color: #334155;
          font-size: 17px;
          font-weight: 600;
        }

        .stream-subject-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(240px, 1fr));
          gap: 24px;
        }

        .stream-subject-card,
        .biology-lesson-card,
        .subject-stat-card {
          background: #ffffff;
          border: 1px solid rgba(226, 232, 240, 0.86);
          border-radius: 18px;
          box-shadow: 0 12px 28px rgba(15, 23, 42, 0.10);
        }

        .stream-subject-card {
          min-height: 260px;
          padding: 24px;
          display: flex;
          flex-direction: column;
        }

        .subject-card-topline,
        .lesson-card-topline {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 20px;
        }

        .subject-square-icon,
        .bio-lesson-icon {
          width: 58px;
          height: 58px;
          border-radius: 18px;
          color: #10b981;
          background: #e8fbf2;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;
          font-weight: 800;
        }

        .subject-card-topline strong {
          padding: 8px 16px;
          border-radius: 999px;
          background: #dcfce7;
          color: #078a38;
          font-size: 15px;
        }

        .stream-subject-card h4,
        .biology-lesson-card h4 {
          margin: 0 0 8px;
          color: #00163d;
          font-size: 27px;
          line-height: 1.15;
        }

        .stream-subject-card p,
        .biology-lesson-card p {
          margin: 0;
          color: #334155;
          font-size: 19px;
          font-weight: 600;
        }

        .subject-meta-row,
        .biology-counts {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin: 26px 0 22px;
          color: #26405f;
          font-size: 16px;
        }

        .stream-subject-card .subject-btn,
        .biology-lesson-card .btn {
          margin-top: auto;
          width: 100%;
          min-height: 50px;
          border-radius: 12px;
          font-size: 17px;
        }

        .subject-detail-hero {
          align-items: flex-start;
        }

        .subject-title-row {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .subject-title-row span,
        .lesson-card-topline strong {
          padding: 8px 16px;
          border-radius: 999px;
          background: #dcfce7;
          color: #078a38;
          font-weight: 800;
        }

        .subject-detail-actions {
          margin-left: auto;
          display: flex;
          gap: 14px;
        }

        .subject-stat-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(160px, 1fr));
          gap: 22px;
          margin-bottom: 96px;
        }

        .subject-stat-card {
          min-height: 136px;
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 26px 30px;
        }

        .subject-stat-card span {
          width: 50px;
          height: 50px;
          border-radius: 10px;
          background: #dbeafe;
          color: #2563eb;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
        }

        .subject-stat-card strong {
          display: block;
          color: #00163d;
          font-size: 32px;
        }

        .subject-stat-card p {
          margin: 0;
          color: #334155;
          font-size: 18px;
        }

        .biology-lessons-section h3 {
          margin: 0 0 30px;
          color: #00163d;
          font-size: 30px;
        }

        .biology-lesson-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(260px, 1fr));
          gap: 32px;
        }

        .biology-lesson-card {
          min-height: 374px;
          padding: 30px;
          display: flex;
          flex-direction: column;
        }

        .biology-progress {
          height: 10px;
          border-radius: 999px;
          background: #e2e8f0;
          margin: 26px 0 18px;
          overflow: hidden;
        }

        .biology-progress span {
          display: block;
          height: 100%;
          border-radius: inherit;
          background: #1db954;
        }

        .subject-overview-view {
          gap: 0;
        }

        .subject-back-btn {
          align-self: flex-start;
          min-height: 36px;
          padding: 0 14px;
          margin: 0 0 18px;
          border: 1px solid #dbe4ef;
          border-radius: 10px;
          color: #334155;
          background: #ffffff;
          font-size: 14px;
          font-weight: 800;
          cursor: pointer;
          box-shadow: 0 8px 18px rgba(15, 23, 42, 0.06);
        }

        .subject-overview-view .subject-detail-hero {
          align-items: center;
          margin: 0 0 24px;
          padding: 18px 0 8px;
        }

        .subject-overview-view .subject-stream-icon {
          width: 58px;
          height: 58px;
          border-radius: 18px;
          color: #10b981;
          background: #e8fbf2;
          font-size: 0;
        }

        .subject-stream-icon.green {
          color: #65c90f;
          background: #effdde;
        }

        .subject-stream-icon.orange {
          color: #f59e0b;
          background: #fff7df;
        }

        .subject-stream-icon.sky,
        .subject-stream-icon.teal {
          color: #06b6d4;
          background: #e6fbfb;
        }

        .subject-display-icon {
          font-size: 27px;
          line-height: 1;
        }

        .subject-overview-view .subject-title-row h2 {
          font-size: 30px;
        }

        .subject-overview-view .subject-title-row span,
        .subject-overview-view .lesson-card-topline strong {
          padding: 6px 12px;
          font-size: 12px;
        }

        .subject-overview-view .subject-stat-grid {
          grid-template-columns: repeat(3, minmax(150px, 1fr));
          gap: 16px;
          margin-bottom: 28px;
        }

        .subject-overview-view .subject-stat-card:nth-child(4) {
          display: none;
        }

        .subject-overview-view .subject-stat-card {
          min-height: 92px;
          padding: 18px 20px;
          border-radius: 16px;
          box-shadow: 0 10px 24px rgba(15, 23, 42, 0.07);
        }

        .subject-overview-view .subject-stat-card span {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          font-size: 20px;
          background: #ecfdf5;
          color: #10b981;
        }

        .subject-overview-view .subject-stat-card strong {
          font-size: 24px;
        }

        .subject-overview-view .subject-stat-card p {
          font-size: 14px;
        }

        .subject-overview-view .biology-lessons-section h3 {
          margin-bottom: 18px;
          font-size: 24px;
        }

        .subject-overview-view .biology-lesson-grid {
          grid-template-columns: repeat(auto-fit, minmax(235px, 1fr));
          gap: 20px;
        }

        .subject-overview-view .biology-lesson-card {
          min-height: 300px;
          padding: 22px;
          border: 1px solid rgba(187, 247, 208, 0.85);
          border-radius: 20px;
          background:
            linear-gradient(135deg, rgba(236, 253, 245, 0.96), rgba(255, 255, 255, 0.98) 48%, rgba(240, 253, 244, 0.95)),
            #ffffff;
          box-shadow: 0 16px 34px rgba(6, 95, 70, 0.08);
        }

        .subject-overview-view .biology-lesson-card:nth-child(3n + 2) {
          border-color: rgba(153, 246, 228, 0.9);
          background:
            linear-gradient(135deg, rgba(240, 253, 250, 0.96), rgba(255, 255, 255, 0.98) 48%, rgba(236, 254, 255, 0.95)),
            #ffffff;
        }

        .subject-overview-view .biology-lesson-card:nth-child(3n) {
          border-color: rgba(254, 240, 138, 0.85);
          background:
            linear-gradient(135deg, rgba(255, 251, 235, 0.96), rgba(255, 255, 255, 0.98) 48%, rgba(240, 253, 244, 0.92)),
            #ffffff;
        }

        .subject-overview-view .lesson-card-topline {
          margin-bottom: 18px;
        }

        .subject-overview-view .bio-lesson-icon {
          width: 50px;
          height: 50px;
          border-radius: 16px;
          color: #10b981;
          background: rgba(209, 250, 229, 0.9);
        }

        .subject-overview-view .biology-lesson-card h4 {
          font-size: 19px;
        }

        .subject-overview-view .biology-lesson-card p {
          font-size: 14px;
        }

        .subject-overview-view .biology-progress {
          height: 7px;
          margin: 20px 0 14px;
          background: rgba(15, 23, 42, 0.08);
        }

        .subject-overview-view .biology-progress span {
          background: linear-gradient(90deg, #10b981, #34d399);
        }

        .subject-overview-view .biology-counts {
          margin: 18px 0 18px;
          font-size: 13px;
          color: #64748b;
        }

        .subject-overview-view .biology-lesson-card .btn {
          min-height: 44px;
          border-radius: 12px;
          font-size: 15px;
          background: linear-gradient(135deg, #10b981, #34d399);
        }

        .lesson-resource-hero {
          display: flex;
          align-items: center;
          gap: 20px;
          margin-bottom: 72px;
        }

        .lesson-resource-hero h2 {
          margin: 0;
          color: #00163d;
          font-size: 40px;
        }

        .lesson-resource-hero p,
        .lesson-resource-hero small {
          display: block;
          margin-top: 6px;
          color: #334155;
          font-size: 18px;
        }

        .lesson-resource-hero .btn {
          margin-left: auto;
        }

        .resource-panel {
          background: #ffffff;
          border: 1px solid rgba(226, 232, 240, 0.9);
          border-radius: 18px;
          box-shadow: 0 14px 34px rgba(15, 23, 42, 0.10);
          padding: 30px;
          margin-bottom: 80px;
        }

        .resource-title-row {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 20px;
        }

        .resource-title-row h3 {
          margin: 0;
          color: #00163d;
          font-size: 30px;
        }

        .lesson-resource-view {
          gap: 0;
        }

        .lesson-back-btn {
          align-self: flex-start;
          min-height: 38px;
          padding: 0 16px;
          margin: 0 0 18px;
          border: 1px solid rgba(37, 99, 235, 0.28);
          border-radius: 999px;
          color: #2563eb;
          background: rgba(255, 255, 255, 0.72);
          font-size: 14px;
          font-weight: 800;
          cursor: pointer;
          box-shadow: 0 12px 28px rgba(37, 99, 235, 0.10);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
        }

        .lesson-resource-view .lesson-resource-hero {
          margin-bottom: 38px;
          padding: 8px 0 18px;
          align-items: center;
        }

        .lesson-resource-view .subject-stream-icon {
          width: 62px;
          height: 62px;
          border-radius: 18px;
          color: #65c90f;
          background: rgba(239, 253, 222, 0.9);
          box-shadow: 0 16px 34px rgba(101, 201, 15, 0.12);
        }

        .lesson-resource-view .lesson-resource-hero h2 {
          font-size: 34px;
          line-height: 1.18;
          max-width: 980px;
        }

        .lesson-resource-view .lesson-resource-hero p {
          margin-top: 8px;
          font-size: 18px;
          color: #475569;
        }

        .lesson-resource-view .lesson-resource-hero small {
          margin-top: 10px;
          font-size: 15px;
          color: #64748b;
        }

        .lesson-resource-view .resource-panel {
          padding: 24px;
          margin-bottom: 28px;
          border: 1px solid rgba(226, 232, 240, 0.72);
          border-radius: 22px;
          background: rgba(255, 255, 255, 0.76);
          box-shadow: 0 18px 42px rgba(15, 23, 42, 0.08);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
        }

        .lesson-resource-view .resource-title-row {
          margin-bottom: 18px;
        }

        .lesson-resource-view .resource-title-row h3 {
          font-size: 24px;
          letter-spacing: 0;
        }

        .lesson-resource-view .resource-icon {
          width: 42px;
          height: 42px;
          border-radius: 14px;
          font-size: 20px;
        }

        .lesson-resource-view .resource-panel:nth-of-type(2) .resource-title-row h3 {
          font-size: 0;
        }

        .lesson-resource-view .resource-panel:nth-of-type(2) .resource-title-row h3::after {
          content: "Notes • සටහන්";
          font-size: 24px;
        }

        .lesson-resource-view .video-resource-grid {
          gap: 20px;
        }

        .lesson-resource-view .video-card {
          padding: 12px;
          border: 1px solid rgba(203, 213, 225, 0.72);
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.76);
          box-shadow: 0 14px 30px rgba(15, 23, 42, 0.06);
          overflow: hidden;
        }

        .lesson-resource-view .video-frame {
          border-radius: 14px;
          overflow: hidden;
          background: #0f172a;
        }

        .lesson-resource-view .video-card h4 {
          margin: 14px 4px 4px;
          font-size: 16px;
        }

        .lesson-resource-view .video-card p,
        .lesson-resource-view .video-meta-row,
        .lesson-resource-view .simple-mcq-start-card {
          display: none;
        }

        .lesson-resource-view .note-resource-card,
        .lesson-resource-view .paper-resource-card {
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.78);
          box-shadow: 0 12px 26px rgba(15, 23, 42, 0.06);
        }

        .lesson-resource-view .paper-selector {
          margin: 0 0 18px;
          padding: 0;
          border: 0;
          background: transparent;
        }

        .lesson-resource-view .paper-selector > strong {
          color: #334155;
          font-size: 14px;
          font-weight: 600;
        }

        .lesson-resource-view .paper-year-row button {
          min-width: 74px;
          min-height: 38px;
          border-radius: 10px;
          font-size: 15px;
          font-weight: 600;
        }

        .lesson-resource-view .paper-type-tabs {
          width: fit-content;
          padding: 4px;
          border-radius: 14px;
          background: rgba(248, 250, 252, 0.9);
        }

        .lesson-resource-view .paper-type-tabs button {
          min-width: 96px;
          min-height: 36px;
          border-radius: 11px;
          font-size: 14px;
          font-weight: 600;
        }

        .lesson-resource-view .paper-resource-grid {
          grid-template-columns: minmax(240px, 520px);
          gap: 20px;
        }

        .resource-icon {
          width: 50px;
          height: 50px;
          border-radius: 10px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          font-weight: 800;
        }

        .resource-icon.video { background: #fee2e2; color: #ef4444; }
        .resource-icon.notes { background: #ffedd5; color: #f97316; }
        .resource-icon.papers { background: #f3e8ff; color: #9333ea; }

        .video-resource-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(260px, 1fr));
          gap: 18px;
        }

        .video-card {
          border: 1px solid #dbe4ef;
          border-radius: 14px;
          background: #ffffff;
          padding: 14px;
        }

        .video-card h4 {
          margin: 12px 0 6px;
          color: #00163d;
          font-size: 18px;
        }

        .video-card p {
          margin: 0;
          color: #64748b;
          font-size: 14px;
        }

        .video-empty-state {
          border: 1px dashed #cbd5e1;
          border-radius: 14px;
          background: #f8fafc;
          color: #64748b;
          padding: 22px;
          font-size: 16px;
          font-weight: 700;
        }

        .video-frame {
          width: 100%;
          aspect-ratio: 16 / 9;
          max-height: 260px;
          border-radius: 12px;
          overflow: hidden;
          background: #0f172a;
        }

        .video-frame iframe {
          width: 100%;
          height: 100%;
          border: 0;
          display: block;
        }

        .video-meta-row {
          display: flex;
          flex-wrap: wrap;
          gap: 22px;
          margin-top: 18px;
          color: #334155;
          font-size: 16px;
        }

        .notes-resource-grid,
        .paper-resource-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(240px, 1fr));
          gap: 20px;
        }

        .note-resource-card,
        .paper-resource-card {
          border: 1px solid #dbe4ef;
          border-radius: 14px;
          padding: 20px;
          background: #ffffff;
        }

        .note-resource-card {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 14px;
        }

        .note-resource-card > span {
          width: 58px;
          height: 58px;
          border-radius: 10px;
          background: #fff7ed;
          color: #f97316;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
        }

        .note-resource-card h4,
        .paper-resource-card h4 {
          margin: 0 0 8px;
          color: #00163d;
          font-size: 20px;
        }

        .note-resource-card p,
        .paper-resource-card p {
          margin: 0;
          color: #334155;
        }

        .note-actions {
          grid-column: 1 / -1;
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
        }

        .note-actions a {
          min-height: 46px;
          border: 1px solid #f97316;
          border-radius: 10px;
          color: #f97316;
          font-size: 17px;
          font-weight: 800;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          text-decoration: none;
        }

        .note-actions a:last-child {
          background: #f97316;
          color: #ffffff;
        }

        .paper-selector {
          display: grid;
          gap: 12px;
          margin-bottom: 22px;
        }

        .paper-year-row,
        .paper-type-tabs {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .paper-year-row button,
        .paper-type-tabs button {
          border: 0;
          border-radius: 10px;
          min-width: 82px;
          min-height: 40px;
          background: #eef2f7;
          color: #1e293b;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
        }

        .paper-year-row button.active {
          background: linear-gradient(135deg, #2563eb, #0f9b8a);
          color: #ffffff;
        }

        .paper-type-tabs {
          width: fit-content;
          padding: 5px;
          border-radius: 999px;
          background: #eef2f7;
        }

        .paper-type-tabs button {
          border-radius: 999px;
          background: transparent;
        }

        .paper-type-tabs button.active {
          background: #ffffff;
          color: #2563eb;
          box-shadow: 0 8px 18px rgba(15, 23, 42, 0.08);
        }

        .paper-resource-grid {
          grid-template-columns: minmax(240px, 520px);
        }

        .paper-card-head {
          display: flex;
          justify-content: space-between;
          gap: 16px;
        }

        .paper-card-head span {
          align-self: flex-start;
          padding: 7px 14px;
          border-radius: 999px;
          background: #fef3c7;
          color: #a16207;
          font-weight: 600;
        }

        .paper-card-head span.hard {
          background: #fee2e2;
          color: #dc2626;
        }

        .paper-actions {
          display: grid;
          grid-template-columns: 1fr;
          gap: 10px;
          margin-top: 16px;
        }

        .paper-actions button {
          min-height: 42px;
          border-radius: 10px;
          font-weight: 600;
          font-size: 15px;
          cursor: pointer;
        }

        .paper-actions .start {
          border: 0;
          color: #ffffff;
          background: linear-gradient(135deg, #2563eb, #0f9b8a);
        }

        .paper-actions .pdf {
          border: 1px solid #cbd5e1;
          background: #ffffff;
          color: #1e293b;
          padding: 0 22px;
        }

        .simple-mcq-start-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
          border: 1px solid #e9d5ff;
          border-radius: 16px;
          background: #faf5ff;
          padding: 22px;
        }

        .simple-mcq-start-card h4 {
          margin: 0 0 6px;
          color: #1e1b4b;
          font-size: 24px;
        }

        .simple-mcq-start-card p {
          margin: 0;
          color: #4c1d95;
          font-weight: 700;
        }

        .simple-mcq-start-card button {
          border: 0;
          border-radius: 12px;
          min-height: 50px;
          padding: 0 24px;
          color: #ffffff;
          background: linear-gradient(135deg, #7c3aed, #0f9b8a);
          font-size: 17px;
          font-weight: 800;
          cursor: pointer;
          white-space: nowrap;
        }

        .mcq-practice-panel {
          margin-top: 28px;
          border: 1px solid rgba(124, 58, 237, 0.18);
          border-radius: 18px;
          background: #faf5ff;
          padding: 24px;
        }

        .mcq-practice-head {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
          margin-bottom: 20px;
        }

        .mcq-practice-head h3 {
          margin: 0;
          color: #4c1d95;
          font-size: 22px;
        }

        .mcq-practice-head p {
          margin: 6px 0 0;
          color: #64748b;
          font-weight: 700;
        }

        .mcq-practice-head button,
        .mcq-submit-btn {
          border: 0;
          border-radius: 999px;
          background: linear-gradient(135deg, #7c3aed, #c084fc);
          color: #ffffff;
          min-height: 44px;
          padding: 0 22px;
          font-weight: 800;
          cursor: pointer;
        }

        .mcq-question-list {
          display: grid;
          gap: 18px;
        }

        .mcq-question-card {
          border: 1px solid rgba(124, 58, 237, 0.14);
          border-radius: 16px;
          background: #ffffff;
          padding: 20px;
        }

        .mcq-question-top {
          display: flex;
          justify-content: space-between;
          color: #7c3aed;
          font-weight: 800;
        }

        .mcq-question-card h4 {
          margin: 12px 0;
          color: #1e1b4b;
          font-size: 20px;
          line-height: 1.5;
        }

        .mcq-label {
          margin: 0 0 10px;
          color: #4c1d95;
          font-weight: 800;
        }

        .mcq-options {
          display: grid;
          gap: 10px;
        }

        .mcq-option {
          display: flex;
          gap: 10px;
          align-items: flex-start;
          border: 1px solid #e9d5ff;
          border-radius: 12px;
          padding: 12px;
          color: #1e1b4b;
          cursor: pointer;
        }

        .mcq-option input {
          margin-top: 4px;
          accent-color: #7c3aed;
        }

        .mcq-feedback {
          margin-top: 14px;
          border-radius: 12px;
          padding: 14px;
        }

        .mcq-feedback.correct {
          background: #dcfce7;
          color: #166534;
        }

        .mcq-feedback.wrong {
          background: #fee2e2;
          color: #991b1b;
        }

        .mcq-submit-btn {
          margin-top: 18px;
          min-width: 190px;
        }

        .mcq-score-card {
          margin-top: 20px;
          border-radius: 16px;
          background: #ffffff;
          border: 1px solid #e9d5ff;
          padding: 20px;
          color: #4c1d95;
        }

        .mcq-score-card span,
        .mcq-score-card p {
          margin: 0;
          font-weight: 800;
        }

        .mcq-score-card strong {
          display: block;
          margin: 8px 0;
          color: #1e1b4b;
          font-size: 34px;
        }

        .compact-dashboard {
          display: grid;
          gap: 28px;
        }

        .compact-dashboard .motivation-banner {
          min-height: 210px;
          margin: 0;
          padding: 40px;
          border-radius: 16px;
          background:
            linear-gradient(120deg, rgba(37, 79, 208, 0.88) 0%, rgba(8, 127, 183, 0.78) 100%),
            url("/cover-pic.png") center / cover no-repeat;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
          box-shadow: 0 20px 48px rgba(25, 72, 158, 0.18);
        }

        .compact-dashboard .motivation-banner::after {
          display: none;
        }

        .compact-dashboard .motivation-content {
          gap: 12px;
          align-items: flex-start;
        }

        .compact-dashboard .motivation-icon {
          width: 40px;
          height: 40px;
          border-radius: 9px;
          font-size: 22px;
          background: rgba(255, 255, 255, 0.14);
          flex: 0 0 auto;
        }

        .hero-greeting {
          margin: 8px 0 22px;
          font-size: 17px;
          font-weight: 700;
          letter-spacing: 0.04em;
        }

        .compact-dashboard .motivation-banner h2 {
          margin: 0 0 10px;
          font-size: 30px;
          line-height: 1.2;
          letter-spacing: -0.03em;
        }

        .sinhala-line {
          margin: 0;
          font-size: 19px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.86);
        }

        .hero-count-box {
          width: 135px;
          min-height: 114px;
          padding: 18px 12px;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.28);
          background: rgba(255, 255, 255, 0.12);
          text-align: center;
          color: #ffffff;
        }

        .hero-count-box strong {
          display: block;
          font-size: 38px;
          line-height: 1;
        }

        .hero-count-box span,
        .hero-count-box small {
          display: block;
          margin-top: 6px;
          font-size: 13px;
          font-weight: 700;
        }

        .home-top-grid {
          grid-template-columns: minmax(360px, 0.86fr) minmax(600px, 1.8fr);
          gap: 24px;
          margin: 0;
          align-items: stretch;
        }

        .dashboard-card,
        .lesson-card-item,
        .class-card-item,
        .subject-card-modern-home,
        .summary-card {
          border: 1px solid #e4edf8;
          border-radius: 16px;
          background: #ffffff;
          box-shadow: 0 12px 32px rgba(20, 42, 78, 0.04);
        }

        .compact-card {
          padding: 22px 20px;
        }

        .countdown-card.compact-card {
          align-self: stretch;
        }

        .news-card.compact-card {
          align-self: stretch;
          display: flex;
          flex-direction: column;
          min-height: 0;
        }

        .card-title-row,
        .section-topline,
        .lesson-card-top,
        .class-card-top,
        .mini-progress-row {
          display: flex;
          align-items: center;
        }

        .card-title-row {
          gap: 12px;
        }

        .section-topline {
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 18px;
        }

        .section-topline h3,
        .card-title-row h3 {
          margin: 0;
          color: #071225;
          font-size: 21px;
          line-height: 1.1;
        }

        .section-subtitle,
        .lesson-sinhala {
          margin: 6px 0 0;
          color: #8793a8;
          font-size: 14px;
          font-weight: 600;
        }

        .mini-icon {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          font-weight: 800;
          flex: 0 0 auto;
        }

        .mini-icon.blue { color: #2f6df6; background: #eef5ff; }
        .mini-icon.green { color: #07945f; background: #eefbf5; }
        .mini-icon.teal { color: #0b9886; background: #edfbf8; }
        .mini-icon.orange { color: #ea940d; background: #fff8e7; }
        .mini-icon.purple { color: #7c3aed; background: #f3efff; }
        .mini-icon.sky { color: #0895d1; background: #eaf8ff; }

        .view-all-btn {
          border: 0;
          background: transparent;
          color: #1d4ed8;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
        }

        .countdown-number {
          margin: 18px 0;
          min-height: 130px;
          border-radius: 14px;
          background: linear-gradient(135deg, #2f6df6, #13a2e5);
          color: #ffffff;
          display: grid;
          place-items: center;
          align-content: center;
        }

        .countdown-number strong {
          font-size: 62px;
          line-height: 1;
        }

        .countdown-number span {
          margin-top: 8px;
          font-size: 17px;
          font-weight: 800;
        }

        .detail-list {
          display: grid;
          gap: 10px;
          padding-bottom: 14px;
          border-bottom: 1px solid #edf2f7;
        }

        .detail-list p {
          display: flex;
          justify-content: space-between;
          gap: 18px;
          margin: 0;
          color: #65738a;
          font-size: 15px;
        }

        .detail-list strong {
          color: #1f2937;
        }

        .mini-progress-row {
          justify-content: space-between;
          margin-top: 12px;
          color: #65738a;
          font-size: 14px;
        }

        .mini-progress-row strong {
          color: #1f2937;
        }

        .thin-progress,
        .lesson-progress-bar,
        .subject-progress-home {
          height: 7px;
          border-radius: 999px;
          overflow: hidden;
          background: #eef3f8;
        }

        .countdown-card .thin-progress {
          margin-top: 10px;
        }

        .thin-progress span,
        .lesson-progress-fill,
        .subject-progress-fill-home {
          display: block;
          height: 100%;
          border-radius: inherit;
          background: #3b82f6;
        }

        .compact-news-list {
          display: grid;
          gap: 14px;
          max-height: 236px;
          overflow-y: auto;
          padding-right: 6px;
          overscroll-behavior: contain;
        }

        .compact-news-list::-webkit-scrollbar {
          width: 8px;
        }

        .compact-news-list::-webkit-scrollbar-track {
          background: #f3e8ff;
          border-radius: 999px;
        }

        .compact-news-list::-webkit-scrollbar-thumb {
          background: #c084fc;
          border-radius: 999px;
        }

        .news-item {
          min-height: 110px;
          display: grid;
          grid-template-columns: auto 1fr auto;
          gap: 16px;
          align-items: center;
          padding: 16px;
          border: 1px solid #edf2f7;
          border-radius: 12px;
          background: #f9fbfd;
          width: 100%;
          color: inherit;
          font: inherit;
          text-align: left;
          cursor: pointer;
          transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
        }

        .news-item:hover {
          border-color: rgba(76, 29, 149, 0.24);
          box-shadow: 0 14px 28px rgba(76, 29, 149, 0.10);
          transform: translateY(-1px);
        }

        .news-icon {
          width: 46px;
          height: 46px;
          border: 1px solid #e1e8f2;
          border-radius: 10px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: #64748b;
          background: #ffffff;
        }

        .news-item h4 {
          margin: 0;
          color: #111827;
          font-size: 18px;
        }

        .news-item p {
          margin: 6px 0 0;
          color: #67758b;
          font-size: 14px;
        }

        .tag-line {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-top: 8px;
        }

        .tag-line span {
          padding: 4px 11px;
          border-radius: 999px;
          background: #e8f1ff;
          color: #2563eb;
          font-size: 12px;
          font-weight: 800;
        }

        .tag-line small {
          color: #95a1b2;
        }

        .home-section {
          margin: 0;
        }

        .lesson-cards-grid,
        .class-cards-list {
          grid-template-columns: repeat(3, minmax(260px, 1fr));
          gap: 20px;
        }

        .lesson-card-item,
        .class-card-item {
          display: block;
          min-height: 264px;
          padding: 24px;
        }

        .lesson-card-top,
        .class-card-top {
          justify-content: space-between;
          margin-bottom: 18px;
        }

        .lesson-card-top small,
        .class-card-top small {
          padding: 5px 12px;
          border-radius: 999px;
          background: #f0f4f8;
          color: #7b8799;
          font-weight: 800;
        }

        .lesson-card-item h4,
        .class-card-item h4 {
          margin: 0 0 6px;
          color: #071225;
          font-size: 19px;
        }

        .lesson-meta,
        .class-meta {
          margin: 8px 0 0;
          color: #67758b;
          font-size: 15px;
        }

        .lesson-card-item .btn,
        .class-card-item .btn {
          width: 100%;
          min-height: 44px;
          margin-top: 16px;
          border-radius: 10px;
          font-size: 15px;
        }

        .lesson-card-item.green .lesson-progress-fill,
        .class-card-item.green .btn,
        .subject-card-modern-home.green .subject-progress-fill-home {
          background: #0aa36d;
        }

        .lesson-card-item.teal .lesson-progress-fill,
        .class-card-item.teal .btn,
        .subject-card-modern-home.teal .subject-progress-fill-home {
          background: #12a79a;
        }

        .class-card-item.purple .btn,
        .subject-card-modern-home.purple .subject-progress-fill-home {
          background: #7c3aed;
        }

        .subject-card-modern-home.orange .subject-progress-fill-home {
          background: #f59e0b;
        }

        .subject-card-modern-home.sky .subject-progress-fill-home {
          background: #0ea5e9;
        }

        .subject-card-grid-home {
          grid-template-columns: repeat(5, minmax(180px, 1fr));
          gap: 20px;
        }

        .subject-card-modern-home {
          min-height: 236px;
          padding: 20px;
          text-align: center;
        }

        .subject-emoji {
          width: 60px;
          height: 60px;
          margin: 0 auto 18px;
          border-radius: 14px;
          font-size: 24px;
        }

        .subject-card-modern-home h4 {
          font-size: 16px;
        }

        .subject-card-modern-home p {
          font-size: 13px;
        }

        .lesson-count {
          display: block;
          margin-top: 14px;
          color: #94a3b8;
          font-size: 13px;
        }

        .summary-grid {
          display: none;
          grid-template-columns: repeat(4, minmax(190px, 1fr));
          gap: 20px;
        }

        .summary-card {
          display: grid;
          grid-template-columns: auto 1fr;
          column-gap: 14px;
          align-items: center;
          padding: 22px;
        }

        .summary-card span {
          grid-row: span 3;
          width: 50px;
          height: 50px;
          border-radius: 12px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: #eef5ff;
          color: #2563eb;
          font-size: 24px;
        }

        .summary-card strong {
          color: #0f172a;
          font-size: 30px;
          line-height: 1;
        }

        .summary-card p,
        .summary-card small {
          margin: 0;
          color: #667085;
          font-weight: 700;
        }

        .classes-group-stack {
          display: grid;
          gap: 20px;
        }

        .class-subject-group {
          padding: 20px;
        }

        .class-post-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 16px;
        }

        .class-post-card {
          border: 1px solid #e5edf7;
          border-radius: 14px;
          background: #fbfdff;
          padding: 18px;
          text-align: left;
          cursor: pointer;
          transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
        }

        .class-post-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 14px 28px rgba(20, 42, 78, 0.08);
        }

        .class-post-card.relevant {
          border-color: #cfe0fb;
          background: #f8fbff;
        }

        .class-post-top,
        .class-detail-head,
        .class-detail-meta {
          display: flex;
          align-items: center;
        }

        .class-post-top {
          justify-content: space-between;
          margin-bottom: 14px;
        }

        .class-post-top small {
          padding: 4px 10px;
          border-radius: 999px;
          background: #eef3f8;
          color: #708199;
          font-size: 12px;
          font-weight: 800;
        }

        .class-post-card h4 {
          margin: 0 0 6px;
          color: #0f172a;
          font-size: 17px;
        }

        .class-detail-post {
          margin-top: 20px;
          padding: 22px 24px;
        }

        .class-detail-head {
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
        }

        .class-detail-subject {
          margin: 0 0 8px;
          color: #2563eb;
          font-size: 13px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .class-detail-head h3 {
          margin: 0 0 6px;
          color: #0f172a;
          font-size: 24px;
        }

        .class-detail-copy {
          margin: 16px 0;
          color: #475569;
          line-height: 1.7;
        }

        .class-detail-meta {
          flex-wrap: wrap;
          gap: 10px 16px;
          color: #64748b;
          font-size: 14px;
        }

        .ai-floating-btn {
          width: 70px;
          height: 70px;
          right: 28px;
          bottom: 28px;
          background: #1689e8;
          font-size: 30px;
        }

        .ai-chat-panel {
          position: fixed;
          right: 28px;
          bottom: 104px;
          width: min(560px, calc(100vw - 40px));
          height: min(70vh, 720px);
          border-radius: 16px;
          overflow: hidden;
          background: #f8fafc;
          border: 1px solid #dbe6f4;
          box-shadow: 0 24px 54px rgba(15, 23, 42, 0.18);
          z-index: 35;
          display: flex;
          flex-direction: column;
          transition: width 0.2s ease, height 0.2s ease, right 0.2s ease, bottom 0.2s ease;
        }

        .ai-chat-panel.maximized {
          width: min(720px, calc(100vw - 56px));
          height: 82vh;
          right: 50%;
          bottom: 50%;
          transform: translate(50%, 50%);
        }

        .ai-chat-head {
          min-height: 74px;
          padding: 16px 18px;
          background: linear-gradient(135deg, #2371e8, #0ea5e9);
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex: 0 0 auto;
          gap: 14px;
        }

        .ai-chat-head strong,
        .ai-chat-head small {
          display: block;
        }

        .ai-chat-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .ai-chat-head button {
          border: 0;
          background: rgba(255, 255, 255, 0.14);
          color: #ffffff;
          width: 34px;
          height: 34px;
          border-radius: 10px;
          font-size: 20px;
          line-height: 1;
          cursor: pointer;
        }

        .ai-chat-body {
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          flex: 1 1 auto;
          min-height: 0;
          overflow-y: auto;
          scroll-behavior: smooth;
        }

        .ai-chat-body p {
          margin: 0;
          padding: 15px 17px;
          border: 1px solid #e3eaf5;
          border-radius: 12px;
          background: #ffffff;
          color: #334155;
          line-height: 1.7;
          font-size: 15.5px;
          white-space: pre-wrap;
          overflow-wrap: anywhere;
          word-break: break-word;
        }

        .ai-chat-body strong {
          font-weight: 800;
          color: #1e1b4b;
        }

        .ai-chat-body p:not([class]) {
          order: 0;
        }

        .ai-chat-body .ai-user-message,
        .ai-chat-body .ai-assistant-message,
        .ai-chat-body .ai-error-message {
          order: 1;
        }

        .ai-chat-body .ai-user-message {
          align-self: flex-end;
          max-width: 86%;
          background: #f3e8ff;
          border-color: #d8b4fe;
          color: #4c1d95;
        }

        .ai-chat-body .ai-assistant-message {
          align-self: flex-start;
          max-width: 90%;
        }

        .ai-chat-body .ai-error-message {
          border-color: #fecaca;
          background: #fff1f2;
          color: #991b1b;
        }

        .ai-chat-input {
          flex: 0 0 auto;
          display: flex;
          gap: 10px;
          padding: 14px 16px 16px;
          border-top: 1px solid #e3eaf5;
          background: rgba(248, 250, 252, 0.96);
        }

        .ai-chat-input input {
          flex: 1;
          min-width: 0;
          height: 48px;
          border: 1px solid #dbe6f4;
          border-radius: 12px;
          padding: 0 15px;
          font-size: 14px;
        }

        .class-action-row {
          display: grid;
          grid-template-columns: 1fr auto;
          align-items: center;
          gap: 10px;
          margin-top: 18px;
        }

        .class-action-row .btn {
          margin-top: 0;
        }

        .class-save-btn {
          width: 46px;
          min-height: 44px;
          border: 0;
          border-radius: 12px;
          background: #f8fafc;
          color: #64748b;
          font-size: 16px;
          font-weight: 900;
          cursor: pointer;
          transition: transform 0.2s ease, box-shadow 0.2s ease, color 0.2s ease;
        }

        .class-save-btn:hover {
          color: #10b981;
          box-shadow: 0 10px 22px rgba(15, 23, 42, 0.08);
          transform: translateY(-1px);
        }

        .class-card-item.orange {
          border-color: #fde68a;
        }

        .class-card-item.rose {
          border-color: #fecaca;
        }

        .class-card-item.teal {
          border-color: #99f6e4;
        }

        .class-card-item.orange .mini-icon {
          color: #b45309;
          background: #fffbeb;
        }

        .class-card-item.rose .mini-icon {
          color: #9f1239;
          background: #ffe4e6;
        }

        .class-card-item.teal .mini-icon {
          color: #0f766e;
          background: #ccfbf1;
        }

        .class-card-item.orange .class-card-top small,
        .class-card-item.teal .class-card-top small {
          background: #d1fae5;
          color: #047857;
        }

        .class-card-item.rose .class-card-top small {
          background: #f5f5f5;
          color: #525252;
        }

        .ai-chat-input button {
          min-width: 76px;
          padding: 0 18px;
          border: 0;
          border-radius: 12px;
          background: #2563eb;
          color: #ffffff;
          cursor: pointer;
          font-weight: 800;
          font-size: 15px;
        }

        .ai-chat-input button:disabled {
          cursor: not-allowed;
          opacity: 0.65;
        }

        @media (max-width: 640px) {
          .ai-chat-panel,
          .ai-chat-panel.maximized {
            right: 3vw;
            bottom: 92px;
            width: 94vw;
            height: 75vh;
            transform: none;
            border-radius: 18px;
          }

          .ai-chat-head {
            min-height: 68px;
            padding: 14px;
          }

          .ai-chat-body {
            padding: 14px;
          }

          .ai-chat-body p {
            font-size: 15px;
            line-height: 1.7;
          }

          .ai-chat-input {
            padding: 12px;
          }

          .ai-chat-input button {
            min-width: 66px;
            padding: 0 12px;
          }
        }

        @media (max-width: 900px) {
          .header-nav {
            display: none;
          }

          .header-nav.active {
            display: flex;
            flex-direction: column;
            position: absolute;
            top: calc(100% + 8px);
            left: 20px;
            right: 20px;
            width: auto;
            background: rgba(255, 255, 255, 0.96);
            padding: 14px;
            border: 1px solid #dce8fb;
            border-radius: 22px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.08);
          }

          .header-nav button {
            width: 100%;
            text-align: left;
            border-radius: 14px;
          }

          .menu-toggle {
            display: block;
          }

          .profile-name {
            display: none;
          }

          .home-top-grid {
            grid-template-columns: 1fr;
          }

          .settings-form {
            grid-template-columns: 1fr;
          }

          .student-footer .footer-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .stream-subject-grid,
          .biology-lesson-grid,
          .subject-stat-grid,
          .video-resource-grid,
          .notes-resource-grid,
          .paper-resource-grid {
            grid-template-columns: 1fr;
          }

          .subject-detail-hero,
          .lesson-resource-hero {
            flex-direction: column;
          }

          .subject-detail-actions,
          .lesson-resource-hero .btn {
            margin-left: 0;
            width: 100%;
          }

          .toggle-group {
            grid-column: span 1;
          }
        }

        @media (max-width: 640px) {
          .header-container,
          .dashboard-container {
            padding-left: 18px;
            padding-right: 18px;
          }

          .motivation-content {
            align-items: flex-start;
          }

          .class-card-item,
          .paper-row {
            flex-direction: column;
            align-items: flex-start;
          }

          .class-card-item .btn,
          .paper-row .btn {
            width: 100%;
          }

          .motivation-banner p {
            font-size: 15px;
          }

          .lesson-cards-grid {
            grid-template-columns: 1fr;
          }

          .subject-card-grid.full,
          .subject-card-grid-home {
            grid-template-columns: 1fr;
          }

          .student-footer .footer-grid {
            grid-template-columns: 1fr;
          }
        }

        .dashboard-shell {
          background: #fdfcf9;
          color: #1f2933;
        }

        .dashboard-header {
          min-height: 74px;
          background: rgba(255, 255, 255, 0.86);
          border-bottom: 1px solid rgba(229, 231, 235, 0.9);
          box-shadow: 0 14px 36px rgba(15, 23, 42, 0.06);
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
        }

        .header-container {
          max-width: none;
          padding: 14px 4%;
          gap: 22px;
        }

        .brand {
          color: #111827;
          font-weight: 800;
        }

        .brand-mark {
          width: 38px;
          height: 38px;
          background: transparent;
          box-shadow: none;
        }

        .brand-logo-shell {
          padding: 0;
        }

        .brand-name {
          font-size: 18px;
        }

        .brand-copy small {
          color: #10b981;
          font-weight: 700;
        }

        .header-nav {
          gap: 28px;
          padding: 0;
          background: transparent;
          border: 0;
          border-radius: 0;
          box-shadow: none;
        }

        .header-nav button {
          position: relative;
          min-width: auto;
          min-height: auto;
          padding: 0;
          border-radius: 0;
          color: #263854;
          font-size: 15px;
          font-weight: 700;
          background: transparent;
        }

        .header-nav button::after {
          content: "";
          position: absolute;
          left: 0;
          bottom: -7px;
          width: 0;
          height: 2px;
          border-radius: 999px;
          background: #10b981;
          transition: width 0.2s ease;
        }

        .header-nav button:hover,
        .header-nav button.active {
          color: #10b981;
          background: transparent;
          box-shadow: none;
        }

        .header-nav button:hover::after,
        .header-nav button.active::after {
          width: 100%;
        }

        .notification-btn,
        .profile-pill,
        .menu-toggle {
          background: rgba(236, 253, 245, 0.82);
          border-color: rgba(16, 185, 129, 0.18);
          box-shadow: 0 12px 24px rgba(16, 185, 129, 0.10);
        }

        @media (max-width: 900px) {
          .header-nav.active {
            background: rgba(255, 255, 255, 0.96);
            border: 1px solid rgba(16, 185, 129, 0.16);
            border-radius: 20px;
            box-shadow: 0 20px 40px rgba(6, 95, 70, 0.12);
            padding: 12px;
          }

          .header-nav button {
            width: 100%;
            padding: 12px 14px;
            border-radius: 14px;
            text-align: left;
          }

          .header-nav button::after {
            display: none;
          }

          .header-nav button:hover,
          .header-nav button.active {
            background: #d1fae5;
          }
        }

        .brand-name,
        .header-nav button:hover,
        .header-nav button.active,
        .view-all-btn,
        .forgot-link {
          color: #10b981;
        }

        .header-nav button:hover,
        .header-nav button.active {
          background: transparent;
          box-shadow: none;
        }

        @media (max-width: 900px) {
          .header-nav button:hover,
          .header-nav button.active {
            background: #d1fae5;
          }
        }

        .profile-avatar,
        .btn.solid,
        .sign-in-btn,
        .mini-icon,
        .ai-chat-input button {
          background: linear-gradient(135deg, #10b981, #34d399);
        }

        .motivation-banner,
        .countdown-card,
        .dashboard-card,
        .summary-card,
        .subject-card-modern,
        .subject-card-modern-home,
        .lesson-card-item,
        .class-card-item,
        .ai-chat-panel {
          border-color: rgba(16, 185, 129, 0.20);
          box-shadow: 0 20px 44px rgba(6, 95, 70, 0.08);
        }

        .thin-progress span,
        .lesson-progress-fill,
        .subject-progress-fill,
        .subject-progress-fill-home {
          background: linear-gradient(90deg, #10b981, #34d399);
        }

        .section-subtitle,
        .sinhala-line,
        .lesson-sinhala {
          color: #6b7280;
        }

        .header-nav button::after {
          background: #10b981;
        }

        .header-nav button:hover,
        .header-nav button.active {
          color: #10b981;
        }

        @media (max-width: 900px) {
          .header-nav button:hover,
          .header-nav button.active {
            color: #047857;
          }
        }

        .dashboard-header .brand-name {
          color: #111827;
        }

        .compact-dashboard .motivation-banner {
          background:
            linear-gradient(90deg, rgba(255, 255, 255, 0.96) 0%, rgba(255, 255, 255, 0.92) 72%, rgba(236, 253, 245, 0.78) 100%),
            url("/cover-pic.png") center / cover no-repeat;
          color: #111827;
          border: 1px solid #e5e7eb;
          box-shadow: 0 18px 42px rgba(15, 23, 42, 0.06);
        }

        .compact-dashboard .motivation-icon {
          color: #10b981;
          background: #d1fae5;
        }

        .compact-dashboard .motivation-banner h2 {
          color: #111827;
        }

        .hero-greeting,
        .sinhala-line {
          color: #9ca3af;
        }

        .hero-count-box {
          background: rgba(255, 255, 255, 0.9);
          border-color: #e5e7eb;
          color: #10b981;
          box-shadow: 0 14px 32px rgba(15, 23, 42, 0.08);
        }

        .countdown-number {
          background: #ecfdf5;
          color: #10b981;
          border: 1px solid #bbf7d0;
        }

        .news-item:hover,
        .news-item:first-child {
          border-color: rgba(16, 185, 129, 0.24);
          background: #f0fdf4;
          box-shadow: 0 14px 28px rgba(6, 95, 70, 0.08);
        }

        .tag-line span {
          background: #d1fae5;
          color: #047857;
        }

        .compact-news-list::-webkit-scrollbar-track {
          background: #ecfdf5;
        }

        .compact-news-list::-webkit-scrollbar-thumb {
          background: #34d399;
        }

        .lesson-card-item.green .lesson-progress-fill,
        .lesson-card-item.teal .lesson-progress-fill,
        .class-card-item.green .btn,
        .class-card-item.teal .btn,
        .class-card-item.purple .btn,
        .subject-card-modern-home.green .subject-progress-fill-home,
        .subject-card-modern-home.teal .subject-progress-fill-home,
        .subject-card-modern-home.purple .subject-progress-fill-home {
          background: #10b981;
        }

        .subject-card-modern-home.orange .subject-progress-fill-home {
          background: #fbbf24;
        }

        .subject-card-modern-home.sky .subject-progress-fill-home {
          background: #06b6d4;
        }

        .ai-floating-btn {
          background: #34d399;
          box-shadow: 0 18px 42px rgba(16, 185, 129, 0.28);
        }

        .ai-chat-head {
          background: linear-gradient(135deg, #10b981, #06b6d4);
        }

        .ai-chat-body .ai-user-message {
          background: #ecfdf5;
          border-color: #a7f3d0;
          color: #047857;
        }

        .ai-chat-input button {
          background: linear-gradient(135deg, #10b981, #34d399);
        }
      `}</style>
    </div>
  );
}

export default StudentDashboard;




