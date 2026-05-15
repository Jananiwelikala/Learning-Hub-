import { useCallback, useEffect, useMemo, useState } from "react";
import config from "./config";

const API = `${config.API_BASE_URL}/admin`;

const groups = [
  { id: "dashboard", label: "Dashboard", icon: "🏠", items: [{ id: "dashboard", label: "Overview" }] },
  { id: "users", label: "Users", icon: "👥", items: [{ id: "students", label: "Students" }, { id: "teachers", label: "Teachers" }, { id: "admins", label: "Admins" }] },
  { id: "content", label: "Learning Content", icon: "📚", items: [{ id: "streams", label: "Streams" }, { id: "subjects", label: "Subjects" }, { id: "lessons", label: "Lessons" }, { id: "videos", label: "Lesson Videos" }, { id: "notes", label: "Notes" }] },
  { id: "papers", label: "Past Papers", icon: "📝", items: [{ id: "pastPapers", label: "Papers" }, { id: "questions", label: "Questions" }] },
  { id: "posts", label: "Class Posts", icon: "📢", items: [{ id: "pendingPosts", label: "Pending Approvals" }, { id: "approvedPosts", label: "Approved Posts" }, { id: "rejectedPosts", label: "Rejected Posts" }, { id: "allPosts", label: "All Posts" }] },
  { id: "settings", label: "Admin Settings", icon: "⚙️", items: [{ id: "addAdmin", label: "Add Admin" }, { id: "account", label: "Account Management" }] },
];

const sectionTitles = {
  dashboard: "Dashboard Overview",
  students: "Manage Students",
  teachers: "Manage Teachers",
  admins: "Manage Admins",
  streams: "Manage Streams",
  subjects: "Manage Subjects",
  lessons: "Manage Lessons",
  videos: "Manage Lesson Videos",
  notes: "Manage Notes",
  pastPapers: "Manage Past Papers",
  questions: "Manage Past Paper Questions",
  pendingPosts: "Pending Class Post Approvals",
  approvedPosts: "Approved Class Posts",
  rejectedPosts: "Rejected Class Posts",
  allPosts: "All Class Posts",
  addAdmin: "Add New Admin",
  account: "Admin Account Management",
};

const emptyForms = {
  stream: { name: "", sinhalaName: "", description: "", code: "", icon: "📘", color: "#14b8a6", order: 0 },
  subject: { name: "", sinhalaName: "", streamId: "", code: "", icon: "📗", color: "#0ea5e9", papersCount: 0, studentsCount: 0, order: 0 },
  lesson: { title: "", sinhalaTitle: "", description: "", subjectId: "", order: 0, durationMinutes: 0, videoTitle: "", videoLink: "", notesUrl: "", pastPaperMcqUrl: "", pastPaperStructuredUrl: "", pastPaperEssayUrl: "" },
  video: { title: "", url: "", description: "", duration: "", lessonId: "" },
  note: { title: "", description: "", fileUrl: "", pages: 0, fileSize: "", lessonId: "", subjectId: "", order: 0 },
  pastPaper: { title: "", paperType: "mcq", examYear: new Date().getFullYear(), fileUrl: "", section: "", questionsCount: 0, durationMinutes: 0, difficulty: "Medium", subjectId: "", lessonId: "" },
  question: { questionType: "mcq", lessonId: "", prompt: "", options: "", correctOptionIndex: 0, explanation: "", maxMarks: 1, examYear: new Date().getFullYear(), sourceLabel: "A/L Past Paper" },
  user: { title: "", name: "", email: "", password: "", phone: "", role: "student", stream: "", subject: "" },
};

async function request(path, options = {}, token = "") {
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || "Request failed");
  return data;
}

function idOf(item) {
  return item?._id || item?.id;
}

function relationName(item, key) {
  const value = item?.[key];
  if (!value) return "-";
  if (typeof value === "object") return value.name || value.title || value.email || "-";
  return value;
}

function toLessonId(value) {
  return value?.lesson?._id || value?.lesson || value?.lessonId || "";
}

function toSubjectId(value) {
  return value?.subject?._id || value?.subject || value?.subjectId || "";
}

