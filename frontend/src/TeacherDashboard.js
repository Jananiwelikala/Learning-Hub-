import { useMemo, useState, useEffect } from "react";
import {
  getTeacherPosts,
  createClassPost,
  updateClassPost,
  deleteClassPost,
  submitPostForApproval,
  getTeacherComments,
  getCurrentUserProfile,
  updateCurrentUserProfile,
} from "./api";
import LoadingSpinner from "./components/LoadingSpinner";
import ErrorMessage from "./components/ErrorMessage";
import EmptyState from "./components/EmptyState";
import "./TeacherDashboard.css";

const menuItems = [
  { id: "dashboard", label: "Home" },
  { id: "posts", label: "Class Posts" },
  { id: "create", label: "Create Post" },
  { id: "profile", label: "Profile" },
];

const emptyPostForm = {
  title: "",
  description: "",
  subject: "",
  grade: "",
  type: "",
  location: "",
  schedule: "",
  duration: "",
  fee: "",
  contactInfo: "",
  image: null,
  imagePreview: null,
  status: "pending",
};

const emptyProfile = {
  name: "",
  email: "",
  phone: "",
  subject: "",
  teachingMode: "",
  institute: "",
  qualifications: "",
  experience: "",
  district: "",
  bio: "",
};

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "null") || {};
  } catch {
    return {};
  }
}

function getInitials(name = "") {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "T";
  return words.slice(0, 2).map((word) => word[0]).join("").toUpperCase();
}

