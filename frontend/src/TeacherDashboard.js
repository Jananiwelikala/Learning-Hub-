import { useMemo, useState, useEffect } from "react";
import {
  getTeacherPosts,
  createClassPost,
  deleteClassPost,
  submitPostForApproval,
  getTeacherComments
} from "./api";
import LoadingSpinner from "./components/LoadingSpinner";
import ErrorMessage from "./components/ErrorMessage";
import EmptyState from "./components/EmptyState";

const menuItems = [
  { id: "dashboard", label: "Dashboard", sinhala: " Dashboard" },
  { id: "posts", label: "My Class Posts", sinhala: "මගේ පන්ති පිටපත්" },
  { id: "create", label: "Create Post", sinhala: "නව පිටපත සාදන්න" },
  { id: "profile", label: "My Profile", sinhala: "මගේ පෙර‍ෙයෝජනාව" },
];

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
    profilePhoto: null
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [formState, setFormState] = useState({
    title: "",
    description: "",
    subject: "",
    type: "",
    district: "",
    fee: "",
    contactInfo: "",
    image: null,
    imagePreview: null,
    status: "draft"
  });
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
    approvedPosts: posts.filter(p => p.status === "approved").length,
    pendingPosts: posts.filter(p => p.status === "pending").length,
    draftPosts: posts.filter(p => p.status === "draft").length,
    totalComments: comments.length,
    totalViews: posts.reduce((sum, p) => sum + (p.views || 0), 0)
  }), [posts, comments]);

  const recentActivities = useMemo(() => {
    const activities = [];

    // Add recent posts
    posts.slice(0, 3).forEach(post => {
      activities.push({
        id: `post-${post._id}`,
        type: post.status === "approved" ? "approval" : post.status === "pending" ? "pending" : "draft",
        message: post.status === "approved" ?
          `✅ "${post.title}" approved` :
          post.status === "pending" ?
          `⏳ "${post.title}" pending` :
          `📝 "${post.title}" draft`,
        time: new Date(post.createdAt).toLocaleDateString()
      });
    });

    return activities.slice(0, 5);
  }, [posts]);

  function resetForm() {
    setFormState({
      title: "",
      description: "",
      subject: "",
      type: "",
      district: "",
      fee: "",
      contactInfo: "",
      image: null,
      imagePreview: null,
      status: "draft"
    });
  }

  function handleFormChange(key, value) {
    setFormState((prev) => ({ ...prev, [key]: value }));
  }

  function handleImageChange(e) {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormState((prev) => ({
          ...prev,
          image: file,
          imagePreview: reader.result
        }));
      };
      reader.readAsDataURL(file);
    }
  }

  async function savePost() {
    if (!formState.title || !formState.description || !formState.subject) {
      alert("Please fill in all required fields");
      return;
    }

    const token = localStorage.getItem("token");

    try {
      const result = await createClassPost(token, formState);

      if (result.success) {
        await loadTeacherData();
        resetForm();
        setActiveSection("posts");
        alert("Post created successfully!");
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
      await loadTeacherData();
      alert("Post deleted successfully!");
    } else {
      alert("Error: " + result.error);
    }
  }

  async function submitForApproval(id) {
    const token = localStorage.getItem("token");
    const result = await submitPostForApproval(token, id);

    if (result.success) {
      await loadTeacherData();
      alert("Post submitted for approval!");
    } else {
      alert("Error: " + result.error);
    }
  }

  function filterPosts() {
    const query = searchTerm.trim().toLowerCase();
    return posts.filter((post) => {
      const text = `${post.title} ${post.description} ${post.subject}`.toLowerCase();
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
                <p className="small-label">வணக்கம், / ආයුබෝවන්</p>
                <h2>{teacherName}</h2>
                <p className="muted-text">Manage your class posts and connect with students / සිසුන්ට සම්බන්ධ වන්න</p>
              </div>
              <div className="teacher-welcome-actions">
                <button className="btn solid" onClick={() => setActiveSection("create")}>
                  ➕ Create New Post / නව පිටපත සාදන්න
                </button>
                <button className="btn outline" onClick={() => setActiveSection("posts")}>
                  📋 View My Posts / මගේ පිටපත බලන්න
                </button>
              </div>
            </div>

            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">📋</div>
                <div>
                  <span className="stat-number">{stats.totalPosts}</span>
                  <span className="stat-label">Total Posts / සම්පූර්ණ පිටපත්</span>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">👁️</div>
                <div>
                  <span className="stat-number">{stats.totalViews}</span>
                  <span className="stat-label">Total Views / ඉවුන්</span>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">💬</div>
                <div>
                  <span className="stat-number">{stats.totalComments}</span>
                  <span className="stat-label">Comments / අදහස්</span>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">✅</div>
                <div>
                  <span className="stat-number">{stats.approvedPosts}</span>
                  <span className="stat-label">Approved / අනුමත</span>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">⏳</div>
                <div>
                  <span className="stat-number">{stats.pendingPosts}</span>
                  <span className="stat-label">Pending / රැඳී</span>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">📝</div>
                <div>
                  <span className="stat-number">{stats.draftPosts}</span>
                  <span className="stat-label">Drafts / කෙටුම්</span>
                </div>
              </div>
            </div>

            <div className="dashboard-sections">
              <div className="teacher-profile-card">
                <h3>My Profile / මගේ පෙර‍ෙයෝජනාව</h3>
                <div className="profile-info-grid">
                  <div className="info-item">
                    <label>Full Name</label>
                    <p>{profile.name}</p>
                  </div>
                  <div className="info-item">
                    <label>Email</label>
                    <p>{profile.email}</p>
                  </div>
                  <div className="info-item">
                    <label>Phone</label>
                    <p>{profile.phone}</p>
                  </div>
                  <div className="info-item">
                    <label>Main Subject</label>
                    <p>{profile.subject}</p>
                  </div>
                  <div className="info-item">
                    <label>Experience</label>
                    <p>{profile.experience} years</p>
                  </div>
                  <div className="info-item">
                    <label>District</label>
                    <p>{profile.district}</p>
                  </div>
                </div>
                {profile.bio && (
                  <div className="bio-section">
                    <label>Bio</label>
                    <p>{profile.bio}</p>
                  </div>
                )}
                <button className="btn outline" onClick={() => setActiveSection("profile")}>
                  Edit Profile / සංස්කරණය කරන්න
                </button>
              </div>

              <div className="activity-section">
                <h3>Recent Activity / මෑත ක්‍රියාකාරකම්</h3>
                <div className="activity-list">
                  {recentActivities.length === 0 ? (
                    <p className="empty-message">No recent activity / මෑත ක්‍රියාකාරකම් නොමැත</p>
                  ) : (
                    recentActivities.map((activity) => (
                      <div key={activity.id} className="activity-item">
                        <div className="activity-content">
                          <p>{activity.message}</p>
                          <span className="activity-time">{activity.time}</span>
                        </div>
                      </div>
                    ))
                  )}
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
                <h3>My Class Posts / මගේ පන්ති පිටපත්</h3>
                <p>Manage your class advertisements / ඔබේ පන්ති දැන්වීම් කළමනාකරණය කරන්න</p>
              </div>
              <button className="btn solid" onClick={() => setActiveSection("create")}>
                ➕ Create New Post
              </button>
            </div>

            {loading ? (
              <LoadingSpinner message="Loading posts..." />
            ) : error ? (
              <ErrorMessage
                title="Failed to load posts"
                message={error}
                onRetry={loadTeacherData}
              />
            ) : filteredPosts.length === 0 ? (
              <EmptyState
                icon="📝"
                title="No posts yet / පිටපත් නොමැත"
                message="Create your first post to advertise your classes / ඔබේ පන්තිවලට දැන්වීම් දීමට පළමු පිටපත සාදන්න"
                actionText="Create First Post / නිර්මාණ කරන්න"
                onAction={() => setActiveSection("create")}
              />
            ) : (
              <>
                <div className="table-toolbar">
                  <input
                    type="search"
                    placeholder="Search posts / පිටපත් සොයන්න"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                    <option value="all">All statuses</option>
                    <option value="approved">Approved / අනුමත</option>
                    <option value="pending">Pending / රැඳී</option>
                    <option value="draft">Drafts / කෙටුම්</option>
                  </select>
                </div>

                <div className="posts-grid">
                  {filteredPosts.map((post) => (
                    <div key={post._id} className={`post-card ${post.status}`}>
                      {post.image && (
                        <div className="post-image">
                          <img src={post.image} alt={post.title} />
                        </div>
                      )}
                      <div className="post-content">
                        <div className="post-header">
                          <h4>{post.title}</h4>
                          <span className={`status-badge ${post.status}`}>{post.status}</span>
                        </div>
                        <p className="post-subject">{post.subject}</p>
                        <p className="post-district">{post.type} • {post.district}</p>
                        <p className="post-description">{post.description.substring(0, 100)}...</p>
                        <p className="post-fee">Fee: Rs. {post.fee}</p>
                        
                        {comments.filter(c => c.post?._id === post._id).length > 0 && (
                          <p className="post-comments">
                            💬 {comments.filter(c => c.post?._id === post._id).length} comments
                          </p>
                        )}

                        <div className="post-actions">
                          <button className="action-btn" onClick={() => setActiveSection("create")}>
                            ✏️ Edit
                          </button>
                          {post.status === "draft" && (
                            <button className="action-btn success" onClick={() => submitForApproval(post._id)}>
                              📤 Submit
                            </button>
                          )}
                          <button className="action-btn danger" onClick={() => removePost(post._id)}>
                            🗑️ Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
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
                <h3>Create Class Post / පන්ති පිටපත සාදන්න</h3>
                <p>Share your class details with students / සිසුන්ට ඔබේ පන්ති විස්තර බෙදා ගන්න</p>
              </div>
            </div>
            <div className="create-form">
              <div className="form-grid">
                <label>
                  Post Title * / පිටපතේ සිරැසි
                  <input
                    type="text"
                    value={formState.title}
                    onChange={(e) => handleFormChange("title", e.target.value)}
                    placeholder="e.g., Physics A/L Revision Classes"
                    required
                  />
                </label>
                <label>
                  Subject * / විෂයය
                  <select
                    value={formState.subject}
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
                  Class Type * / පන්ති වර්ගය
                  <select
                    value={formState.type}
                    onChange={(e) => handleFormChange("type", e.target.value)}
                    required
                  >
                    <option value="">Select type</option>
                    <option value="Online">Online</option>
                    <option value="Physical">Physical / ශారීරික</option>
                    <option value="Both">Both / දෙකම</option>
                  </select>
                </label>
                <label>
                  District / City * / දිස්ත්‍රිකය
                  <input
                    type="text"
                    value={formState.district}
                    onChange={(e) => handleFormChange("district", e.target.value)}
                    placeholder="e.g., Colombo, Kandy"
                    required
                  />
                </label>
                <label>
                  Monthly Fee (Rs.) / මාසික ගාස්තුව
                  <input
                    type="number"
                    value={formState.fee}
                    onChange={(e) => handleFormChange("fee", e.target.value)}
                    placeholder="e.g., 2500"
                    min="0"
                  />
                </label>
                <label>
                  Contact Information * / සම්බන්ධතා තොරතුරු
                  <input
                    type="tel"
                    value={formState.contactInfo}
                    onChange={(e) => handleFormChange("contactInfo", e.target.value)}
                    placeholder="Phone/WhatsApp"
                    required
                  />
                </label>
              </div>

              <label>
                Description * / විස්තරණය
                <textarea
                  value={formState.description}
                  onChange={(e) => handleFormChange("description", e.target.value)}
                  placeholder="Describe your classes, teaching methodology, and what students will learn..."
                  rows={4}
                  required
                />
              </label>

              <label>
                Add Post Image / පින්තූරය එක් කරන්න
                {formState.imagePreview && (
                  <div className="image-preview">
                    <img src={formState.imagePreview} alt="preview" />
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                />
              </label>

              <div className="form-actions">
                <button 
                  className="btn outline" 
                  onClick={() => {
                    handleFormChange("status", "draft");
                    savePost();
                  }}
                >
                  💾 Save as Draft / කෙටුම ලෙස සුරකින්න
                </button>
                <button 
                  className="btn solid" 
                  onClick={() => {
                    handleFormChange("status", "pending");
                    savePost();
                  }}
                >
                  📤 Submit for Approval / අනුමතිය සඳහා ඉදිරිපත් කරන්න
                </button>
              </div>
            </div>
          </div>
        );

      case "profile":
        return (
          <div className="teacher-section-panel">
            <div className="section-header-row">
              <div>
                <h3>My Profile / මගේ පෙර‍ෙයෝජනාව</h3>
                <p>Update your profile information / ඔබේ පෙර‍ෙයෝජනා තොරතුරු යාවත්කාලීන කරන්න</p>
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
                    onChange={(e) => setProfile(prev => ({ ...prev, qualifications: e.target.value }))}
                  />
                </label>
                <label>
                  Years of Experience
                  <input
                    type="number"
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
              </div>
              <label>
                Bio / ජීවිතකරණ
                <textarea
                  value={profile.bio}
                  onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
                  rows={3}
                />
              </label>
              <div className="form-actions">
                <button className="btn solid">Save Profile / සුරකින්න</button>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  }

  return (
    <div className="teacher-dashboard-wrapper">
      <header className="teacher-topbar">
        <div className="topbar-left">
          <span className="brand-mark brand-logo-shell">
            <img src="/logo1.png" alt="Learning Hub logo" className="brand-logo-image" />
          </span>
          <span className="brand-name">Learning Hub</span>
        </div>

        <nav className="teacher-nav">
          {menuItems.map((item) => (
            <button
              key={item.id}
              className={`nav-link ${activeSection === item.id ? "active" : ""}`}
              onClick={() => setActiveSection(item.id)}
              title={item.sinhala}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="topbar-right">
          <button className="notification-btn">🔔</button>
          <div className="profile-menu">
            <span className="teacher-name">{teacherName}</span>
            <button className="profile-btn">👤</button>
            <div className="profile-dropdown">
              <button onClick={() => setActiveSection("profile")}>My Profile</button>
              <button onClick={onLogout}>Logout / ඉවත් වන්න</button>
            </div>
          </div>
        </div>
      </header>

      <main className="teacher-content">{renderSectionContent()}</main>
    </div>
  );
}

export default TeacherDashboard;