function asArray(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function hasText(value) {
  return String(value || "").trim().length > 0;
}

function resourceText(value) {
  if (!value) return "";
  if (typeof value === "object") {
    return String(value.url || value.videoUrl || value.link || value.src || value.href || value.fileUrl || value.path || value.notesUrl || "").trim();
  }
  return String(value).trim();
}

function countLessonVideos(lesson) {
  const urls = new Set();
  const add = (value) => {
    const text = resourceText(value);
    if (hasText(text)) urls.add(text);
  };

  add(lesson.videoLink);
  add(lesson.videoUrl);
  asArray(lesson.videoLinks).forEach(add);
  asArray(lesson.videoUrls).forEach(add);
  asArray(lesson.videos).forEach((video) => {
    if (typeof video === "string") add(video);
    else add(video?.url || video?.videoUrl || video?.link || video?.src || video?.href);
  });

  return urls.size || lesson.videoCount || 0;
}

function countLessonNotes(lesson) {
  const urls = new Set();
  const add = (value) => {
    const text = resourceText(value);
    if (hasText(text)) urls.add(text);
  };

  add(lesson.notesUrl);
  asArray(lesson.notes).forEach((note) => {
    if (typeof note === "string") add(note);
    else add(note?.fileUrl || note?.url || note?.path || note?.notesUrl || note?.href);
  });

  return urls.size || lesson.notesCount || 0;
}

function AdminField({ label, name, form, onChangeValue, type = "text", textarea = false, required = false }) {
  const value = form[name] ?? "";

  return (
    <label className="admin-field">
      <span>{label}</span>
      {textarea ? (
        <textarea
          value={value}
          onChange={(event) => onChangeValue(name, event.target.value)}
          required={required}
        />
      ) : (
        <input
          type={type}
          value={type === "color" ? value || "#14b8a6" : value}
          onChange={(event) => onChangeValue(name, event.target.value)}
          required={required}
        />
      )}
    </label>
  );
}

function AdminSelectField({ label, name, form, onChangeValue, options = [], required = false }) {
  return (
    <label className="admin-field">
      <span>{label}</span>
      <select
        value={form[name] ?? ""}
        onChange={(event) => onChangeValue(name, event.target.value)}
        required={required}
      >
        <option value="">Select</option>
        {options.map(([value, labelText]) => (
          <option value={value} key={`${name}-${value}`}>{labelText}</option>
        ))}
      </select>
    </label>
  );
}

function AdminPanel({ adminName = "Admin", token = "", onLogout }) {
  const [active, setActive] = useState("dashboard");
  const [openGroups, setOpenGroups] = useState({ users: true, content: true, papers: true, posts: true });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [dashboard, setDashboard] = useState({});
  const [streams, setStreams] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [videos, setVideos] = useState([]);
  const [notes, setNotes] = useState([]);
  const [pastPapers, setPastPapers] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [posts, setPosts] = useState([]);
  const [users, setUsers] = useState([]);
  const [modal, setModal] = useState({ open: false, type: "", mode: "add", item: null });
  const [form, setForm] = useState({});

  const loadAll = useCallback(async (options = {}) => {
    if (!options.silent) {
      setLoading(true);
      setMessage("");
    }
    try {
      if (!token) throw new Error("Admin session expired. Please login again.");
      const [dash, streamData, subjectData, lessonData, videoData, noteData, paperData, questionData, postData, userData] = await Promise.all([
        request("/dashboard", {}, token),
        request("/streams", {}, token),
        request("/subjects", {}, token),
        request("/lessons", {}, token),
        request("/videos", {}, token),
        request("/notes", {}, token),
        request("/past-papers", {}, token),
        request("/questions", {}, token),
        request("/class-posts", {}, token),
        request("/users", {}, token),
      ]);
      setDashboard(dash);
      setStreams(streamData);
      setSubjects(subjectData);
      setLessons(lessonData);
      setVideos(videoData);
      setNotes(noteData);
      setPastPapers(paperData);
      setQuestions(questionData);
      setPosts(postData);
      setUsers(userData);
    } catch (err) {
      if (!options.silent) {
        setMessage(err.message);
      }
    } finally {
      if (!options.silent) {
        setLoading(false);
      }
    }
  }, [token]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  useEffect(() => {
    const refreshAdminData = () => loadAll({ silent: true });
    const intervalId = window.setInterval(refreshAdminData, 15000);

    window.addEventListener("focus", refreshAdminData);
    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", refreshAdminData);
    };
  }, [loadAll]);

  const filtered = useCallback((items) => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => JSON.stringify(item).toLowerCase().includes(q));
  }, [search]);

  const currentRows = useMemo(() => {
    if (active === "students") return filtered(users.filter((u) => u.role === "student"));
    if (active === "teachers") return filtered(users.filter((u) => u.role === "teacher"));
    if (active === "admins" || active === "account") return filtered(users.filter((u) => u.role === "admin"));
    if (active === "streams") return filtered(streams);
    if (active === "subjects") return filtered(subjects);
    if (active === "lessons") return filtered(lessons);
    if (active === "videos") return filtered(videos);
    if (active === "notes") return filtered(notes);
    if (active === "pastPapers") return filtered(pastPapers);
    if (active === "questions") return filtered(questions);
    if (active === "pendingPosts") return filtered(posts.filter((p) => p.status === "pending"));
    if (active === "approvedPosts") return filtered(posts.filter((p) => p.status === "approved"));
    if (active === "rejectedPosts") return filtered(posts.filter((p) => p.status === "rejected"));
    if (active === "allPosts") return filtered(posts);
    return [];
  }, [active, users, streams, subjects, lessons, videos, notes, pastPapers, questions, posts, filtered]);

  function toggleGroup(id) {
    setOpenGroups((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function openModal(type, mode = "add", item = null, defaults = {}) {
    const base = { ...(emptyForms[type] || {}), ...defaults };
    const mapped = item ? mapItemToForm(type, item) : base;
    setForm(mapped);
    setModal({ open: true, type, mode, item });
  }

  function closeModal() {
    setModal({ open: false, type: "", mode: "add", item: null });
    setForm({});
  }

  function change(name, value) {
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function mapItemToForm(type, item) {
    if (type === "stream") return { ...emptyForms.stream, ...item };
    if (type === "subject") return { ...emptyForms.subject, ...item, streamId: item.stream?._id || item.stream || "" };
    if (type === "lesson") return { ...emptyForms.lesson, ...item, subjectId: toSubjectId(item), videoLink: item.videoLink || item.videoUrl || "" };
    if (type === "video") return { ...emptyForms.video, ...item, lessonId: item.lessonId || "" };
    if (type === "note") return { ...emptyForms.note, ...item, lessonId: toLessonId(item), subjectId: toSubjectId(item) };
    if (type === "pastPaper") return { ...emptyForms.pastPaper, ...item, lessonId: toLessonId(item), subjectId: toSubjectId(item) };
    if (type === "question") return { ...emptyForms.question, ...item, lessonId: toLessonId(item), prompt: item.prompt || item.questionText || item.question || "", options: Array.isArray(item.options) ? item.options.join("\n") : item.options || "" };
    if (type === "user") return { ...emptyForms.user, ...item, password: "" };
    return item || {};
  }

  async function saveForm(e) {
    if (modal.type === "post" && modal.mode === "view") return; // Post view mode doesn't use form submission
    e.preventDefault();
    const type = modal.type;
    const mode = modal.mode;
    const itemId = idOf(modal.item);
    const endpoints = {
      stream: "/streams",
      subject: "/subjects",
      lesson: "/lessons",
      video: "/videos",
      note: "/notes",
      pastPaper: "/past-papers",
      question: "/questions",
      user: "/users",
    };
    const endpoint = endpoints[type];
    const body = { ...form };
    if (type === "question" && body.questionType !== "mcq") body.correctOptionIndex = 0;
    try {
      await request(mode === "edit" ? `${endpoint}/${encodeURIComponent(itemId)}` : endpoint, {
        method: mode === "edit" ? "PUT" : "POST",
        body: JSON.stringify(body),
      }, token);
      setMessage(`${mode === "edit" ? "Updated" : "Added"} successfully.`);
      closeModal();
      await loadAll();
    } catch (err) {
      setMessage(err.message);
    }
  }

  async function removeItem(type, item) {
    if (!window.confirm("Are you sure you want to delete this item?")) return;
    const endpoint = {
      stream: "/streams",
      subject: "/subjects",
      lesson: "/lessons",
      video: "/videos",
      note: "/notes",
      pastPaper: "/past-papers",
      question: "/questions",
      user: "/users",
      post: "/class-posts",
    }[type];
    try {
      await request(`${endpoint}/${encodeURIComponent(idOf(item))}`, { method: "DELETE" }, token);
      setMessage("Deleted successfully.");
      await loadAll();
    } catch (err) {
      setMessage(err.message);
    }
  }

  async function reviewPost(post, status) {
    const rejectionReason = status === "rejected" ? window.prompt("Reason for rejection", "Please update the class post details.") || "" : "";
    try {
      await request(`/class-posts/${idOf(post)}/review`, { method: "PUT", body: JSON.stringify({ status, rejectionReason }) }, token);
      setMessage(`Class post ${status}.`);
      await loadAll();
    } catch (err) {
      setMessage(err.message);
    }
  }

  function addButton() {
    if (active === "streams") return <button className="admin-primary" onClick={() => openModal("stream")}>+ Add Stream</button>;
    if (active === "subjects") return <button className="admin-primary" onClick={() => openModal("subject")}>+ Add Subject</button>;
    if (active === "lessons") return <button className="admin-primary" onClick={() => openModal("lesson")}>+ Add Lesson</button>;
    if (active === "videos") return <button className="admin-primary" onClick={() => openModal("video")}>+ Add Video</button>;
    if (active === "notes") return <button className="admin-primary" onClick={() => openModal("note")}>+ Add Note</button>;
    if (active === "pastPapers") return <button className="admin-primary" onClick={() => openModal("pastPaper")}>+ Add Paper</button>;
    if (active === "questions") return <button className="admin-primary" onClick={() => openModal("question")}>+ Add Question</button>;
    if (["students", "teachers", "admins", "account"].includes(active)) return <button className="admin-primary" onClick={() => openModal("user", "add", null, { role: active === "teachers" ? "teacher" : active === "students" ? "student" : "admin" })}>+ Add {active === "teachers" ? "Teacher" : active === "students" ? "Student" : "Admin"}</button>;
    return null;
  }

  function renderDashboard() {
    const cards = [
      ["Students", dashboard.students, "👩‍🎓"], ["Teachers", dashboard.teachers, "👨‍🏫"], ["Admins", dashboard.admins, "🛡️"],
      ["Streams", dashboard.streams, "🌊"], ["Subjects", dashboard.subjects, "📘"], ["Lessons", dashboard.lessons, "🎬"],
      ["Videos", dashboard.videos, "▶️"], ["Notes", dashboard.notes, "📄"], ["Questions", dashboard.questions, "❓"], ["Pending Posts", dashboard.pendingPosts, "⏳"],
    ];
    return <>
      <div className="admin-hero-card">
        <div>
          <span className="admin-pill">Learning Hub Admin</span>
          <h2>Good day, {adminName}</h2>
          <p>Manage students, teachers, streams, lessons, notes, past papers, class post approvals, and admin accounts from one clean dashboard.</p>
        </div>
        <button className="admin-primary" onClick={() => openModal("lesson")}>Add new lesson</button>
      </div>
      <div className="admin-stat-grid">{cards.map(([label, value, icon]) => <button className="admin-stat-card" key={label} onClick={() => setActive(label === "Pending Posts" ? "pendingPosts" : label.toLowerCase())}><span>{icon}</span><p>{label}</p><strong>{value ?? 0}</strong></button>)}</div>
      <div className="admin-two-grid">
        <div className="admin-panel-card"><h3>Pending approvals</h3>{posts.filter(p => p.status === "pending").slice(0, 5).map(p => <div className="admin-mini-row" key={idOf(p)}><span>{p.title}</span><button onClick={() => reviewPost(p, "approved")}>Approve</button></div>)}{posts.filter(p => p.status === "pending").length === 0 && <p className="admin-muted">No pending class posts.</p>}</div>
        <div className="admin-panel-card"><h3>Recently added lessons</h3>{lessons.slice(0, 5).map(l => <div className="admin-mini-row" key={idOf(l)}><span>{l.title}</span><small>{relationName(l, "subject")}</small></div>)}</div>
      </div>
    </>;
  }

  function renderTable() {
    if (active === "dashboard") return renderDashboard();
    if (active === "addAdmin") return <div className="admin-panel-card"><h3>Create another admin account</h3><p className="admin-muted">Admin accounts are stored in MongoDB and can login to this admin dashboard.</p><button className="admin-primary" onClick={() => openModal("user", "add", null, { role: "admin" })}>+ Add Admin</button></div>;

    return <div className="admin-panel-card">
      <div className="admin-list-head"><div><h3>{sectionTitles[active]}</h3><p>Changes are saved to MongoDB and used by the student, teacher, and landing pages.</p></div>{addButton()}</div>
      <div className="admin-search-row"><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search this section..."/><button onClick={loadAll}>Refresh</button></div>
      <div className="admin-table-wrap"><table className="admin-data-table"><thead>{renderHeaders()}</thead><tbody>{currentRows.map(renderRow)}{currentRows.length === 0 && <tr><td colSpan="8" className="admin-empty">No records found.</td></tr>}</tbody></table></div>
    </div>;
  }

  function renderHeaders() {
    if (["students", "teachers", "admins", "account"].includes(active)) return <tr><th>Name</th><th>Email</th><th>Role</th><th>Phone</th><th>Actions</th></tr>;
    if (active === "streams") return <tr><th>Stream</th><th>Sinhala</th><th>Description</th><th>Actions</th></tr>;
    if (active === "subjects") return <tr><th>Subject</th><th>Stream</th><th>Code</th><th>Actions</th></tr>;
    if (active === "lessons") return <tr><th>Lesson</th><th>Subject</th><th>Video</th><th>Notes</th><th>Actions</th></tr>;
    if (active === "videos") return <tr><th>Video</th><th>Lesson</th><th>URL</th><th>Actions</th></tr>;
    if (active === "notes") return <tr><th>Note</th><th>Lesson</th><th>File</th><th>Actions</th></tr>;
    if (active === "pastPapers") return <tr><th>Paper</th><th>Type</th><th>Year</th><th>Subject</th><th>Actions</th></tr>;
    if (active === "questions") return <tr><th>Question</th><th>Type</th><th>Year</th><th>Lesson</th><th>Actions</th></tr>;
    return <tr><th>Image</th><th>Title</th><th>Teacher</th><th>Subject</th><th>Status</th><th>Schedule</th><th>Actions</th></tr>;
  }

  function renderRow(item) {
    const key = idOf(item);
    const actions = (type) => <div className="admin-actions"><button onClick={() => openModal(type, "edit", item)}>Edit</button><button className="danger" onClick={() => removeItem(type, item)}>Delete</button></div>;
    if (["students", "teachers", "admins", "account"].includes(active)) return <tr key={key}><td>{item.name}</td><td>{item.email}</td><td><span className="admin-badge">{item.role}</span></td><td>{item.phone || "-"}</td><td>{actions("user")}</td></tr>;
    if (active === "streams") return <tr key={key}><td>{item.name}</td><td>{item.sinhalaName || "-"}</td><td>{item.description || "-"}</td><td>{actions("stream")}</td></tr>;
    if (active === "subjects") return <tr key={key}><td>{item.name}</td><td>{relationName(item, "stream")}</td><td>{item.code || "-"}</td><td>{actions("subject")}</td></tr>;
    if (active === "lessons") return <tr key={key}><td>{item.title}</td><td>{relationName(item, "subject")}</td><td>{countLessonVideos(item)}</td><td>{countLessonNotes(item)}</td><td>{actions("lesson")}</td></tr>;
    if (active === "videos") return <tr key={key}><td>{item.title}</td><td>{item.lessonTitle}</td><td className="admin-url-cell">{item.url || "-"}</td><td>{actions("video")}</td></tr>;
    if (active === "notes") return <tr key={key}><td>{item.title}</td><td>{relationName(item, "lesson")}</td><td className="admin-url-cell">{item.fileUrl || "-"}</td><td>{actions("note")}</td></tr>;
    if (active === "pastPapers") return <tr key={key}><td>{item.title}</td><td>{item.paperType}</td><td>{item.examYear}</td><td>{relationName(item, "subject")}</td><td>{actions("pastPaper")}</td></tr>;
    if (active === "questions") return <tr key={key}><td>{String(item.prompt || "").slice(0, 80)}</td><td>{item.questionType}</td><td>{item.examYear}</td><td>{relationName(item, "lesson")}</td><td>{actions("question")}</td></tr>;
    return <tr key={key}><td>{item.image ? <img src={item.image} alt={item.title} style={{width: '60px', height: '40px', objectFit: 'cover', borderRadius: '4px'}} /> : <span style={{color: '#999'}}>No image</span>}</td><td><button className="admin-link-button" onClick={() => openModal("post", "view", item)}>{item.title}</button></td><td>{relationName(item, "teacher")}</td><td>{item.subject}</td><td><span className={`admin-status ${item.status}`}>{item.status}</span></td><td>{item.schedule || "-"}</td><td><div className="admin-actions">{item.status === "pending" && <><button onClick={() => reviewPost(item, "approved")}>Approve</button><button onClick={() => reviewPost(item, "rejected")}>Reject</button></>}<button className="danger" onClick={() => removeItem("post", item)}>Delete</button></div></td></tr>;
  }

  function renderModalFields() {
    const type = modal.type;
    const fieldProps = { form, onChangeValue: change };
    if (type === "stream") return <><AdminField {...fieldProps} label="Stream name" name="name" required/><AdminField {...fieldProps} label="Sinhala name" name="sinhalaName"/><AdminField {...fieldProps} label="Description" name="description" textarea/><AdminField {...fieldProps} label="Code" name="code"/><AdminField {...fieldProps} label="Icon" name="icon"/><AdminField {...fieldProps} label="Color" name="color" type="color"/><AdminField {...fieldProps} label="Order" name="order" type="number"/></>;
    if (type === "subject") return <><AdminField {...fieldProps} label="Subject name" name="name" required/><AdminField {...fieldProps} label="Sinhala name" name="sinhalaName"/><AdminSelectField {...fieldProps} label="Stream" name="streamId" required options={streams.map(s => [idOf(s), s.name])}/><AdminField {...fieldProps} label="Code" name="code"/><AdminField {...fieldProps} label="Icon" name="icon"/><AdminField {...fieldProps} label="Color" name="color" type="color"/><AdminField {...fieldProps} label="Order" name="order" type="number"/></>;
    if (type === "lesson") return <><AdminField {...fieldProps} label="Lesson title" name="title" required/><AdminField {...fieldProps} label="Sinhala title" name="sinhalaTitle"/><AdminSelectField {...fieldProps} label="Subject" name="subjectId" required options={subjects.map(s => [idOf(s), `${s.name} (${relationName(s, "stream")})`])}/><AdminField {...fieldProps} label="Description" name="description" textarea/><AdminField {...fieldProps} label="Main video title" name="videoTitle"/><AdminField {...fieldProps} label="Main video URL" name="videoLink"/><AdminField {...fieldProps} label="Notes URL" name="notesUrl"/><AdminField {...fieldProps} label="MCQ paper URL" name="pastPaperMcqUrl"/><AdminField {...fieldProps} label="Structured paper URL" name="pastPaperStructuredUrl"/><AdminField {...fieldProps} label="Essay paper URL" name="pastPaperEssayUrl"/><AdminField {...fieldProps} label="Duration minutes" name="durationMinutes" type="number"/><AdminField {...fieldProps} label="Order" name="order" type="number"/></>;
    if (type === "video") return <><AdminSelectField {...fieldProps} label="Lesson" name="lessonId" required options={lessons.map(l => [idOf(l), l.title])}/><AdminField {...fieldProps} label="Video title" name="title" required/><AdminField {...fieldProps} label="Video URL" name="url" required/><AdminField {...fieldProps} label="Duration" name="duration"/><AdminField {...fieldProps} label="Description" name="description" textarea/></>;
    if (type === "note") return <><AdminSelectField {...fieldProps} label="Lesson" name="lessonId" required options={lessons.map(l => [idOf(l), l.title])}/><AdminSelectField {...fieldProps} label="Subject" name="subjectId" options={subjects.map(s => [idOf(s), s.name])}/><AdminField {...fieldProps} label="Note title" name="title" required/><AdminField {...fieldProps} label="File URL" name="fileUrl"/><AdminField {...fieldProps} label="Description" name="description" textarea/><AdminField {...fieldProps} label="Pages" name="pages" type="number"/><AdminField {...fieldProps} label="File size" name="fileSize"/><AdminField {...fieldProps} label="Order" name="order" type="number"/></>;
    if (type === "pastPaper") return <><AdminField {...fieldProps} label="Paper title" name="title" required/><AdminSelectField {...fieldProps} label="Subject" name="subjectId" required options={subjects.map(s => [idOf(s), s.name])}/><AdminSelectField {...fieldProps} label="Lesson" name="lessonId" options={[["", "No lesson"], ...lessons.map(l => [idOf(l), l.title])]}/><AdminSelectField {...fieldProps} label="Paper type" name="paperType" options={[["mcq", "MCQ"], ["structured", "Structured"], ["essay", "Essay"], ["full", "Full paper"]]}/><AdminField {...fieldProps} label="Exam year" name="examYear" type="number"/><AdminField {...fieldProps} label="File URL" name="fileUrl"/><AdminField {...fieldProps} label="Section" name="section"/><AdminField {...fieldProps} label="Questions count" name="questionsCount" type="number"/><AdminField {...fieldProps} label="Duration minutes" name="durationMinutes" type="number"/><AdminSelectField {...fieldProps} label="Difficulty" name="difficulty" options={[["Easy", "Easy"], ["Medium", "Medium"], ["Hard", "Hard"]]}/></>;
    if (type === "question") return <><AdminSelectField {...fieldProps} label="Question type" name="questionType" options={[["mcq", "MCQ"], ["structured", "Structured"], ["essay", "Essay"]]}/><AdminSelectField {...fieldProps} label="Lesson" name="lessonId" required options={lessons.map(l => [idOf(l), l.title])}/><AdminField {...fieldProps} label="Question" name="prompt" required textarea/><AdminField {...fieldProps} label="Options (one per line for MCQ)" name="options" textarea/><AdminField {...fieldProps} label="Correct option index (0=A, 1=B, 2=C)" name="correctOptionIndex" type="number"/><AdminField {...fieldProps} label="Explanation" name="explanation" textarea/><AdminField {...fieldProps} label="Max marks" name="maxMarks" type="number"/><AdminField {...fieldProps} label="Exam year" name="examYear" type="number"/><AdminField {...fieldProps} label="Source label" name="sourceLabel"/></>;
    if (type === "user") return <><AdminSelectField {...fieldProps} label="Title" name="title" options={[["", "No title"], ["Mr.", "Mr."], ["Mrs.", "Mrs."], ["Miss", "Miss"]]}/><AdminField {...fieldProps} label="Name" name="name" required/><AdminField {...fieldProps} label="Email" name="email" type="email" required/><AdminField {...fieldProps} label={modal.mode === "edit" ? "New password (optional)" : "Password"} name="password" type="password" required={modal.mode !== "edit"}/><AdminField {...fieldProps} label="Phone" name="phone"/><AdminSelectField {...fieldProps} label="Role" name="role" options={[["student", "Student"], ["teacher", "Teacher"], ["admin", "Admin"]]}/><AdminField {...fieldProps} label="Stream" name="stream"/><AdminField {...fieldProps} label="Subject" name="subject"/></>;
    if (type === "post") return modal.mode === "view" ? <div className="admin-post-view">
      <div className="admin-post-header">
        {modal.item?.image && <img src={modal.item.image} alt={modal.item.title} className="admin-post-image" />}
        <div>
          <h3>{modal.item?.title}</h3>
          <p className="admin-post-meta">By {relationName(modal.item, "teacher")} • {modal.item?.subject} • {modal.item?.grade}</p>
          <span className={`admin-status ${modal.item?.status}`}>{modal.item?.status}</span>
        </div>
      </div>
      <div className="admin-post-details">
        <div className="admin-post-field"><strong>Description:</strong><p>{modal.item?.description}</p></div>
        <div className="admin-post-field"><strong>Location:</strong><p>{modal.item?.location}</p></div>
        <div className="admin-post-field"><strong>Schedule:</strong><p>{modal.item?.schedule}</p></div>
        <div className="admin-post-field"><strong>Duration:</strong><p>{modal.item?.duration}</p></div>
        <div className="admin-post-field"><strong>Fee:</strong><p>Rs. {modal.item?.fee}</p></div>
        <div className="admin-post-field"><strong>Contact Info:</strong><p>{modal.item?.contactInfo}</p></div>
        {modal.item?.rejectionReason && <div className="admin-post-field"><strong>Rejection Reason:</strong><p>{modal.item?.rejectionReason}</p></div>}
      </div>
    </div> : null;
    return null;
  }

  return <div className="admin-shell-v2">
    <aside className={`admin-sidebar-v2 ${mobileOpen ? "open" : ""}`}>
      <div className="admin-brand-v2">
        <div className="brand-logo-shell admin-brand-logo">
          <img src="/logo1.png" alt="Learning Hub logo" className="brand-logo-image" />
        </div>
        <div className="admin-brand-text">
          <strong>Learning Hub</strong>
          <span>Admin Console</span>
        </div>
      </div>
      <nav className="admin-nav-v2">{groups.map(group => <div key={group.id} className="admin-nav-group"><button className="admin-nav-parent" onClick={() => group.items.length === 1 ? setActive(group.items[0].id) : toggleGroup(group.id)}><span>{group.icon}</span><b>{group.label}</b><em>{openGroups[group.id] || group.items.length === 1 ? "⌃" : "⌄"}</em></button>{(openGroups[group.id] || group.items.length === 1) && <div className="admin-nav-children">{group.items.map(item => <button key={item.id} className={active === item.id ? "active" : ""} onClick={() => { setActive(item.id); setMobileOpen(false); setSearch(""); }}>{item.label}</button>)}</div>}</div>)}</nav>
      <div className="admin-profile-box"><div className="admin-avatar">{adminName?.charAt(0)?.toUpperCase() || "A"}</div><div><strong>{adminName}</strong><span>Administrator</span></div><button onClick={onLogout}>Logout</button></div>
    </aside>

    <main className="admin-main-v2">
      <div className="admin-top-v2"><button className="admin-menu-toggle" onClick={() => setMobileOpen(true)}>☰</button><div><p>Admin Workspace</p><h1>{sectionTitles[active]}</h1></div><button className="admin-refresh" onClick={loadAll}>{loading ? "Loading..." : "Refresh"}</button></div>
      {message && <div className="admin-message">{message}</div>}
      {renderTable()}
    </main>

    {modal.open && <div className="admin-modal-backdrop">{modal.type === "post" && modal.mode === "view" ? <div className="admin-modal-card"><div className="admin-modal-head"><div><p>View</p><h2>Class Post</h2></div><button type="button" onClick={closeModal}>×</button></div><div className="admin-form-grid">{renderModalFields()}</div><div className="admin-modal-actions">{modal.item?.status === "pending" && <><button className="admin-primary" onClick={() => { reviewPost(modal.item, "approved"); closeModal(); }}>Approve</button><button className="danger" onClick={() => { reviewPost(modal.item, "rejected"); closeModal(); }}>Reject</button></>}<button onClick={() => removeItem("post", modal.item)}>Delete</button></div></div> : <form className="admin-modal-card" onSubmit={saveForm}><div className="admin-modal-head"><div><p>{modal.mode === "edit" ? "Edit" : "Create"}</p><h2>{modal.type}</h2></div><button type="button" onClick={closeModal}>×</button></div><div className="admin-form-grid">{renderModalFields()}</div><div className="admin-modal-actions"><button type="button" onClick={closeModal}>Cancel</button><button className="admin-primary" type="submit">{modal.mode === "edit" ? "Update" : "Save"}</button></div></form>}</div>}
  </div>;
}

export default AdminPanel;
