# Student Learning Flow - Quick Reference

## 🚀 Quick Start

### For Students

1. **Login** to Learning Hub with student account
2. **Click "View Subjects"** from home or dashboard
3. **Select a stream** (Biology, Maths, Commerce, etc.)
4. **Click "View Lessons"** on any subject
5. **Select a lesson** to start learning
6. **Watch video**, download notes, or practice questions
7. **Submit answers** and get instant feedback

### For Developers

#### Installation
```bash
cd Learning Hub
cd Backend && npm install
cd ../frontend && npm install
```

#### File Structure
```
Learning Hub/
├── Backend/
│   ├── routes/
│   │   ├── lessonRotes.js          (✨ Updated with new endpoints)
│   │   └── assessmentRoutes.js     (✨ Updated with MCQ submit)
│   └── models/
│       ├── Lesson.js
│       └── AssessmentQuestion.js
├── frontend/
│   ├── src/
│   │   ├── SubjectDetail.js        (✨ New)
│   │   ├── LessonDetail.js         (✨ New)
│   │   ├── components/
│   │   │   ├── MCQPractice.js      (✨ New)
│   │   │   └── StructuredQuestion.js (✨ New)
│   │   ├── styles/
│   │   │   ├── SubjectDetail.css   (✨ New)
│   │   │   ├── LessonDetail.css    (✨ New)
│   │   │   ├── MCQPractice.css     (✨ New)
│   │   │   └── StructuredQuestion.css (✨ New)
│   │   ├── api.js                  (✨ Updated with new functions)
│   │   └── App.js                  (✨ Updated with routing)
│   └── README.md
├── LEARNING_FLOW_IMPLEMENTATION.md (✨ New - Full documentation)
└── README.md
```

## 🔌 New API Functions (api.js)

```javascript
// Load all lessons for a subject
getSubjectLessons(token, subjectId)
// Returns: { success: boolean, lessons: Array }

// Get full lesson details with all resources
getLessonFull(token, lessonId)
// Returns: { success: boolean, lesson: Object }

// Get questions for lesson (optional type filter)
getQuestionsForLesson(token, lessonId, questionType)
// Returns: { success: boolean, questions: Array }

// Submit MCQ answer (gets instant evaluation)
submitMCQAnswer(token, lessonId, questionId, selectedOptionIndex)
// Returns: { success: boolean, result: { isCorrect, earnedMarks, ... } }

// Submit structured/essay answers
submitStructuredAnswer(token, lessonId, submissions)
// Returns: { success: boolean, attemptId: String }
```

## 🔗 New Backend Endpoints

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | `/api/lessons/by-subject/:subjectId` | ✅ | Get lessons for subject |
| GET | `/api/lessons/:lessonId/full` | ✅ | Get full lesson details |
| GET | `/api/assessments/questions?lessonId=xxx` | ✅ | Get questions for lesson |
| POST | `/api/assessments/mcq/submit` | ✅ | Submit MCQ answer |
| POST | `/api/assessments/submit-descriptive` | ✅ | Submit structured/essay |

## 🧩 Component Integration

### Adding to App.js
```javascript
import SubjectDetail from "./SubjectDetail";
import LessonDetail from "./LessonDetail";

// In App function component:
const [selectedSubject, setSelectedSubject] = useState(null);
const [selectedLesson, setSelectedLesson] = useState(null);

// In JSX rendering:
{screen === "subject-detail" && token && (
  <SubjectDetail
    token={token}
    subjectId={selectedSubject.id}
    subjectName={selectedSubject.name}
    streamName={selectedSubject.streamName}
    onBack={() => {
      setSelectedSubject(null);
      setScreen("subjects");
    }}
    onSelectLesson={(lesson) => {
      setSelectedLesson(lesson);
      setScreen("lesson-detail");
    }}
  />
)}

{screen === "lesson-detail" && token && (
  <LessonDetail
    token={token}
    lessonId={selectedLesson._id}
    subjectName={selectedSubject.name}
    onBack={() => {
      setSelectedLesson(null);
      setScreen("subject-detail");
    }}
  />
)}
```

### Customizing Components

**Change MCQ Question Limit:**
```javascript
// In MCQPractice.js - add state
const [questionsPerPage] = useState(1); // 1 question at a time
const currentQuestion = questions[currentQuestionIndex];
```

**Add Custom Styling:**
```javascript
// Create custom CSS file
.my-lesson-detail {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

// Import and use
<div className="my-lesson-detail">
  <LessonDetail {...props} />
</div>
```

**Add Analytics Tracking:**
```javascript
// In MCQPractice.js - on answer submit
async function handleSubmitAnswer() {
  // Track analytics
  analytics.track('mcq_answered', {
    questionId: currentQuestion._id,
    isCorrect: result.isCorrect,
    timeSpent: Date.now() - startTime
  });
  
  // ... rest of code
}
```

## 🎯 Common Tasks

### How to add a new question type?

1. **Update Backend Model** (`AssessmentQuestion.js`):
```javascript
questionType: {
  type: String,
  enum: ["mcq", "structured", "essay", "matching"], // Add new type
  required: true,
}
```