function TeacherDashboard({ teacherName, onLogout }) {
  const [activeSection, setActiveSection] = useState("dashboard");
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [posts, setPosts] = useState([]);
  const [comments, setComments] = useState([]);
  const [profile, setProfile] = useState(() => ({
    ...emptyProfile,
    ...getStoredUser(),
    name: getStoredUser().name || teacherName || "",
  }));
  const [profileForm, setProfileForm] = useState(() => ({
    ...emptyProfile,
    ...getStoredUser(),
    name: getStoredUser().name || teacherName || "",
  }));

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [formState, setFormState] = useState(emptyPostForm);
  const [editingPostId, setEditingPostId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingPost, setSavingPost] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadTeacherData();
  }, []);

  async function loadTeacherData() {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");

      const profileResult = await getCurrentUserProfile(token);
      if (profileResult.success) {
        const updatedProfile = { ...emptyProfile, ...profileResult.user };
        setProfile(updatedProfile);
        setProfileForm(updatedProfile);
        localStorage.setItem("user", JSON.stringify(profileResult.user));
      }

      const postsResult = await getTeacherPosts(token);
      if (postsResult.success) {
        setPosts(postsResult.posts || []);
      } else {
        setError(postsResult.error || "Failed to load class posts.");
      }

      const commentsResult = await getTeacherComments(token);
      if (commentsResult.success) {
        setComments(commentsResult.comments || []);
      }
    } catch (err) {
      setError("Network error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const stats = useMemo(
    () => ({
      totalPosts: posts.length,
      approvedPosts: posts.filter((post) => post.status === "approved").length,
      pendingPosts: posts.filter((post) => post.status === "pending").length,
      draftPosts: posts.filter((post) => post.status === "draft").length,
      totalComments: comments.length,
      totalViews: posts.reduce((sum, post) => sum + (post.views || 0), 0),
    }),
    [posts, comments]
  );

  const recentActivities = useMemo(() => {
    return posts.slice(0, 4).map((post) => {
      const icon = post.status === "approved" ? "✅" : post.status === "pending" ? "⏳" : "📝";
      const message =
        post.status === "approved"
          ? `"${post.title}" approved`
          : post.status === "pending"
          ? `"${post.title}" waiting for approval`
          : `"${post.title}" saved as draft`;

      return {
        id: post._id,
        icon,
        message,
        time: post.createdAt ? new Date(post.createdAt).toLocaleDateString() : "Recently",
      };
    });
  }, [posts]);

  const filteredPosts = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return posts.filter((post) => {
      const text = `${post.title} ${post.description} ${post.subject} ${post.location} ${post.grade}`.toLowerCase();
      const matchesText = !query || text.includes(query);
      const matchesStatus = filterStatus === "all" || post.status === filterStatus;
      return matchesText && matchesStatus;
    });
  }, [posts, searchTerm, filterStatus]);

  function handleFormChange(key, value) {
    setFormState((prev) => ({ ...prev, [key]: value }));
  }

  function handleProfileChange(key, value) {
    setProfileForm((prev) => ({ ...prev, [key]: value }));
  }

  function resetForm() {
    setFormState(emptyPostForm);
    setEditingPostId(null);
  }

  function startEditPost(post) {
    setEditingPostId(post._id);
    setFormState({
      title: post.title || "",
      description: post.description || "",
      subject: post.subject || "",
      grade: post.grade || "",
      type: post.type || "",
      location: post.location || "",
      schedule: post.schedule || "",
      duration: post.duration || "",
      fee: post.fee || "",
      contactInfo: post.contactInfo || "",
      image: null,
      imagePreview: post.image || null,
      status: post.status || "draft",
    });
    setActiveSection("create");
  }

  function handleImageChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormState((prev) => ({ ...prev, image: file, imagePreview: reader.result }));
    };
    reader.readAsDataURL(file);
  }

  async function savePost(status = "draft") {
    const requiredFields = ["title", "description", "subject", "grade", "location", "schedule", "duration", "fee", "contactInfo"];
    const hasMissingFields = requiredFields.some((field) => !String(formState[field] || "").trim());

    if (hasMissingFields) {
      alert("Please fill all required fields before saving.");
      return;
    }

    setSavingPost(true);
    const token = localStorage.getItem("token");
    const payload = {
      ...formState,
      image: formState.imagePreview || "",
      fee: Number(formState.fee || 0),
      status,
    };

    try {
      const result = editingPostId
        ? await updateClassPost(token, editingPostId, payload)
        : await createClassPost(token, payload);

      if (result.success) {
        await loadTeacherData();
        resetForm();
        setActiveSection("posts");
        alert(
          editingPostId
            ? "Post updated successfully."
            : status === "pending"
            ? "Post submitted for approval successfully."
            : "Post saved as draft successfully."
        );
      } else {
        alert("Error: " + result.error);
      }
    } catch (err) {
      alert("Network error occurred. Please try again.");
    } finally {
      setSavingPost(false);
    }
  }

  async function saveProfile(event) {
    event.preventDefault();
    if (!profileForm.name.trim()) {
      alert("Name is required.");
      return;
    }

    setSavingProfile(true);
    const token = localStorage.getItem("token");
    const result = await updateCurrentUserProfile(token, profileForm);

    if (result.success) {
      const updatedProfile = { ...emptyProfile, ...result.user };
      setProfile(updatedProfile);
      setProfileForm(updatedProfile);
      localStorage.setItem("user", JSON.stringify(result.user));
      alert("Profile updated successfully.");
      setActiveSection("dashboard");
    } else {
      alert("Error: " + result.error);
    }

    setSavingProfile(false);
  }

  async function removePost(id) {
    const confirmed = window.confirm("Are you sure you want to delete this class post?");
    if (!confirmed) return;

    const token = localStorage.getItem("token");
    const result = await deleteClassPost(token, id);

    if (result.success) {
      await loadTeacherData();
      alert("Post deleted successfully.");
    } else {
      alert("Error: " + result.error);
    }
  }

  async function submitForApproval(id) {
    const token = localStorage.getItem("token");
    const result = await submitPostForApproval(token, id);

    if (result.success) {
      await loadTeacherData();
      alert("Post submitted for approval.");
    } else {
      alert("Error: " + result.error);
    }
  }

  function getStatusLabel(status) {
    if (status === "approved") return "Approved";
    if (status === "pending") return "Pending";
    if (status === "rejected") return "Rejected";
    return "Draft";
  }

  function renderDashboard() {
    return (
      <>
        <section className="teacher-hero-card">
          <div className="teacher-hero-copy">
            <p className="teacher-greeting">Good Afternoon, {profile.name || teacherName || "Teacher"}!</p>
            <h1>Manage your A/L class posts with ease.</h1>
            <p>
              Create class advertisements, submit them for approval, and connect with students looking for trusted A/L teachers.
            </p>
            <p className="teacher-hero-sinhala">ඔබගේ පන්ති දැන්වීම් පහසුවෙන් කළමනාකරණය කර සිසුන් වෙත ළඟා වන්න.</p>
            <div className="teacher-hero-actions">
              <button className="teacher-btn teacher-btn-primary" onClick={() => { resetForm(); setActiveSection("create"); }}>
                Create Class Post
              </button>
              <button className="teacher-btn teacher-btn-outline" onClick={() => setActiveSection("posts")}>
                View My Posts
              </button>
            </div>
          </div>

          <div className="teacher-hero-visual" aria-hidden="true">
            <div className="teacher-visual-blob"></div>
            <div className="teacher-visual-screen">📚</div>
            <div className="teacher-visual-card">A/L Class Updates</div>
          </div>
        </section>

        <section className="teacher-stats-grid">
          <div className="teacher-stat-card"><span>📢</span><strong>{stats.totalPosts}</strong><p>Total Posts</p></div>
          <div className="teacher-stat-card"><span>✅</span><strong>{stats.approvedPosts}</strong><p>Approved</p></div>
          <div className="teacher-stat-card"><span>⏳</span><strong>{stats.pendingPosts}</strong><p>Pending</p></div>
          <div className="teacher-stat-card"><span>📝</span><strong>{stats.draftPosts}</strong><p>Drafts</p></div>
        </section>

        <section className="teacher-dashboard-grid">
          <div className="teacher-panel teacher-profile-summary-card">
            <div className="teacher-panel-header">
              <div>
                <p className="teacher-label">Profile Summary</p>
                <h2>Teacher Details</h2>
              </div>
              <button className="teacher-small-btn" onClick={() => setActiveSection("profile")}>Edit</button>
            </div>

            <div className="teacher-info-grid">
              <div><span>Name</span><strong>{profile.name || "Not added"}</strong></div>
              <div><span>Subject</span><strong>{profile.subject || "Not selected"}</strong></div>
              <div><span>Phone</span><strong>{profile.phone || "Not added"}</strong></div>
              <div><span>Teaching Mode</span><strong>{profile.teachingMode || "Not selected"}</strong></div>
              <div><span>Institute</span><strong>{profile.institute || "Not added"}</strong></div>
              <div><span>District</span><strong>{profile.district || "Not added"}</strong></div>
            </div>
          </div>

          <div className="teacher-panel">
            <div className="teacher-panel-header">
              <div>
                <p className="teacher-label">Recent Updates</p>
                <h2>Activity</h2>
              </div>
            </div>

            <div className="teacher-activity-list">
              {recentActivities.length === 0 ? (
                <p className="teacher-empty-text">No recent activity yet.</p>
              ) : (
                recentActivities.map((activity) => (
                  <div key={activity.id} className="teacher-activity-item">
                    <span>{activity.icon}</span>
                    <div><strong>{activity.message}</strong><p>{activity.time}</p></div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </>
    );
  }

  function renderPosts() {
    return (
      <section className="teacher-panel">
        <div className="teacher-panel-header">
          <div>
            <p className="teacher-label">Class Advertisements</p>
            <h2>My Class Posts</h2>
            <p>Search, filter, submit, or delete your class advertisements.</p>
          </div>

          <button className="teacher-btn teacher-btn-primary" onClick={() => { resetForm(); setActiveSection("create"); }}>
            Create New Post
          </button>
        </div>

        {loading ? (
          <LoadingSpinner message="Loading class posts..." />
        ) : error ? (
          <ErrorMessage title="Failed to load posts" message={error} onRetry={loadTeacherData} />
        ) : (
          <>
            <div className="teacher-toolbar">
              <input type="search" placeholder="Search by title, subject, or location..." value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} />
              <select value={filterStatus} onChange={(event) => setFilterStatus(event.target.value)}>
                <option value="all">All statuses</option>
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
                <option value="draft">Drafts</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            {filteredPosts.length === 0 ? (
              <EmptyState icon="📢" title="No class posts found" message="Create your first class advertisement to reach students." actionText="Create Post" onAction={() => { resetForm(); setActiveSection("create"); }} />
            ) : (
              <div className="teacher-posts-grid">
                {filteredPosts.map((post) => {
                  const postComments = comments.filter((comment) => comment.post?._id === post._id);
                  return (
                    <article key={post._id} className="teacher-post-card">
                      {(post.image || post.imagePreview) && <div className="teacher-post-image"><img src={post.image || post.imagePreview} alt={post.title} /></div>}

                      <div className="teacher-post-content">
                        <div className="teacher-post-header">
                          <h3>{post.title}</h3>
                          <span className={`teacher-status ${post.status}`}>{getStatusLabel(post.status)}</span>
                        </div>
                        <p className="teacher-post-subject">{post.subject} • {post.grade || "A/L"}</p>
                        <p className="teacher-post-location">📍 {post.location || "Location not added"}</p>
                        <p className="teacher-post-location">🗓️ {post.schedule || "Schedule not added"} • {post.duration || "Duration not added"}</p>
                        <p className="teacher-post-description">{post.description?.length > 120 ? `${post.description.substring(0, 120)}...` : post.description}</p>
                        <div className="teacher-post-meta"><span>Rs. {post.fee || "Not added"}</span><span>💬 {postComments.length}</span><span>👁️ {post.views || 0}</span></div>
                        <div className="teacher-post-actions">
                          {post.status === "draft" && <button onClick={() => submitForApproval(post._id)}>Submit for Approval</button>}
                          {post.status !== "approved" && <button onClick={() => startEditPost(post)}>Edit</button>}
                          <button className="danger" onClick={() => removePost(post._id)}>Delete</button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </>
        )}
      </section>
    );
  }

  function renderCreatePost() {
    return (
      <section className="teacher-panel teacher-form-panel">
        <div className="teacher-panel-header">
          <div>
            <p className="teacher-label">{editingPostId ? "Update Advertisement" : "Create Advertisement"}</p>
            <h2>{editingPostId ? "Edit Class Post" : "Create Class Post"}</h2>
            <p>Share your class details clearly so students can contact you easily.</p>
          </div>
          {editingPostId && <button className="teacher-small-btn muted" onClick={resetForm}>Cancel Edit</button>}
        </div>

        <div className="teacher-form">
          <div className="teacher-form-grid teacher-form-grid-wide">
            <label>Post Title *<input type="text" value={formState.title} onChange={(event) => handleFormChange("title", event.target.value)} placeholder="Example: 2026 A/L Physics Revision Class" /></label>
            <label>Subject *<select value={formState.subject} onChange={(event) => handleFormChange("subject", event.target.value)}><option value="">Select subject</option><option value="Physics">Physics</option><option value="Chemistry">Chemistry</option><option value="Biology">Biology</option><option value="Combined Maths">Combined Maths</option><option value="Accounting">Accounting</option><option value="Economics">Economics</option><option value="Business Studies">Business Studies</option><option value="ICT">ICT</option></select></label>
            <label>Grade / Exam Year *<input type="text" value={formState.grade} onChange={(event) => handleFormChange("grade", event.target.value)} placeholder="Example: 2026 A/L" /></label>
            <label>Class Type<select value={formState.type} onChange={(event) => handleFormChange("type", event.target.value)}><option value="">Select type</option><option value="Online">Online</option><option value="Physical">Physical</option><option value="Both">Both</option></select></label>
            <label>Location *<input type="text" value={formState.location} onChange={(event) => handleFormChange("location", event.target.value)} placeholder="Example: Online via Zoom / Colombo" /></label>
            <label>Schedule *<input type="text" value={formState.schedule} onChange={(event) => handleFormChange("schedule", event.target.value)} placeholder="Example: Every Sunday, 7.00 PM" /></label>
            <label>Duration *<input type="text" value={formState.duration} onChange={(event) => handleFormChange("duration", event.target.value)} placeholder="Example: 2 hours" /></label>
            <label>Monthly Fee (Rs.) *<input type="number" min="0" value={formState.fee} onChange={(event) => handleFormChange("fee", event.target.value)} placeholder="2500" /></label>
            <label className="full-width">Contact Info *<input type="text" value={formState.contactInfo} onChange={(event) => handleFormChange("contactInfo", event.target.value)} placeholder="WhatsApp: 071 234 5678" /></label>
            <label className="full-width">Post Image<input type="file" accept="image/*" onChange={handleImageChange} /></label>
            {formState.imagePreview && <div className="teacher-image-preview full-width"><img src={formState.imagePreview} alt="Preview" /></div>}
            <label className="full-width">Description *<textarea rows="5" value={formState.description} onChange={(event) => handleFormChange("description", event.target.value)} placeholder="Describe your class content, revision plan, and student benefits." /></label>
          </div>

          <div className="teacher-form-actions">
            <button className="teacher-btn teacher-btn-outline" type="button" onClick={resetForm}>Clear</button>
            {!editingPostId && <button className="teacher-btn teacher-btn-soft" type="button" disabled={savingPost} onClick={() => savePost("draft")}>{savingPost ? "Saving..." : "Save Draft"}</button>}
            <button className="teacher-btn teacher-btn-primary" type="button" disabled={savingPost} onClick={() => savePost(editingPostId ? formState.status : "pending")}>{savingPost ? "Saving..." : editingPostId ? "Update Post" : "Create Post"}</button>
          </div>
        </div>
      </section>
    );
  }

  function renderProfile() {
    return (
      <section className="teacher-panel teacher-form-panel">
        <div className="teacher-panel-header">
          <div>
            <p className="teacher-label">Account Details</p>
            <h2>Teacher Profile</h2>
            <p>Update your teacher details shown in the dashboard and class post area.</p>
          </div>
        </div>

        <form className="teacher-form" onSubmit={saveProfile}>
          <div className="teacher-form-grid teacher-form-grid-wide">
            <label>Full Name *<input type="text" value={profileForm.name} onChange={(event) => handleProfileChange("name", event.target.value)} /></label>
            <label>Email Address<input type="email" value={profileForm.email} disabled /></label>
            <label>Phone<input type="tel" value={profileForm.phone} onChange={(event) => handleProfileChange("phone", event.target.value)} placeholder="07XXXXXXXX" /></label>
            <label>Main Subject<select value={profileForm.subject} onChange={(event) => handleProfileChange("subject", event.target.value)}><option value="">Choose subject</option><option value="Combined Maths">Combined Maths</option><option value="Biology">Biology</option><option value="Physics">Physics</option><option value="Chemistry">Chemistry</option><option value="Accounting">Accounting</option><option value="Economics">Economics</option><option value="ICT">ICT</option><option value="Business Studies">Business Studies</option></select></label>
            <label>Teaching Mode<select value={profileForm.teachingMode} onChange={(event) => handleProfileChange("teachingMode", event.target.value)}><option value="">Choose mode</option><option value="Online">Online</option><option value="Physical">Physical</option><option value="Both">Both</option></select></label>
            <label>Institute / Class Name<input type="text" value={profileForm.institute} onChange={(event) => handleProfileChange("institute", event.target.value)} placeholder="Where do you teach?" /></label>
            <label>District<input type="text" value={profileForm.district} onChange={(event) => handleProfileChange("district", event.target.value)} placeholder="Example: Colombo" /></label>
            <label>Experience<input type="text" value={profileForm.experience} onChange={(event) => handleProfileChange("experience", event.target.value)} placeholder="Example: 5 years" /></label>
            <label className="full-width">Qualifications<input type="text" value={profileForm.qualifications} onChange={(event) => handleProfileChange("qualifications", event.target.value)} placeholder="Example: BSc, MSc, A/L Tutor" /></label>
            <label className="full-width">Bio<textarea rows="4" value={profileForm.bio} onChange={(event) => handleProfileChange("bio", event.target.value)} placeholder="Short introduction about your teaching approach." /></label>
          </div>

          <div className="teacher-form-actions">
            <button className="teacher-btn teacher-btn-outline" type="button" onClick={() => setProfileForm(profile)}>Reset</button>
            <button className="teacher-btn teacher-btn-primary" type="submit" disabled={savingProfile}>{savingProfile ? "Saving..." : "Update Profile"}</button>
          </div>
        </form>
      </section>
    );
  }

  function renderActiveSection() {
    if (activeSection === "posts") return renderPosts();
    if (activeSection === "create") return renderCreatePost();
    if (activeSection === "profile") return renderProfile();
    return renderDashboard();
  }

  return (
    <div className="teacher-dashboard-wrapper">
      <header className="teacher-topbar">
        <div className="teacher-brand">
          <span className="teacher-logo"><img src="/logo1.png" alt="Learning Hub" /></span>
          <div><strong>Learning Hub</strong><small>Teacher Workspace</small></div>
        </div>

        <nav className="teacher-nav">
          {menuItems.map((item) => (
            <button key={item.id} className={activeSection === item.id ? "active" : ""} onClick={() => { if (item.id === "create") resetForm(); setActiveSection(item.id); }}>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="teacher-user-area">
          <button className="teacher-notification" title="Pending posts" onClick={() => setActiveSection("posts")}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M15 17H9m9-1.8V11a6 6 0 0 0-4.5-5.8V4a1.5 1.5 0 0 0-3 0v1.2A6 6 0 0 0 6 11v4.2L4.8 17h14.4L18 15.2Z" />
              <path d="M10 20a2 2 0 0 0 4 0" />
            </svg>
            {stats.pendingPosts > 0 && <span>{stats.pendingPosts}</span>}
          </button>

          <div className="teacher-profile-menu-wrap">
            <button className="teacher-profile-pill" onClick={() => setProfileMenuOpen((open) => !open)}>
              <span className="teacher-avatar">{getInitials(profile.name || teacherName)}</span>
              <span><strong>{profile.name || teacherName || "Teacher"}</strong><small>{profile.subject || "Teacher"}</small></span>
              <span className="teacher-profile-arrow">⌄</span>
            </button>

            {profileMenuOpen && (
              <div className="teacher-profile-dropdown">
                <button onClick={() => { setActiveSection("profile"); setProfileMenuOpen(false); }}>View Profile</button>
                <button className="logout-option" onClick={onLogout}>Logout</button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="teacher-content">{renderActiveSection()}</main>

      <footer className="teacher-footer">
        <div className="teacher-footer-inner">
          <div className="teacher-footer-brand-block">
            <div className="teacher-footer-logo-row">
              <img src="/logo1.png" alt="Learning Hub" />
              <strong>Learning Hub</strong>
            </div>
            <p>AI-powered learning platform for G.C.E. Advanced Level students in Sri Lanka.</p>
            <span className="teacher-footer-sinhala">අදම A/L ගමන ආරම්භ කරන්න</span>
          </div>

          <div className="teacher-footer-col">
            <h4>Quick Links</h4>
            <button onClick={() => setActiveSection("dashboard")}>Home</button>
            <button onClick={() => setActiveSection("posts")}>Class Posts</button>
            <button onClick={() => setActiveSection("profile")}>Profile</button>
          </div>

          <div className="teacher-footer-col">
            <h4>Teacher Tools</h4>
            <button onClick={() => { resetForm(); setActiveSection("create"); }}>Create Post</button>
            <button onClick={() => setActiveSection("posts")}>Approvals</button>
            <button onClick={() => setActiveSection("profile")}>Account</button>
          </div>

          <div className="teacher-footer-col">
            <h4>Contact</h4>
            <p>info@learninghub.lk</p>
            <p>+94 11 234 5678</p>
          </div>
        </div>
        <div className="teacher-footer-bottom">© 2026 Learning Hub. All rights reserved.</div>
      </footer>
    </div>
  );
}

export default TeacherDashboard;
