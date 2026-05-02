import { useMemo, useState } from "react";

const initialStreams = [
  { id: 1, name: "Science", description: "Advanced coursework for Science stream." },
  { id: 2, name: "Commerce", description: "Business and economics learning path." },
  { id: 3, name: "Arts", description: "Creative and humanities streams." },
  { id: 4, name: "Technology", description: "Technology and applied science courses." },
];

const initialSubjects = [
  { id: 1, title: "Physics", stream: "Science" },
  { id: 2, title: "Chemistry", stream: "Science" },
  { id: 3, title: "Biology", stream: "Science" },
  { id: 4, title: "Combined Maths", stream: "Science" },
  { id: 5, title: "ICT", stream: "Science" },
  { id: 6, title: "Accounting", stream: "Commerce" },
  { id: 7, title: "Economics", stream: "Commerce" },
  { id: 8, title: "Business Studies", stream: "Commerce" },
  { id: 9, title: "ICT", stream: "Commerce" },
  { id: 10, title: "Sinhala", stream: "Arts" },
  { id: 11, title: "Political Science", stream: "Arts" },
  { id: 12, title: "History", stream: "Arts" },
  { id: 13, title: "Geography", stream: "Arts" },
  { id: 14, title: "Logic", stream: "Arts" },
  { id: 15, title: "Engineering Technology", stream: "Technology" },
  { id: 16, title: "Bio Systems Technology", stream: "Technology" },
  { id: 17, title: "Science for Technology", stream: "Technology" },
];

const initialLessons = [
  {
    id: 1,
    title: "Measurements",
    stream: "Science",
    subject: "Physics",
    chapter: 1,
    status: "Published",
    description: "Fundamentals of physical measurement and units.",
  },
  {
    id: 2,
    title: "Atomic Structure",
    stream: "Science",
    subject: "Chemistry",
    chapter: 2,
    status: "Draft",
    description: "Introduction to atoms, elements and molecules.",
  },
];

const initialVideos = [
  {
    id: 1,
    title: "Physics: Measurements Overview",
    url: "https://www.youtube.com/watch?v=MlQ4zM49xS0",
    lesson: "Measurements",
    subject: "Physics",
    description: "A quick review of measurement basics.",
    thumbnail: "https://img.youtube.com/vi/MlQ4zM49xS0/0.jpg",
  },
];

const initialNotes = [
  {
    id: 1,
    title: "Measurements Notes",
    stream: "Science",
    subject: "Physics",
    lesson: "Measurements",
    fileUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    description: "Lesson notes and reference materials for measurements.",
  },
];

const initialPosts = [
  {
    id: 1,
    teacher: "Mr. Nimal",
    subject: "Chemistry",
    title: "Extra Revision Class",
    type: "Online",
    district: "Colombo",
    contact: "+94 77 123 4567",
    status: "Pending",
  },
  {
    id: 2,
    teacher: "Ms. Roshini",
    subject: "Business Studies",
    title: "Weekend Exam Practice",
    type: "Physical",
    district: "Kandy",
    contact: "+94 71 987 6543",
    status: "Approved",
  },
];

const initialTeachers = [
  {
    id: 1,
    name: "Ms. Kavindi",
    email: "kavindi@gmail.com",
    subject: "Physics",
    approval: "Pending",
    status: "Active",
    phone: "+94 71 111 2222",
    institute: "Anura College",
  },
  {
    id: 2,
    name: "Mr. Sanjeewa",
    email: "sanjeewa@gmail.com",
    subject: "Accounting",
    approval: "Approved",
    status: "Blocked",
    phone: "+94 77 333 4444",
    institute: "City Institute",
  },
];

const initialStudents = [
  {
    id: 1,
    name: "Kasun Perera",
    email: "kasun@gmail.com",
    stream: "Science",
    year: "2026 A/L",
    status: "Active",
  },
  {
    id: 2,
    name: "Nadeesha Silva",
    email: "nadeesha@gmail.com",
    stream: "Commerce",
    year: "2026 A/L",
    status: "Active",
  },
];