2. **Create Component** (`components/MatchingQuestion.js`):
```javascript
function MatchingQuestion({ questions, token, lessonId }) {
  // Implement matching logic
  return <div>{/* Component JSX */}</div>;
}
export default MatchingQuestion;
```

3. **Update LessonDetail.js**:
```javascript
import MatchingQuestion from './components/MatchingQuestion';

// Add to tab navigation
{questionsGrouped.matching.length > 0 && (
  <button
    className={`tab-btn ${activeTab === 'matching' ? 'active' : ''}`}
    onClick={() => setActiveTab('matching')}
  >
    🔗 Matching ({questionsGrouped.matching.length})
  </button>
)}

// Add to tab content
{activeTab === 'matching' && (
  <section className="tab-content">
    <MatchingQuestion
      questions={questionsGrouped.matching}
      token={token}
      lessonId={lessonId}
    />
  </section>
)}
```

### How to customize the video player?

Replace the iframe in `LessonDetail.js`:

```javascript
// Current: YouTube embed
{embedVideoUrl && (
  <iframe
    width="100%"
    height="600"
    src={embedVideoUrl}
    {...props}
  ></iframe>
)}

// Alternative: Vimeo
{embedVideoUrl && embedVideoUrl.includes('vimeo') && (
  <iframe
    src={embedVideoUrl}
    width="100%"
    height="600"
    frameBorder="0"
    allow="autoplay; fullscreen"
    allowFullScreen
  ></iframe>
)}

// Alternative: Custom video player
{embedVideoUrl && (
  <video width="100%" height="600" controls>
    <source src={embedVideoUrl} type="video/mp4" />
  </video>
)}
```

### How to add progress tracking?

```javascript
// In SubjectDetail.js, replace hardcoded progress:
const [progressPercentage, setProgressPercentage] = useState(0);

useEffect(() => {
  // Calculate from attempts
  const totalLessons = lessons.length;
  const completedLessons = lessons.filter(l => l.completed).length;
  setProgressPercentage(Math.round((completedLessons / totalLessons) * 100));
}, [lessons]);
```

### How to add peer comparison?

```javascript
// Add to MCQPractice.js
const [classStats, setClassStats] = useState({
  averageScore: 0,
  yourPercentile: 0
});

useEffect(() => {
  // Fetch from backend
  fetch(`${config.API_BASE_URL}/assessments/stats?questionId=${currentQuestion._id}`)
    .then(res => res.json())
    .then(data => setClassStats(data));
}, [currentQuestion]);

// Display in feedback
<div className="class-comparison">
  <p>Class Average: {classStats.averageScore}%</p>
  <p>Your Percentile: {classStats.yourPercentile}%</p>
</div>
```

## 🎨 Design System

### Color Palette
```css
Primary Blue: #3b82f6
Dark Blue: #1e40af
Light Blue: #eff6ff
Success Green: #10b981
Warning Yellow: #fbbf24
Error Red: #ef4444
```

### Typography
```css
Headings: 600-700 weight, -0.5px letter-spacing
Body: 14-16px, regular weight, 1.6 line-height
Labels: 12-13px, 600 weight, uppercase, 0.5px letter-spacing
```

### Spacing
```css
xs: 4px
sm: 8px
md: 12px
lg: 16px
xl: 24px
2xl: 32px
```

### Border Radius
```css
Small: 6px
Medium: 8px
Large: 12px
Extra Large: 16px
```

## 🚨 Troubleshooting

| Issue | Solution |
|-------|----------|
| Videos not embedding | Check URL format: `youtube.com/watch?v=xxx` or `youtu.be/xxx` |
| Questions not loading | Verify `lessonId` is valid, check API response |
| Answers not submitting | Check token is valid, verify request body format |
| Styles not applying | Clear browser cache, check import paths |
| API errors 401 | Re-login, check token expiration |
| API errors 404 | Verify resource IDs, check backend data |

## 📱 Testing on Different Devices

```bash
# Desktop
npm start

# Mobile Chrome DevTools
F12 → Device Emulation

# Tablet
Device Emulation → iPad

# Real Device
npm start
# Then visit: http://[your-ip]:3000
```

## 🔄 Update Flow

When updating components:

1. **Update** component file
2. **Run** `npm run build` to verify compilation
3. **Test** in browser (clear cache if needed)
4. **Check** responsive design on mobile
5. **Verify** API calls in Network tab
6. **Commit** changes with descriptive message

## 📊 Performance Tips

- **Lazy load** images using `loading="lazy"`
- **Debounce** API calls in search/filter
- **Memoize** expensive calculations with `useMemo`
- **Prevent** unnecessary re-renders with `React.memo`
- **Code split** large components dynamically
- **Minify** CSS and images

## 🔗 Useful Links

- **YouTube Embed API**: https://developers.google.com/youtube
- **React Hooks**: https://react.dev/reference/react/hooks
- **CSS Grid**: https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Grid_Layout
- **Accessibility**: https://www.w3.org/WAI/

---

**Quick Links**
- [Full Implementation Guide](./LEARNING_FLOW_IMPLEMENTATION.md)
- [Component Documentation](./frontend/src/)
- [Backend Routes](./Backend/routes/)
