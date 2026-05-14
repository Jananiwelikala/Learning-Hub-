import { useMemo, useState, useEffect } from "react";
import {
  getTeacherPosts,
  createClassPost,
  deleteClassPost,
  submitPostForApproval,
  getTeacherComments,
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
  type: "",
  grade: "",
  district: "",
  schedule: "",
  duration: "",
  fee: "",
  contactInfo: "",
  image: null,
  imagePreview: null,
  status: "draft",
};

function TeacherDashboard({ teacherName, onLogout }) {
  const [activeSection, setActiveSection] = useState("dashboard");
  const [posts, setPosts] = useState([]);
  const [comments, setComments] = useState([]);
  const [profile, setProfile] = useState({
    name: teacherName || "",
    email: "",
    phone: "",
    subject: "",
    qualifications: "",
    experience: "",
    district: "",
    bio: "",
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [formState, setFormState] = useState(emptyPostForm);
  const [loading, setLoading] = useState(true);
  const [savingPost, setSavingPost] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadTeacherData();
  }, []);

  async function loadTeacherData() {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");

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
      const icon =
        post.status === "approved" ? "✅" : post.status === "pending" ? "⏳" : "📝";

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
      const text = `${post.title} ${post.description} ${post.subject} ${post.district}`.toLowerCase();
      const matchesText = !query || text.includes(query);
      const matchesStatus = filterStatus === "all" || post.status === filterStatus;

      return matchesText && matchesStatus;
    });
  }, [posts, searchTerm, filterStatus]);

  function handleFormChange(key, value) {
    setFormState((prev) => ({ ...prev, [key]: value }));
  }

  function resetForm() {
    setFormState(emptyPostForm);
  }

  function handleImageChange(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onloadend = () => {
      setFormState((prev) => ({
        ...prev,
        image: file,
        imagePreview: reader.result,
      }));
    };

    reader.readAsDataURL(file);
  }

  async function savePost(status = "draft") {
    if (
      !formState.title ||
      !formState.description ||
      !formState.subject ||
      !formState.type ||
      !formState.grade ||
      !formState.district ||
      !formState.schedule ||
      !formState.duration ||
      !formState.contactInfo
    ) {
      alert("Please fill all required fields before saving.");
      return;
    }

    setSavingPost(true);

    const token = localStorage.getItem("token");
    const payload = {
      title: formState.title.trim(),
      description: formState.description.trim(),
      subject: formState.subject,
      grade: formState.grade,
      location: formState.type === "Online"
        ? `Online - ${formState.district.trim()}`
        : `${formState.type} - ${formState.district.trim()}`,
      schedule: formState.schedule.trim(),
      duration: formState.duration.trim(),
      fee: Number(formState.fee || 0),
      contactInfo: formState.contactInfo.trim(),
      status,
    };

    try {
      const result = await createClassPost(token, payload);

      if (result.success) {
        await loadTeacherData();
        resetForm();
        setActiveSection("posts");

        alert(
          status === "pending"
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
    return "Draft";
  }

  function renderDashboard() {
    return (
      <>
        <section className="teacher-hero-card">
          <div>
            <p className="teacher-greeting">Good Afternoon, {teacherName || "Teacher"}!</p>
            <h1>Manage your A/L class posts with ease.</h1>
            <p>
              Create class advertisements, submit them for approval, and connect with
              students looking for trusted A/L teachers.
            </p>
            <p className="teacher-hero-sinhala">
              ඔබගේ පන්ති දැන්වීම් පහසුවෙන් කළමනාකරණය කර සිසුන් වෙත ළඟා වන්න.
            </p>

            <div className="teacher-hero-actions">
              <button className="teacher-btn teacher-btn-primary" onClick={() => setActiveSection("create")}>
                Create Class Post
              </button>
              <button className="teacher-btn teacher-btn-outline" onClick={() => setActiveSection("posts")}>
                View My Posts
              </button>
            </div>
          </div>

          <div className="teacher-hero-count">
            <strong>{stats.approvedPosts}</strong>
            <span>Approved Posts</span>
          </div>
        </section>

        <section className="teacher-stats-grid">
          <div className="teacher-stat-card">
            <span>📢</span>
            <strong>{stats.totalPosts}</strong>
            <p>Total Posts</p>
          </div>

          <div className="teacher-stat-card">
            <span>✅</span>
            <strong>{stats.approvedPosts}</strong>
            <p>Approved</p>
          </div>

          <div className="teacher-stat-card">
            <span>⏳</span>
            <strong>{stats.pendingPosts}</strong>
            <p>Pending</p>
          </div>

          <div className="teacher-stat-card">
            <span>📝</span>
            <strong>{stats.draftPosts}</strong>
            <p>Drafts</p>
          </div>
        </section>

        <section className="teacher-dashboard-grid">
          <div className="teacher-panel">
            <div className="teacher-panel-header">
              <div>
                <p className="teacher-label">Profile Summary</p>
                <h2>Teacher Details</h2>
              </div>
              <button className="teacher-small-btn" onClick={() => setActiveSection("profile")}>
                Edit
              </button>
            </div>

            <div className="teacher-info-grid">
              <div>
                <span>Name</span>
                <strong>{profile.name || "Not added"}</strong>
              </div>
              <div>
                <span>Subject</span>
                <strong>{profile.subject || "Not selected"}</strong>
              </div>
              <div>
                <span>Phone</span>
                <strong>{profile.phone || "Not added"}</strong>
              </div>
              <div>
                <span>District</span>
                <strong>{profile.district || "Not added"}</strong>
              </div>
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
                    <div>
                      <strong>{activity.message}</strong>
                      <p>{activity.time}</p>
                    </div>
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

          <button className="teacher-btn teacher-btn-primary" onClick={() => setActiveSection("create")}>
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
              <input
                type="search"
                placeholder="Search by title, subject, or district..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />

              <select
                value={filterStatus}
                onChange={(event) => setFilterStatus(event.target.value)}
              >
                <option value="all">All statuses</option>
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
                <option value="draft">Drafts</option>
              </select>
            </div>

            {filteredPosts.length === 0 ? (
              <EmptyState
                icon="📢"
                title="No class posts found"
                message="Create your first class advertisement to reach students."
                actionText="Create Post"
                onAction={() => setActiveSection("create")}
              />
            ) : (
              <div className="teacher-posts-grid">
                {filteredPosts.map((post) => {
                  const postComments = comments.filter((comment) => comment.post?._id === post._id);

                  return (
                    <article key={post._id} className="teacher-post-card">
                      {post.image && (
                        <div className="teacher-post-image">
                          <img src={post.image} alt={post.title} />
                        </div>
                      )}

                      <div className="teacher-post-content">
                        <div className="teacher-post-header">
                          <h3>{post.title}</h3>
                          <span className={`teacher-status ${post.status}`}>
                            {getStatusLabel(post.status)}
                          </span>
                        </div>

                        <p className="teacher-post-subject">{post.subject}</p>
                        <p className="teacher-post-location">
                          {post.type || "Class"} • {post.district || "Location not added"}
                        </p>

                        <p className="teacher-post-description">
                          {post.description?.length > 120
                            ? `${post.description.substring(0, 120)}...`
                            : post.description}
                        </p>

                        <div className="teacher-post-meta">
                          <span>Rs. {post.fee || "Not added"}</span>
                          <span>💬 {postComments.length}</span>
                          <span>👁️ {post.views || 0}</span>
                        </div>

                        <div className="teacher-post-actions">
                          {post.status === "draft" && (
                            <button onClick={() => submitForApproval(post._id)}>
                              Submit
                            </button>
                          )}

                          <button onClick={() => setActiveSection("create")}>
                            Edit
                          </button>

                          <button className="danger" onClick={() => removePost(post._id)}>
                            Delete
                          </button>
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
      <section className="teacher-panel">
        <div className="teacher-panel-header">
          <div>
            <p className="teacher-label">Create Advertisement</p>
            <h2>Create Class Post</h2>
            <p>Share your class details clearly so students can contact you easily.</p>
          </div>
        </div>

        <div className="teacher-form">
          <div className="teacher-form-grid">
            <label>
              Post Title *
              <input
                type="text"
                value={formState.title}
                onChange={(event) => handleFormChange("title", event.target.value)}
                placeholder="Example: 2026 A/L Physics Revision Class"
              />
            </label>

            <label>
              Subject *
              <select
                value={formState.subject}
                onChange={(event) => handleFormChange("subject", event.target.value)}
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
              Class Type *
              <select
                value={formState.type}
                onChange={(event) => handleFormChange("type", event.target.value)}
              >
                <option value="">Select type</option>
                <option value="Online">Online</option>
                <option value="Physical">Physical</option>
                <option value="Both">Both</option>
              </select>
            </label>

            <label>
              Grade / Exam Year *
              <input
                type="text"
                value={formState.grade}
                onChange={(event) => handleFormChange("grade", event.target.value)}
                placeholder="Example: 2026 A/L, 2027 A/L"
              />
            </label>

            <label>
              District / City *
              <input
                type="text"
                value={formState.district}
                onChange={(event) => handleFormChange("district", event.target.value)}
                placeholder="Example: Colombo, Gampaha, Kandy"
              />
            </label>

            <label>
              Schedule *
              <input
                type="text"
                value={formState.schedule}
                onChange={(event) => handleFormChange("schedule", event.target.value)}
                placeholder="Example: Sunday 8.00 AM - 10.00 AM"
              />
            </label>

            <label>
              Duration *
              <input
                type="text"
                value={formState.duration}
                onChange={(event) => handleFormChange("duration", event.target.value)}
                placeholder="Example: 2 hours / 6 months course"
              />
            </label>

            <label>
              Monthly Fee (Rs.)
              <input
                type="number"
                min="0"
                value={formState.fee}
                onChange={(event) => handleFormChange("fee", event.target.value)}
                placeholder="Example: 2500"
              />
            </label>

            <label>
              Contact Information *
              <input
                type="tel"
                value={formState.contactInfo}
                onChange={(event) => handleFormChange("contactInfo", event.target.value)}
                placeholder="Phone / WhatsApp number"
              />
            </label>
          </div>

          <label>
            Description *
            <textarea
              value={formState.description}
              onChange={(event) => handleFormChange("description", event.target.value)}
              placeholder="Describe your class schedule, teaching method, target students, and what students will learn..."
              rows={5}
            />
          </label>

          <label>
            Post Image
            {formState.imagePreview && (
              <div className="teacher-image-preview">
                <img src={formState.imagePreview} alt="Preview" />
              </div>
            )}
            <input type="file" accept="image/*" onChange={handleImageChange} />
          </label>

          <div className="teacher-form-actions">
            <button
              className="teacher-btn teacher-btn-outline"
              onClick={() => savePost("draft")}
              disabled={savingPost}
            >
              {savingPost ? "Saving..." : "Save as Draft"}
            </button>

            <button
              className="teacher-btn teacher-btn-primary"
              onClick={() => savePost("pending")}
              disabled={savingPost}
            >
              {savingPost ? "Submitting..." : "Submit for Approval"}
            </button>
          </div>
        </div>
      </section>
    );
  }

  function renderProfile() {
    return (
      <section className="teacher-panel">
        <div className="teacher-panel-header">
          <div>
            <p className="teacher-label">Teacher Profile</p>
            <h2>My Profile</h2>
            <p>Update your teacher information shown to students.</p>
          </div>
        </div>

        <div className="teacher-form">
          <div className="teacher-form-grid">
            <label>
              Full Name
              <input
                type="text"
                value={profile.name}
                onChange={(event) =>
                  setProfile((prev) => ({ ...prev, name: event.target.value }))
                }
              />
            </label>

            <label>
              Email
              <input
                type="email"
                value={profile.email}
                onChange={(event) =>
                  setProfile((prev) => ({ ...prev, email: event.target.value }))
                }
              />
            </label>

            <label>
              Phone
              <input
                type="tel"
                value={profile.phone}
                onChange={(event) =>
                  setProfile((prev) => ({ ...prev, phone: event.target.value }))
                }
              />
            </label>

            <label>
              Main Subject
              <select
                value={profile.subject}
                onChange={(event) =>
                  setProfile((prev) => ({ ...prev, subject: event.target.value }))
                }
              >
                <option value="">Select subject</option>
                <option value="Physics">Physics</option>
                <option value="Chemistry">Chemistry</option>
                <option value="Biology">Biology</option>
                <option value="Combined Maths">Combined Maths</option>
                <option value="Accounting">Accounting</option>
                <option value="Economics">Economics</option>
                <option value="Business Studies">Business Studies</option>
              </select>
            </label>

            <label>
              Qualifications
              <input
                type="text"
                value={profile.qualifications}
                onChange={(event) =>
                  setProfile((prev) => ({ ...prev, qualifications: event.target.value }))
                }
                placeholder="Example: BSc, MSc, Diploma..."
              />
            </label>

            <label>
              Years of Experience
              <input
                type="number"
                value={profile.experience}
                onChange={(event) =>
                  setProfile((prev) => ({ ...prev, experience: event.target.value }))
                }
              />
            </label>

            <label>
              District
              <input
                type="text"
                value={profile.district}
                onChange={(event) =>
                  setProfile((prev) => ({ ...prev, district: event.target.value }))
                }
              />
            </label>
          </div>

          <label>
            Bio
            <textarea
              value={profile.bio}
              onChange={(event) =>
                setProfile((prev) => ({ ...prev, bio: event.target.value }))
              }
              rows={4}
              placeholder="Write a short description about your teaching experience..."
            />
          </label>

          <div className="teacher-form-actions">
            <button className="teacher-btn teacher-btn-primary" onClick={() => alert("Profile saved locally.")}>
              Save Profile
            </button>
          </div>
        </div>
      </section>
    );
  }

  function renderSectionContent() {
    if (activeSection === "dashboard") return renderDashboard();
    if (activeSection === "posts") return renderPosts();
    if (activeSection === "create") return renderCreatePost();
    if (activeSection === "profile") return renderProfile();

    return null;
  }

  return (
    <div className="teacher-dashboard-wrapper">
      <header className="teacher-topbar">
        <div className="teacher-brand">
          <span className="teacher-logo">
            <img src="/logo1.png" alt="Learning Hub logo" />
          </span>
          <div>
            <strong>Learning Hub</strong>
            <small>A/L Platform</small>
          </div>
        </div>

        <nav className="teacher-nav">
          {menuItems.map((item) => (
            <button
              key={item.id}
              className={activeSection === item.id ? "active" : ""}
              onClick={() => setActiveSection(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="teacher-user-area">
          <button className="teacher-bell">
            🔔
            {stats.pendingPosts > 0 && <span>{stats.pendingPosts}</span>}
          </button>

          <div className="teacher-profile-pill">
            <div className="teacher-avatar">
              {(teacherName || "T").charAt(0).toUpperCase()}
            </div>
            <div>
              <strong>{teacherName || "Teacher"}</strong>
              <small>Teacher Account</small>
            </div>
          </div>

          <button className="teacher-logout" onClick={onLogout}>
            Logout
          </button>
        </div>
      </header>

      <main className="teacher-content">{renderSectionContent()}</main>
    </div>
  );
}

export default TeacherDashboard;