const initialSettings = {
  platformName: "Learning Hub",
  examDate: "2026-11-01",
  latestNews: "A/L exam preparation resources updated weekly.",
  homepageBanner: "Sri Lankan A/L Learning Platform for confident students.",
  aiEnabled: true,
};

const menuItems = [
  { id: "dashboard", label: "Dashboard" },
  { id: "streams", label: "Streams" },
  { id: "subjects", label: "Subjects" },
  { id: "lessons", label: "Lessons" },
  { id: "videos", label: "Lesson Videos" },
  { id: "notes", label: "Notes / Materials" },
  { id: "posts", label: "Class Posts" },
  { id: "teacherApproval", label: "Teacher Approval" },
  { id: "users", label: "Users" },
  { id: "settings", label: "Settings" },
];

function AdminPanel({ adminName, onLogout }) {
  const [activeSection, setActiveSection] = useState("dashboard");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [streams, setStreams] = useState(initialStreams);
  const [subjects, setSubjects] = useState(initialSubjects);
  const [lessons, setLessons] = useState(initialLessons);
  const [videos, setVideos] = useState(initialVideos);
  const [notes, setNotes] = useState(initialNotes);
  const [posts, setPosts] = useState(initialPosts);
  const [teachers, setTeachers] = useState(initialTeachers);
  const [students, setStudents] = useState(initialStudents);
  const [settings, setSettings] = useState(initialSettings);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add");
  const [modalItem, setModalItem] = useState(null);
  const [formState, setFormState] = useState({});

  const counts = useMemo(() => ({
    totalStudents: students.length,
    totalTeachers: teachers.length,
    pendingTeacherApprovals: teachers.filter((item) => item.approval === "Pending").length,
    totalStreams: streams.length,
    totalSubjects: subjects.length,
    totalLessons: lessons.length,
    totalPosts: posts.length,
  }), [students, teachers, streams, subjects, lessons, posts]);

  const summaryCards = [
    { label: "Total Students", value: counts.totalStudents, color: "#2563eb" },
    { label: "Total Teachers", value: counts.totalTeachers, color: "#0ea5e9" },
    { label: "Pending Teacher Approvals", value: counts.pendingTeacherApprovals, color: "#f59e0b" },
    { label: "Total Streams", value: counts.totalStreams, color: "#22c55e" },
    { label: "Total Subjects", value: counts.totalSubjects, color: "#6366f1" },
    { label: "Total Lessons", value: counts.totalLessons, color: "#0f766e" },
    { label: "Total Class Posts", value: counts.totalPosts, color: "#f97316" },
  ];

  const sections = {
    dashboard: "Dashboard",
    streams: "Streams",
    subjects: "Subjects",
    lessons: "Lessons",
    videos: "Lesson Videos",
    notes: "Notes / Materials",
    posts: "Class Posts",
    teacherApproval: "Teacher Approval",
    users: "Users",
    settings: "Settings",
  };

  function openModal(mode, item = null) {
    setModalMode(mode);
    setModalItem(item);

    const defaultForm = {
      name: "",
      description: "",
      stream: "",
      subject: "",
      chapter: "",
      status: "Draft",
      title: "",
      url: "",
      thumbnail: "",
      fileUrl: "",
      type: "Online",
      district: "",
      contact: "",
      approval: "Pending",
      accountStatus: "Active",
      email: "",
      year: "2026 A/L",
      latestNews: settings.latestNews,
      platformName: settings.platformName,
      examDate: settings.examDate,
      homepageBanner: settings.homepageBanner,
      aiEnabled: settings.aiEnabled,
    };

    if (item) {
      setFormState(item);
    } else {
      setFormState(defaultForm);
    }

    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setModalItem(null);
    setFormState({});
  }

  function handleFormChange(key, value) {
    setFormState((prev) => ({ ...prev, [key]: value }));
  }

  function saveModal() {
    const nextId = Date.now();
    const activeData = getCurrentData();
    const updateState = getUpdateState();
    if (!updateState) return;

    const updatedItem = { ...modalItem, ...formState, id: modalItem?.id || nextId };

    if (modalMode === "edit") {
      updateState.set(activeData.map((item) => (item.id === updatedItem.id ? updatedItem : item)));
    } else {
      updateState.set([...activeData, updatedItem]);
    }

    closeModal();
  }

  function getCurrentData() {
    switch (activeSection) {
      case "streams":
        return streams;
      case "subjects":
        return subjects;
      case "lessons":
        return lessons;
      case "videos":
        return videos;
      case "notes":
        return notes;
      case "posts":
        return posts;
      case "teacherApproval":
        return teachers;
      case "users":
        return students.concat(teachers);
      default:
        return [];
    }
  }

  function getUpdateState() {
    switch (activeSection) {
      case "streams":
        return { set: setStreams };
      case "subjects":
        return { set: setSubjects };
      case "lessons":
        return { set: setLessons };
      case "videos":
        return { set: setVideos };
      case "notes":
        return { set: setNotes };
      case "posts":
        return { set: setPosts };
      case "teacherApproval":
        return { set: setTeachers };
      case "users":
        return { set: setStudents };
      default:
        return null;
    }
  }

  function removeItem(id, listType) {
    const updateState =
      listType === "teacher"
        ? { set: setTeachers }
        : listType === "student"
        ? { set: setStudents }
        : getUpdateState();

    if (!updateState) return;

    if (!window.confirm("Are you sure you want to delete this item?")) {
      return;
    }

    const currentData = listType === "teacher" ? teachers : listType === "student" ? students : getCurrentData();
    updateState.set(currentData.filter((item) => item.id !== id));
  }

  function togglePostStatus(id, nextStatus) {
    setPosts((current) =>
      current.map((item) => (item.id === id ? { ...item, status: nextStatus } : item))
    );
  }

  function handleTeacherAction(id, action) {
    setTeachers((current) =>
      current.map((item) => {
        if (item.id !== id) return item;
        if (action === "approve") return { ...item, approval: "Approved", status: "Active" };
        if (action === "reject") return { ...item, approval: "Rejected", status: item.status };
        if (action === "block") return { ...item, status: "Blocked" };
        return item;
      })
    );
  }

  function filterItems(items) {
    const query = searchTerm.trim().toLowerCase();
    return items.filter((item) => {
      const text = Object.values(item)
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const matchesText = !query || text.includes(query);
      const matchesStatus =
        filterStatus === "all" || item.status?.toLowerCase() === filterStatus.toLowerCase();
      return matchesText && matchesStatus;
    });
  }

  function renderSectionContent() {
    const filteredStreams = filterItems(streams);
    const filteredSubjects = filterItems(subjects);
    const filteredLessons = filterItems(lessons);
    const filteredVideos = filterItems(videos);
    const filteredNotes = filterItems(notes);
    const filteredPosts = filterItems(posts);
    const filteredTeachers = filterItems(teachers);
    const filteredStudents = filterItems(students);

    switch (activeSection) {
      case "dashboard":
        return (
          <>
            <div className="admin-welcome-card">
              <div>
                <p className="small-label">Welcome back,</p>
                <h2>{adminName}</h2>
                <p className="muted-text">Manage your platform with quick actions, review approvals, and keep the dashboard updated.</p>
              </div>
              <div className="admin-welcome-actions">
                <button className="btn solid" onClick={() => setActiveSection("streams")}>Add Stream</button>
                <button className="btn outline" onClick={() => setActiveSection("teacherApproval")}>Review Teachers</button>
              </div>
            </div>
            <div className="dashboard-grid">
              {summaryCards.map((card) => (
                <div className="summary-card" key={card.label} style={{ borderTopColor: card.color }}>
                  <span>{card.label}</span>
                  <strong>{card.value}</strong>
                </div>
              ))}
            </div>
          </>
        );
      case "streams":
        return (
          <div className="admin-section-panel">
            <div className="section-header-row">
              <div>
                <h3>Stream management</h3>
                <p>Manage the main curriculum streams available to students.</p>
              </div>
              <button className="btn solid" onClick={() => openModal("add")}>Add Stream</button>
            </div>
            <div className="table-toolbar">
              <input
                type="search"
                placeholder="Search streams"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="table-scroll">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Stream</th>
                    <th>Description</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStreams.map((stream) => (
                    <tr key={stream.id}>
                      <td>{stream.name}</td>
                      <td>{stream.description}</td>
                      <td className="actions-cell">
                        <button className="action-btn" onClick={() => openModal("edit", stream)}>Edit</button>
                        <button className="action-btn danger" onClick={() => removeItem(stream.id)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      case "subjects":
        return (
          <div className="admin-section-panel">
            <div className="section-header-row">
              <div>
                <h3>Subject management</h3>
                <p>Add, edit and categorize subjects by stream.</p>
              </div>
              <button className="btn solid" onClick={() => openModal("add")}>Add Subject</button>
            </div>
            <div className="table-toolbar">
              <input
                type="search"
                placeholder="Search subjects"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                <option value="all">All streams</option>
                <option value="Science">Science</option>
                <option value="Commerce">Commerce</option>
                <option value="Arts">Arts</option>
                <option value="Technology">Technology</option>
              </select>
            </div>
            <div className="table-scroll">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Subject</th>
                    <th>Stream</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSubjects.map((subject) => (
                    <tr key={subject.id}>
                      <td>{subject.title}</td>
                      <td>{subject.stream}</td>
                      <td className="actions-cell">
                        <button className="action-btn" onClick={() => openModal("edit", subject)}>Edit</button>
                        <button className="action-btn danger" onClick={() => removeItem(subject.id)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      case "lessons":
        return (
          <div className="admin-section-panel">
            <div className="section-header-row">
              <div>
                <h3>Lesson management</h3>
                <p>Create and publish lessons for students.</p>
              </div>
              <button className="btn solid" onClick={() => openModal("add")}>Add Lesson</button>
            </div>
            <div className="table-toolbar">
              <input
                type="search"
                placeholder="Search lessons"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                <option value="all">All statuses</option>
                <option value="Published">Published</option>
                <option value="Draft">Draft</option>
              </select>
            </div>
            <div className="table-scroll">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Lesson</th>
                    <th>Subject</th>
                    <th>Stream</th>
                    <th>Chapter</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLessons.map((lesson) => (
                    <tr key={lesson.id}>
                      <td>{lesson.title}</td>
                      <td>{lesson.subject}</td>
                      <td>{lesson.stream}</td>
                      <td>{lesson.chapter}</td>
                      <td>{lesson.status}</td>
                      <td className="actions-cell">
                        <button className="action-btn" onClick={() => openModal("edit", lesson)}>Edit</button>
                        <button className="action-btn danger" onClick={() => removeItem(lesson.id)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      case "videos":
        return (
          <div className="admin-section-panel">
            <div className="section-header-row">
              <div>
                <h3>Lesson videos</h3>
                <p>Manage video lessons and lesson resources.</p>
              </div>
              <button className="btn solid" onClick={() => openModal("add")}>Add Video</button>
            </div>
            <div className="table-toolbar">
              <input
                type="search"
                placeholder="Search videos"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="table-scroll">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Lesson</th>
                    <th>Subject</th>
                    <th>URL</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVideos.map((video) => (
                    <tr key={video.id}>
                      <td>{video.title}</td>
                      <td>{video.lesson}</td>
                      <td>{video.subject}</td>
                      <td><a href={video.url} target="_blank" rel="noreferrer">Link</a></td>
                      <td className="actions-cell">
                        <button className="action-btn" onClick={() => openModal("edit", video)}>Edit</button>
                        <button className="action-btn danger" onClick={() => removeItem(video.id)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      case "notes":
        return (
          <div className="admin-section-panel">
            <div className="section-header-row">
              <div>
                <h3>Notes and materials</h3>
                <p>Upload or assign lesson materials for every chapter.</p>
              </div>
              <button className="btn solid" onClick={() => openModal("add")}>Add Material</button>
            </div>
            <div className="table-toolbar">
              <input
                type="search"
                placeholder="Search notes"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="table-scroll">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Lesson</th>
                    <th>Subject</th>
                    <th>Stream</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredNotes.map((note) => (
                    <tr key={note.id}>
                      <td>{note.title}</td>
                      <td>{note.lesson}</td>
                      <td>{note.subject}</td>
                      <td>{note.stream}</td>
                      <td className="actions-cell">
                        <button className="action-btn" onClick={() => openModal("edit", note)}>Edit</button>
                        <button className="action-btn danger" onClick={() => removeItem(note.id)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      case "posts":
        return (
          <div className="admin-section-panel">
            <div className="section-header-row">
              <div>
                <h3>Class posts</h3>
                <p>Approve or reject teacher posts and keep the marketplace safe.</p>
              </div>
            </div>
            <div className="table-toolbar">
              <input
                type="search"
                placeholder="Search posts"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                <option value="all">All statuses</option>
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
            <div className="table-scroll">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Teacher</th>
                    <th>Subject</th>
                    <th>Title</th>
                    <th>Type</th>
                    <th>District</th>
                    <th>Contact</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPosts.map((post) => (
                    <tr key={post.id}>
                      <td>{post.teacher}</td>
                      <td>{post.subject}</td>
                      <td>{post.title}</td>
                      <td>{post.type}</td>
                      <td>{post.district}</td>
                      <td>{post.contact}</td>
                      <td><span className={`status-badge ${post.status.toLowerCase()}`}>{post.status}</span></td>
                      <td className="actions-cell">
                        {post.status === "Pending" && (
                          <>
                            <button className="action-btn" onClick={() => togglePostStatus(post.id, "Approved")}>Approve</button>
                            <button className="action-btn danger" onClick={() => togglePostStatus(post.id, "Rejected")}>Reject</button>
                          </>
                        )}
                        <button className="action-btn" onClick={() => openModal("edit", post)}>Edit</button>
                        <button className="action-btn danger" onClick={() => removeItem(post.id)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      case "teacherApproval":
        return (
          <div className="admin-section-panel">
            <div className="section-header-row">
              <div>
                <h3>Teacher approval</h3>
                <p>Approve or reject new teacher accounts before they join the platform.</p>
              </div>
            </div>
            <div className="table-toolbar">
              <input
                type="search"
                placeholder="Search teachers"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="table-scroll">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Subject</th>
                    <th>Institute</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTeachers.map((teacher) => (
                    <tr key={teacher.id}>
                      <td>{teacher.name}</td>
                      <td>{teacher.email}</td>
                      <td>{teacher.subject}</td>
                      <td>{teacher.institute}</td>
                      <td>{teacher.approval}</td>
                      <td className="actions-cell">
                        <button className="action-btn" onClick={() => handleTeacherAction(teacher.id, "approve")}>Approve</button>
                        <button className="action-btn danger" onClick={() => handleTeacherAction(teacher.id, "reject")}>Reject</button>
                        <button className="action-btn" onClick={() => handleTeacherAction(teacher.id, "block")}>Block</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      case "users":
        return (
          <div className="admin-section-panel">
            <div className="section-header-row">
              <div>
                <h3>User management</h3>
                <p>Manage student and teacher accounts in one place.</p>
              </div>
            </div>
            <div className="table-toolbar">
              <input
                type="search"
                placeholder="Search users"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                <option value="all">All users</option>
                <option value="Active">Active students</option>
                <option value="Blocked">Blocked students</option>
              </select>
            </div>
            <div className="table-section">
              <h4>Students</h4>
              <div className="table-scroll">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Stream</th>
                      <th>A/L Year</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map((student) => (
                      <tr key={student.id}>
                        <td>{student.name}</td>
                        <td>{student.email}</td>
                        <td>{student.stream}</td>
                        <td>{student.year}</td>
                        <td>{student.status}</td>
                        <td className="actions-cell">
                          <button className="action-btn">View</button>
                          <button className="action-btn danger">Block</button>
                          <button className="action-btn danger" onClick={() => removeItem(student.id, "student")}>Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="table-section">
              <h4>Teachers</h4>
              <div className="table-scroll">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Subject</th>
                      <th>Approval</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTeachers.map((teacher) => (
                      <tr key={teacher.id}>
                        <td>{teacher.name}</td>
                        <td>{teacher.email}</td>
                        <td>{teacher.subject}</td>
                        <td>{teacher.approval}</td>
                        <td>{teacher.status}</td>
                        <td className="actions-cell">
                          <button className="action-btn">View</button>
                          <button className="action-btn" onClick={() => handleTeacherAction(teacher.id, "approve")}>Approve</button>
                          <button className="action-btn danger" onClick={() => handleTeacherAction(teacher.id, "block")}>Block</button>
                          <button className="action-btn danger" onClick={() => removeItem(teacher.id, "teacher")}>Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      case "settings":
        return (
          <div className="admin-section-panel settings-panel">
            <div className="section-header-row">
              <div>
                <h3>Platform settings</h3>
                <p>Update branding, exam details, news, and AI assistant controls.</p>
              </div>
            </div>
            <div className="settings-grid">
              <label>
                Platform name
                <input
                  value={settings.platformName}
                  onChange={(e) => setSettings((prev) => ({ ...prev, platformName: e.target.value }))}
                />
              </label>
              <label>
                A/L exam date
                <input
                  type="date"
                  value={settings.examDate}
                  onChange={(e) => setSettings((prev) => ({ ...prev, examDate: e.target.value }))}
                />
              </label>
              <label>
                Latest news text
                <textarea
                  value={settings.latestNews}
                  onChange={(e) => setSettings((prev) => ({ ...prev, latestNews: e.target.value }))}
                />
              </label>
              <label>
                Homepage banner text
                <textarea
                  value={settings.homepageBanner}
                  onChange={(e) => setSettings((prev) => ({ ...prev, homepageBanner: e.target.value }))}
                />
              </label>
              <label className="toggle-row">
                <span>AI assistant</span>
                <button
                  className={settings.aiEnabled ? "toggle active" : "toggle"}
                  onClick={() => setSettings((prev) => ({ ...prev, aiEnabled: !prev.aiEnabled }))}
                >
                  {settings.aiEnabled ? "Enabled" : "Disabled"}
                </button>
              </label>
            </div>
          </div>
        );
      default:
        return null;
    }
  }

  function renderModalContent() {
    const header = modalMode === "edit" ? `Edit ${sections[activeSection]}` : `Add ${sections[activeSection]}`;
    const formItems = [];

    if (activeSection === "streams") {
      formItems.push(
        { label: "Stream name", key: "name", type: "text" },
        { label: "Description", key: "description", type: "textarea" }
      );
    }

    if (activeSection === "subjects") {
      formItems.push(
        { label: "Subject title", key: "title", type: "text" },
        { label: "Stream", key: "stream", type: "text" }
      );
    }

    if (activeSection === "lessons") {
      formItems.push(
        { label: "Lesson title", key: "title", type: "text" },
        { label: "Stream", key: "stream", type: "text" },
        { label: "Subject", key: "subject", type: "text" },
        { label: "Chapter number", key: "chapter", type: "number" },
        { label: "Status", key: "status", type: "select", options: ["Draft", "Published"] },
        { label: "Description", key: "description", type: "textarea" }
      );
    }

    if (activeSection === "videos") {
      formItems.push(
        { label: "Video title", key: "title", type: "text" },
        { label: "YouTube / video URL", key: "url", type: "text" },
        { label: "Lesson", key: "lesson", type: "text" },
        { label: "Subject", key: "subject", type: "text" },
        { label: "Thumbnail URL", key: "thumbnail", type: "text" },
        { label: "Description", key: "description", type: "textarea" }
      );
    }

    if (activeSection === "notes") {
      formItems.push(
        { label: "Material title", key: "title", type: "text" },
        { label: "Stream", key: "stream", type: "text" },
        { label: "Subject", key: "subject", type: "text" },
        { label: "Lesson", key: "lesson", type: "text" },
        { label: "File URL", key: "fileUrl", type: "text" },
        { label: "Description", key: "description", type: "textarea" }
      );
    }

    if (activeSection === "posts") {
      formItems.push(
        { label: "Teacher name", key: "teacher", type: "text" },
        { label: "Subject", key: "subject", type: "text" },
        { label: "Class title", key: "title", type: "text" },
        { label: "Online / Physical", key: "type", type: "text" },
        { label: "District", key: "district", type: "text" },
        { label: "Contact number", key: "contact", type: "text" },
        { label: "Status", key: "status", type: "select", options: ["Pending", "Approved", "Rejected"] }
      );
    }

    if (activeSection === "teacherApproval") {
      formItems.push(
        { label: "Name", key: "name", type: "text" },
        { label: "Email", key: "email", type: "text" },
        { label: "Phone", key: "phone", type: "text" },
        { label: "Main subject", key: "subject", type: "text" },
        { label: "Institute / class name", key: "institute", type: "text" },
        { label: "Approval status", key: "approval", type: "select", options: ["Pending", "Approved", "Rejected"] }
      );
    }

    if (activeSection === "users") {
      formItems.push(
        { label: "Name", key: "name", type: "text" },
        { label: "Email", key: "email", type: "text" },
        { label: "Stream", key: "stream", type: "text" },
        { label: "A/L year", key: "year", type: "text" },
        { label: "Status", key: "status", type: "text" }
      );
    }

    return (
      <div className="modal-overlay" onClick={closeModal}>
        <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <div>
              <h3>{header}</h3>
              <p>Update the information for the selected admin resource.</p>
            </div>
            <button className="modal-close-btn" onClick={closeModal}>&times;</button>
          </div>
          <div className="modal-body">
            {formItems.map((field) => (
              <label key={field.key} className="modal-field">
                <span>{field.label}</span>
                {field.type === "textarea" ? (
                  <textarea
                    value={formState[field.key] || ""}
                    onChange={(e) => handleFormChange(field.key, e.target.value)}
                  />
                ) : field.type === "select" ? (
                  <select
                    value={formState[field.key] || ""}
                    onChange={(e) => handleFormChange(field.key, e.target.value)}
                  >
                    {(field.options || []).map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={field.type}
                    value={formState[field.key] || ""}
                    onChange={(e) => handleFormChange(field.key, e.target.value)}
                  />
                )}
              </label>
            ))}
          </div>
          <div className="modal-actions">
            <button className="btn outline" onClick={closeModal}>Cancel</button>
            <button className="btn solid" onClick={saveModal}>{modalMode === "edit" ? "Save changes" : "Create"}</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-shell">
      <aside className={`admin-sidebar ${mobileOpen ? "open" : ""}`}>
        <div className="sidebar-brand">
          <div className="brand-mark">LH</div>
          <div>
            <p className="brand-label">Learning Hub</p>
            <p className="brand-subtitle">Admin panel</p>
          </div>
        </div>
        <nav className="sidebar-list">
          {menuItems.map((item) => (
            <button
              key={item.id}
              className={activeSection === item.id ? "sidebar-link active" : "sidebar-link"}
              onClick={() => {
                setActiveSection(item.id);
                setSearchTerm("");
                setFilterStatus("all");
                setMobileOpen(false);
              }}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <button className="btn outline" onClick={onLogout}>Logout</button>
        </div>
      </aside>
      <main className="admin-main">
        <div className="admin-topbar">
          <button className="mobile-menu-btn" onClick={() => setMobileOpen((prev) => !prev)}>
            ☰
          </button>
          <div>
            <p className="top-info">Admin Dashboard</p>
            <h1>{sections[activeSection]}</h1>
          </div>
          <div className="top-actions">
            <button className="btn outline">{adminName}</button>
            <button className="btn solid" onClick={onLogout}>Logout</button>
          </div>
        </div>
        <div className="admin-content">{renderSectionContent()}</div>
      </main>
      {modalOpen && renderModalContent()}
    </div>
  );
}

export default AdminPanel;
