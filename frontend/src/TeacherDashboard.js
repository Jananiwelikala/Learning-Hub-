import { useMemo, useState, useEffect } from "react";
import {
  getTeacherPosts,
  createClassPost,
  updateClassPost,
  deleteClassPost,
  submitPostForApproval,
  getCommentsForPost,
  createComment,
  updateComment,
  deleteComment,
  getTeacherComments
} from "./api";
import LoadingSpinner from "./components/LoadingSpinner";
import ErrorMessage from "./components/ErrorMessage";
import EmptyState from "./components/EmptyState";

const initialPosts = [
  {
    id: 1,
    title: "Advanced Physics Revision Classes",
    subject: "Physics",
    stream: "Science",
    type: "Online",
    district: "Colombo",
    institute: "City Institute",
    fee: "Rs. 2500/month",
    schedule: "Mon, Wed, Fri - 6:00 PM",
    description: "Comprehensive A/L Physics revision covering all syllabus areas with past paper practice.",
    contact: "+94 77 123 4567",
    whatsapp: "+94 77 123 4567",
    status: "Approved",
    views: 245,
    comments: 12,
    createdAt: "2024-01-15",
    image: null,
    tags: ["Physics", "A/L", "Revision", "Past Papers"]
  },
  {
    id: 2,
    title: "Chemistry Practical Sessions",
    subject: "Chemistry",
    stream: "Science",
    type: "Physical",
    district: "Kandy",
    institute: "Science Academy",
    fee: "Rs. 3000/month",
    schedule: "Tue, Thu - 4:00 PM",
    description: "Hands-on chemistry practical sessions with lab equipment and safety training.",
    contact: "+94 71 987 6543",
    whatsapp: "+94 71 987 6543",
    status: "Pending",
    views: 89,
    comments: 3,
    createdAt: "2024-01-20",
    image: null,
    tags: ["Chemistry", "Practical", "Lab"]
  },
  {
    id: 3,
    title: "Combined Maths Weekend Classes",
    subject: "Combined Maths",
    stream: "Science",
    type: "Both",
    district: "Gampaha",
    institute: "Math Excellence Center",
    fee: "Rs. 3500/month",
    schedule: "Sat, Sun - 9:00 AM",
    description: "Intensive Combined Maths classes for A/L students with individual attention.",
    contact: "+94 76 555 1234",
    whatsapp: "+94 76 555 1234",
    status: "Approved",
    views: 156,
    comments: 8,
    createdAt: "2024-01-10",
    image: null,
    tags: ["Combined Maths", "A/L", "Weekend"]
  }
];

const initialComments = [
  {
    id: 1,
    postId: 1,
    postTitle: "Advanced Physics Revision Classes",
    studentName: "Kasun Perera",
    comment: "Hi sir, I'm interested in joining your physics classes. Can you tell me more about the syllabus coverage?",
    date: "2024-01-22",
    replied: false,
    reply: ""
  },
  {
    id: 2,
    postId: 1,
    postTitle: "Advanced Physics Revision Classes",
    studentName: "Nadeesha Silva",
    comment: "Are there any trial classes available?",
    date: "2024-01-21",
    replied: true,
    reply: "Yes, we offer a free trial class for the first week. Please contact me to schedule it."
  },
  {
    id: 3,
    postId: 3,
    postTitle: "Combined Maths Weekend Classes",
    studentName: "Roshan Fernando",
    comment: "What is the class size? Is it individual or group?",
    date: "2024-01-20",
    replied: false,
    reply: ""
  }
];

const initialProfile = {
  name: "Mr. Sanjeewa Fernando",
  email: "sanjeewa@gmail.com",
  phone: "+94 77 123 4567",
  subject: "Physics",
  qualifications: "BSc Physics, MSc Applied Physics",
  experience: "8 years",
  bio: "Experienced A/L Physics teacher with proven track record of student success. Specializing in practical applications and exam preparation.",
  district: "Colombo",
  whatsapp: "+94 77 123 4567",
  facebook: "https://facebook.com/sanjeewa.physics",
  profilePhoto: null
};

const initialSettings = {
  emailNotifications: true,
  whatsappVisible: true,
  darkMode: false
};

const menuItems = [
  { id: "dashboard", label: "Dashboard" },
  { id: "posts", label: "My Class Posts" },
  { id: "create", label: "Create Post" },
  { id: "comments", label: "Comments" },
  { id: "profile", label: "Profile" },
  { id: "settings", label: "Settings" },
];

function TeacherDashboard({ teacherName, onLogout }) {
  const [activeSection, setActiveSection] = useState("dashboard");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [posts, setPosts] = useState([]);
  const [comments, setComments] = useState([]);
  const [profile, setProfile] = useState({
    name: teacherName || "",
    email: "",
    phone: "",
    bio: "",
    subjects: [],
    experience: "",
    qualifications: ""
  });
  const [settings, setSettings] = useState({
    emailNotifications: true,
    commentNotifications: true,
    approvalNotifications: true,
    darkMode: false,
    language: "en"
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add");
  const [modalItem, setModalItem] = useState(null);
  const [formState, setFormState] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load data on component mount
  useEffect(() => {
    loadTeacherData();
  }, []);

  async function loadTeacherData() {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");

      // Load posts
      const postsResult = await getTeacherPosts(token);
      if (postsResult.success) {
        setPosts(postsResult.posts);
      } else {
        setError("Failed to load posts: " + postsResult.error);
      }

      // Load comments
      const commentsResult = await getTeacherComments(token);
      if (commentsResult.success) {
        setComments(commentsResult.comments);
      } else {
        setError("Failed to load comments: " + commentsResult.error);
      }
    } catch (err) {
      setError("Network error occurred");
    } finally {
      setLoading(false);
    }
  }

  const stats = useMemo(() => ({
    totalPosts: posts.length,
    activePosts: posts.filter(p => p.status === "approved").length,
    pendingPosts: posts.filter(p => p.status === "pending").length,
    draftPosts: posts.filter(p => p.status === "draft").length,
    totalComments: comments.length
  }), [posts, comments]);

  const recentActivities = useMemo(() => {
    const activities = [];

    // Add recent comments
    comments.slice(0, 3).forEach(comment => {
      activities.push({
        id: `comment-${comment._id}`,
        type: "comment",
        message: `New comment on "${comment.post?.title || 'your post'}"`,
        time: new Date(comment.createdAt).toLocaleDateString()
      });
    });

    // Add recent posts
    posts.slice(0, 2).forEach(post => {
      activities.push({
        id: `post-${post._id}`,
        type: post.status === "approved" ? "approval" : "post",
        message: post.status === "approved" ?
          `Your post "${post.title}" was approved` :
          `New post "${post.title}" created`,
        time: new Date(post.createdAt).toLocaleDateString()
      });
    });

    return activities.slice(0, 5);
  }, [posts, comments]);

  function openModal(mode, item = null) {
    setModalMode(mode);
    setModalItem(item);

    const defaultForm = {
      title: "",
      description: "",
      subject: "",
      grade: "",
      location: "",
      schedule: "",
      duration: "",
      fee: "",
      contactInfo: "",
      status: "draft"
    };

    if (item) {
      setFormState({
        title: item.title || "",
        description: item.description || "",
        subject: item.subject || "",
        grade: item.grade || "",
        location: item.location || "",
        schedule: item.schedule || "",
        duration: item.duration || "",
        fee: item.fee || "",
        contactInfo: item.contactInfo || "",
        status: item.status || "draft"
      });
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

  async function saveModal() {
    const token = localStorage.getItem("token");

    try {
      let result;
      if (modalMode === "add") {
        result = await createClassPost(token, formState);
      } else {
        result = await updateClassPost(token, modalItem._id, formState);
      }

      if (result.success) {
        await loadTeacherData(); // Reload data
        closeModal();
        alert(modalMode === "add" ? "Post created successfully!" : "Post updated successfully!");
      } else {
        alert("Error: " + result.error);
      }
    } catch (err) {
      alert("Network error occurred");
    }
  }

  async function removePost(id) {
    if (!window.confirm("Are you sure you want to delete this post?")) {
      return;
    }

    const token = localStorage.getItem("token");
    const result = await deleteClassPost(token, id);

    if (result.success) {
      await loadTeacherData(); // Reload data
      alert("Post deleted successfully!");
    } else {
      alert("Error: " + result.error);
    }
  }

  function duplicatePost(id) {
    const post = posts.find(p => p.id === id);
    if (post) {
      const duplicate = {
        ...post,
        id: Date.now(),
        title: `${post.title} (Copy)`,
        status: "Draft",
        views: 0,
        comments: 0,
        createdAt: new Date().toISOString().split('T')[0]
      };
      setPosts((current) => [...current, duplicate]);
    }
  }

  async function submitForApproval(id) {
    const token = localStorage.getItem("token");
    const result = await submitPostForApproval(token, id);

    if (result.success) {
      await loadTeacherData(); // Reload data
      alert("Post submitted for approval!");
    } else {
      alert("Error: " + result.error);
    }
  }

  async function saveReply(commentId, replyText) {
    const token = localStorage.getItem("token");
    const result = await createComment(token, {
      postId: comments.find(c => c._id === commentId)?.post?._id,
      content: replyText,
      parentCommentId: commentId
    });

    if (result.success) {
      await loadTeacherData(); // Reload data
      alert("Reply sent successfully!");
    } else {
      alert("Error: " + result.error);
    }
  }

  async function deleteComment(commentId) {
    if (!window.confirm("Are you sure you want to delete this comment?")) {
      return;
    }

    const token = localStorage.getItem("token");
    const result = await deleteComment(token, commentId);

    if (result.success) {
      await loadTeacherData(); // Reload data
      alert("Comment deleted successfully!");
    } else {
      alert("Error: " + result.error);
    }
  }

  function saveProfile() {
    // In real app, this would save to backend
    alert("Profile saved successfully!");
  }

  function filterPosts() {
    const query = searchTerm.trim().toLowerCase();
    return posts.filter((post) => {
      const text = `${post.title} ${post.description} ${post.subject} ${post.grade} ${post.location}`
        .toLowerCase();
      const matchesText = !query || text.includes(query);
      const matchesStatus = filterStatus === "all" || post.status === filterStatus;
      return matchesText && matchesStatus;
    });
  }

  function renderSectionContent() {
    const filteredPosts = filterPosts();

    switch (activeSection) {
      case "dashboard":
        return (
          <>
            <div className="teacher-welcome-card">
              <div>
                <p className="small-label">Welcome back,</p>
                <h2>{teacherName}</h2>
                <p className="muted-text">Manage your class advertisements and connect with students.</p>
              </div>
              <div className="teacher-welcome-actions">
                <button className="btn solid" onClick={() => setActiveSection("create")}>Create New Post</button>
                <button className="btn outline" onClick={() => setActiveSection("posts")}>View My Posts</button>
              </div>
            </div>

            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">📋</div>
                <div>
                  <span className="stat-number">{stats.totalPosts}</span>
                  <span className="stat-label">Total Posts</span>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">👁️</div>
                <div>
                  <span className="stat-number">{stats.totalViews}</span>
                  <span className="stat-label">Total Views</span>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">💬</div>
                <div>
                  <span className="stat-number">{stats.totalComments}</span>
                  <span className="stat-label">Comments</span>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">✅</div>
                <div>
                  <span className="stat-number">{stats.approvedPosts}</span>
                  <span className="stat-label">Approved</span>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">⏳</div>
                <div>
                  <span className="stat-number">{stats.pendingPosts}</span>
                  <span className="stat-label">Pending</span>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">🎯</div>
                <div>
                  <span className="stat-number">{stats.activePosts}</span>
                  <span className="stat-label">Active</span>
                </div>
              </div>
            </div>

            <div className="dashboard-sections">
              <div className="activity-section">
                <h3>Recent Activity</h3>
                <div className="activity-list">
                  {recentActivities.map((activity) => (
                    <div key={activity.id} className="activity-item">
                      <div className="activity-icon">
                        {activity.type === "comment" ? "💬" : activity.type === "approval" ? "✅" : "👁️"}
                      </div>
                      <div className="activity-content">
                        <p>{activity.message}</p>
                        <span className="activity-time">{activity.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="quick-actions-section">
                <h3>Quick Actions</h3>
                <div className="quick-actions">
                  <button className="quick-action-btn" onClick={() => setActiveSection("create")}>
                    <span className="action-icon">➕</span>
                    <span>Create New Post</span>
                  </button>
                  <button className="quick-action-btn" onClick={() => setActiveSection("profile")}>
                    <span className="action-icon">👤</span>
                    <span>Edit Profile</span>
                  </button>
                  <button className="quick-action-btn" onClick={() => setActiveSection("comments")}>
                    <span className="action-icon">💬</span>
                    <span>View Comments</span>
                  </button>
                </div>
              </div>
            </div>
          </>
        );

      case "posts":
        return (
          <div className="teacher-section-panel">
            <div className="section-header-row">
              <div>
                <h3>My Class Posts</h3>
                <p>Manage your class advertisements and track performance.</p>
              </div>
              <button className="btn solid" onClick={() => setActiveSection("create")}>Create New Post</button>
            </div>

            {loading ? (
              <LoadingSpinner message="Loading your posts..." />
            ) : error ? (
              <ErrorMessage
                title="Failed to load posts"
                message={error}
                onRetry={loadTeacherData}
              />
            ) : filteredPosts.length === 0 ? (
              <EmptyState
                icon="📝"
                title="No posts yet"
                message="You haven't created any class posts yet. Create your first post to start advertising your classes."
                actionText="Create First Post"
                onAction={() => setActiveSection("create")}
              />
            ) : (
              <>
                <div className="table-toolbar">
                  <input
                    type="search"
                    placeholder="Search posts"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                    <option value="all">All statuses</option>
                    <option value="approved">Approved</option>
                    <option value="pending">Pending</option>
                    <option value="draft">Draft</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
                <div className="table-scroll">
                  <table className="teacher-table">
                    <thead>
                      <tr>
                        <th>Title</th>
                        <th>Subject</th>
                        <th>Grade</th>
                        <th>Location</th>
                        <th>Fee</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPosts.map((post) => (
                        <tr key={post._id}>
                          <td>{post.title}</td>
                          <td>{post.subject}</td>
                          <td>{post.grade}</td>
                          <td>{post.location}</td>
                          <td>Rs. {post.fee}</td>
                          <td><span className={`status-badge ${post.status}`}>{post.status}</span></td>
                          <td className="actions-cell">
                            <button className="action-btn" onClick={() => openModal("edit", post)}>Edit</button>
                            {post.status === "draft" && (
                              <button className="action-btn" onClick={() => submitForApproval(post._id)}>
                                Submit
                              </button>
                            )}
                            <button className="action-btn danger" onClick={() => removePost(post._id)}>Delete</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        );

      case "create":
        return (
          <div className="teacher-section-panel">
            <div className="section-header-row">
              <div>
                <h3>{modalMode === "edit" ? "Edit Class Post" : "Create New Class Post"}</h3>
                <p>Advertise your classes to reach more students.</p>
              </div>
            </div>
            <div className="create-form">
              <div className="form-grid">
                <label>
                  Post Title *
                  <input
                    type="text"
                    value={formState.title || ""}
                    onChange={(e) => handleFormChange("title", e.target.value)}
                    placeholder="e.g., Advanced Physics Revision Classes"
                    required
                  />
                </label>
                <label>
                  Subject *
                  <select
                    value={formState.subject || ""}
                    onChange={(e) => handleFormChange("subject", e.target.value)}
                    required
                  >
                    <option value="">Select subject</option>
                    <option value="Physics">Physics</option>
                    <option value="Chemistry">Chemistry</option>
                    <option value="Biology">Biology</option>
                    <option value="Combined Maths">Combined Maths</option>
                    <option value="Accounting">Accounting</option>
                    <option value="Economics">Economics</option>
                    <option value="Business Studies">Business Studies</option>
                    <option value="ICT">ICT</option>
                  </select>
                </label>
                <label>
                  Grade Level *
                  <select
                    value={formState.grade || ""}
                    onChange={(e) => handleFormChange("grade", e.target.value)}
                    required
                  >
                    <option value="">Select grade</option>
                    <option value="Grade 6">Grade 6</option>
                    <option value="Grade 7">Grade 7</option>
                    <option value="Grade 8">Grade 8</option>
                    <option value="Grade 9">Grade 9</option>
                    <option value="Grade 10">Grade 10</option>
                    <option value="Grade 11">Grade 11</option>
                    <option value="A/L">A/L</option>
                    <option value="O/L">O/L</option>
                  </select>
                </label>
                <label>
                  Location *
                  <input
                    type="text"
                    value={formState.location || ""}
                    onChange={(e) => handleFormChange("location", e.target.value)}
                    placeholder="e.g., Colombo, Kandy, Online"
                    required
                  />
                </label>
                <label>
                  Schedule *
                  <input
                    type="text"
                    value={formState.schedule || ""}
                    onChange={(e) => handleFormChange("schedule", e.target.value)}
                    placeholder="e.g., Mon, Wed, Fri - 6:00 PM"
                    required
                  />
                </label>
                <label>
                  Duration *
                  <input
                    type="text"
                    value={formState.duration || ""}
                    onChange={(e) => handleFormChange("duration", e.target.value)}
                    placeholder="e.g., 2 hours per session"
                    required
                  />
                </label>
                <label>
                  Monthly Fee (Rs.) *
                  <input
                    type="number"
                    value={formState.fee || ""}
                    onChange={(e) => handleFormChange("fee", e.target.value)}
                    placeholder="e.g., 2500"
                    min="0"
                    required
                  />
                </label>
                <label>
                  Contact Information *
                  <input
                    type="text"
                    value={formState.contactInfo || ""}
                    onChange={(e) => handleFormChange("contactInfo", e.target.value)}
                    placeholder="Phone/WhatsApp: +94 XX XXX XXXX"
                    required
                  />
                </label>
              </div>
              <label>
                Description *
                <textarea
                  value={formState.description || ""}
                  onChange={(e) => handleFormChange("description", e.target.value)}
                  placeholder="Describe your classes, teaching methodology, syllabus coverage, and what students can expect..."
                  rows={4}
                  required
                />
              </label>
              <div className="form-actions">
                <button className="btn outline" onClick={() => handleFormChange("status", "Draft")}>
                  Save as Draft
                </button>
                <button className="btn solid" onClick={() => {
                  handleFormChange("status", "Pending");
                  saveModal();
                }}>
                  Submit for Approval
                </button>
              </div>
            </div>
          </div>
        );

      case "comments":
        return (
          <div className="teacher-section-panel">
            <div className="section-header-row">
              <div>
                <h3>Student Comments</h3>
                <p>Respond to student inquiries and manage discussions.</p>
              </div>
            </div>
            <div className="comments-list">
              {comments.map((comment) => (
                <div key={comment._id} className="comment-card">
                  <div className="comment-header">
                    <div>
                      <strong>{comment.authorName}</strong>
                      <span className="comment-post">on "{comment.post?.title || 'your post'}"</span>
                    </div>
                    <span className="comment-date">{new Date(comment.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="comment-content">
                    <p>{comment.content}</p>
                  </div>
                  {!comment.parentComment && (
                    <div className="reply-form">
                      <textarea
                        placeholder="Write your reply..."
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            const replyText = e.target.value.trim();
                            if (replyText) {
                              saveReply(comment._id, replyText);
                              e.target.value = "";
                            }
                          }
                        }}
                      />
                      <button
                        className="btn small"
                        onClick={(e) => {
                          const textarea = e.target.previousElementSibling;
                          const replyText = textarea.value.trim();
                          if (replyText) {
                            saveReply(comment._id, replyText);
                            textarea.value = "";
                          }
                        }}
                      >
                        Reply
                      </button>
                    </div>
                  )}
                  <div className="comment-actions">
                    <button className="action-btn danger small" onClick={() => deleteComment(comment._id)}>
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case "profile":
        return (
          <div className="teacher-section-panel">
            <div className="section-header-row">
              <div>
                <h3>My Profile</h3>
                <p>Update your teacher profile and contact information.</p>
              </div>
            </div>
            <div className="profile-form">
              <div className="form-grid">
                <label>
                  Full Name
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
                  />
                </label>
                <label>
                  Email
                  <input
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
                  />
                </label>
                <label>
                  Phone
                  <input
                    type="tel"
                    value={profile.phone}
                    onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </label>
                <label>
                  Main Subject
                  <select
                    value={profile.subject}
                    onChange={(e) => setProfile(prev => ({ ...prev, subject: e.target.value }))}
                  >
                    <option value="Physics">Physics</option>
                    <option value="Chemistry">Chemistry</option>
                    <option value="Biology">Biology</option>
                    <option value="Combined Maths">Combined Maths</option>
                    <option value="Accounting">Accounting</option>
                    <option value="Economics">Economics</option>
                    <option value="Business Studies">Business Studies</option>
                    <option value="ICT">ICT</option>
                  </select>
                </label>
                <label>
                  Qualifications
                  <input
                    type="text"
                    value={profile.qualifications}
                    onChange={(e) => setProfile(prev => ({ ...prev, qualifications: e.target.value }))}
                  />
                </label>
                <label>
                  Years of Experience
                  <input
                    type="text"
                    value={profile.experience}
                    onChange={(e) => setProfile(prev => ({ ...prev, experience: e.target.value }))}
                  />
                </label>
                <label>
                  District
                  <input
                    type="text"
                    value={profile.district}
                    onChange={(e) => setProfile(prev => ({ ...prev, district: e.target.value }))}
                  />
                </label>
                <label>
                  WhatsApp
                  <input
                    type="tel"
                    value={profile.whatsapp}
                    onChange={(e) => setProfile(prev => ({ ...prev, whatsapp: e.target.value }))}
                  />
                </label>
              </div>
              <label>
                Short Bio
                <textarea
                  value={profile.bio}
                  onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
                  rows={3}
                />
              </label>
              <label>
                Facebook Page (optional)
                <input
                  type="url"
                  value={profile.facebook}
                  onChange={(e) => setProfile(prev => ({ ...prev, facebook: e.target.value }))}
                />
              </label>
              <div className="form-actions">
                <button className="btn solid" onClick={saveProfile}>Save Profile</button>
              </div>
            </div>
          </div>
        );

      case "settings":
        return (
          <div className="teacher-section-panel">
            <div className="section-header-row">
              <div>
                <h3>Settings</h3>
                <p>Manage your account preferences and privacy settings.</p>
              </div>
            </div>
            <div className="settings-grid">
              <div className="setting-item">
                <div>
                  <h4>Email Notifications</h4>
                  <p>Receive notifications about new comments and approvals</p>
                </div>
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={settings.emailNotifications}
                    onChange={(e) => setSettings(prev => ({ ...prev, emailNotifications: e.target.checked }))}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
              <div className="setting-item">
                <div>
                  <h4>WhatsApp Contact Visible</h4>
                  <p>Show your WhatsApp number on class posts</p>
                </div>
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={settings.whatsappVisible}
                    onChange={(e) => setSettings(prev => ({ ...prev, whatsappVisible: e.target.checked }))}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
              <div className="setting-item">
                <div>
                  <h4>Dark Mode</h4>
                  <p>Switch to dark theme (coming soon)</p>
                </div>
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={settings.darkMode}
                    onChange={(e) => setSettings(prev => ({ ...prev, darkMode: e.target.checked }))}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
              <div className="setting-item danger">
                <div>
                  <h4>Delete Account</h4>
                  <p>Permanently delete your account and all data</p>
                </div>
                <button className="btn danger small">Request Deletion</button>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  }

  return (
    <div className="teacher-shell">
      <aside className={`teacher-sidebar ${mobileOpen ? "open" : ""}`}>
        <div className="sidebar-brand">
          <div className="brand-mark">👨‍🏫</div>
          <div>
            <p className="brand-label">Teacher Panel</p>
            <p className="brand-subtitle">Learning Hub</p>
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
      <main className="teacher-main">
        <div className="teacher-topbar">
          <button className="mobile-menu-btn" onClick={() => setMobileOpen((prev) => !prev)}>
            ☰
          </button>
          <div>
            <p className="top-info">Teacher Dashboard</p>
            <h1>{menuItems.find(item => item.id === activeSection)?.label}</h1>
          </div>
          <div className="top-actions">
            <span className="subject-badge">{profile.subject}</span>
            <button className="notification-btn">🔔</button>
            <button className="btn outline">{teacherName}</button>
            <button className="btn solid" onClick={onLogout}>Logout</button>
          </div>
        </div>
        <div className="teacher-content">{renderSectionContent()}</div>
      </main>
      {modalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="teacher-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3>Edit Class Post</h3>
                <p>Update your class advertisement details.</p>
              </div>
              <button className="modal-close-btn" onClick={closeModal}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <label>
                  Post Title
                  <input
                    type="text"
                    value={formState.title || ""}
                    onChange={(e) => handleFormChange("title", e.target.value)}
                  />
                </label>
                <label>
                  Subject
                  <select
                    value={formState.subject || ""}
                    onChange={(e) => handleFormChange("subject", e.target.value)}
                  >
                    <option value="">Select subject</option>
                    <option value="Physics">Physics</option>
                    <option value="Chemistry">Chemistry</option>
                    <option value="Biology">Biology</option>
                    <option value="Combined Maths">Combined Maths</option>
                    <option value="Accounting">Accounting</option>
                    <option value="Economics">Economics</option>
                    <option value="Business Studies">Business Studies</option>
                    <option value="ICT">ICT</option>
                  </select>
                </label>
                <label>
                  Stream
                  <select
                    value={formState.stream || ""}
                    onChange={(e) => handleFormChange("stream", e.target.value)}
                  >
                    <option value="Science">Science</option>
                    <option value="Commerce">Commerce</option>
                    <option value="Arts">Arts</option>
                    <option value="Technology">Technology</option>
                  </select>
                </label>
                <label>
                  Class Type
                  <select
                    value={formState.type || ""}
                    onChange={(e) => handleFormChange("type", e.target.value)}
                  >
                    <option value="Online">Online</option>
                    <option value="Physical">Physical</option>
                    <option value="Both">Both</option>
                  </select>
                </label>
                <label>
                  District / City
                  <input
                    type="text"
                    value={formState.district || ""}
                    onChange={(e) => handleFormChange("district", e.target.value)}
                  />
                </label>
                <label>
                  Institute / Location
                  <input
                    type="text"
                    value={formState.institute || ""}
                    onChange={(e) => handleFormChange("institute", e.target.value)}
                  />
                </label>
                <label>
                  Fee (optional)
                  <input
                    type="text"
                    value={formState.fee || ""}
                    onChange={(e) => handleFormChange("fee", e.target.value)}
                  />
                </label>
                <label>
                  Schedule
                  <input
                    type="text"
                    value={formState.schedule || ""}
                    onChange={(e) => handleFormChange("schedule", e.target.value)}
                  />
                </label>
                <label>
                  Contact Number
                  <input
                    type="tel"
                    value={formState.contact || ""}
                    onChange={(e) => handleFormChange("contact", e.target.value)}
                  />
                </label>
                <label>
                  WhatsApp Number
                  <input
                    type="tel"
                    value={formState.whatsapp || ""}
                    onChange={(e) => handleFormChange("whatsapp", e.target.value)}
                  />
                </label>
              </div>
              <label>
                Description
                <textarea
                  value={formState.description || ""}
                  onChange={(e) => handleFormChange("description", e.target.value)}
                  rows={4}
                />
              </label>
              <label>
                Tags (comma separated)
                <input
                  type="text"
                  value={formState.tags || ""}
                  onChange={(e) => handleFormChange("tags", e.target.value)}
                />
              </label>
            </div>
            <div className="modal-actions">
              <button className="btn outline" onClick={closeModal}>Cancel</button>
              <button className="btn solid" onClick={saveModal}>Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TeacherDashboard;