import { useEffect, useState } from "react";
import "./App.css";
import Login from "./Login";
import Home from "./pages/landing/LandingPage";
import { SubjectsPage, AboutUs } from "./pages/landing/LandingPage";
import Register from "./Register";
import StudentDashboard from "./StudentDashboard";
import SubjectDetail from "./SubjectDetail";
import LessonDetail from "./LessonDetail";
import RegisterRoleModal from "./RegisterRoleModal";
import AdminPanel from "./AdminPanel";
import TeacherDashboard from "./TeacherDashboard";
import { getCurrentUserProfile } from "./api";

const DASHBOARD_SCREENS = ["admin", "teacher", "dashboard"];

function normalizeRole(role) {
  return String(role || "").trim().toLowerCase();
}

function normalizeUser(user) {
  if (!user) return null;
  return { ...user, role: normalizeRole(user.role) };
}

function getDashboardScreen(role, token) {
  if (!token) return "home";
  if (role === "admin") return "admin";
  if (role === "teacher") return "teacher";
  if (role === "student") return "dashboard";
  return "home";
}

function App() {
  const storedUser = normalizeUser(JSON.parse(localStorage.getItem("user") || "null"));
  const storedToken = localStorage.getItem("token");
  const [token, setToken] = useState(storedToken);
  const [user, setUser] = useState(storedUser);
  const [screen, setScreen] = useState(
    getDashboardScreen(storedUser?.role, storedToken)
  );
  const [selectedRole, setSelectedRole] = useState("student");
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedLesson, setSelectedLesson] = useState(null);

  function handleLogin(loginResult) {
    if (!loginResult?.token || !loginResult?.user) {
      return;
    }

    const normalizedUser = normalizeUser(loginResult.user);

    localStorage.setItem("token", loginResult.token);
    localStorage.setItem("user", JSON.stringify(normalizedUser));
    setToken(loginResult.token);
    setUser(normalizedUser);
    setScreen(getDashboardScreen(normalizedUser?.role, loginResult.token));
  }

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
    setScreen("home");
  }

  useEffect(() => {
    if (!token) return undefined;

    let isCancelled = false;

    async function syncCurrentUser() {
      const result = await getCurrentUserProfile(token);

      if (isCancelled) return;

      if (!result.success || !result.user) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setToken(null);
        setUser(null);
        setScreen("home");
        return;
      }

      const verifiedUser = normalizeUser(result.user);
      localStorage.setItem("user", JSON.stringify(verifiedUser));
      setUser(verifiedUser);
      setScreen((currentScreen) =>
        DASHBOARD_SCREENS.includes(currentScreen)
          ? getDashboardScreen(verifiedUser?.role, token)
          : currentScreen
      );
    }

    syncCurrentUser();

    return () => {
      isCancelled = true;
    };
  }, [token]);

  const isAdmin = user?.role === "admin";
  const isTeacher = user?.role === "teacher";
  const isStudent = user?.role === "student";

  function openRoleDashboard() {
    const dashboardScreen = getDashboardScreen(user?.role, token);
    setScreen(dashboardScreen === "home" ? "login" : dashboardScreen);
  }

  return (
    <div className="App">
      {screen === "login" ? (
        <Login
          onLogin={handleLogin}
          onClose={() => setScreen("home")}
          onSwitchRegister={() => setScreen("choose-role")}
        />
      ) : screen === "choose-role" ? (
        <RegisterRoleModal
          onClose={() => setScreen("home")}
          onSelect={(role) => {
            setSelectedRole(role);
            setScreen("register");
          }}
        />
      ) : screen === "register" ? (
        <Register
          onLogin={handleLogin}
          role={selectedRole}
          onClose={() => setScreen("home")}
          onSwitchLogin={() => setScreen("login")}
        />
      ) : screen === "admin" && isAdmin ? (
        <AdminPanel adminName={user.name} token={token} onLogout={handleLogout} />
      ) : screen === "teacher" && isTeacher ? (
        <TeacherDashboard teacherName={user.name} onLogout={handleLogout} />
      ) : screen === "dashboard" && token && isStudent ? (
        <StudentDashboard
          onLogout={handleLogout}
          onBackHome={() => setScreen("home")}
          studentData={user}
        />
      ) : screen === "subjects" ? (
        <SubjectsPage
          token={token}
          onBackHome={() => setScreen("home")}
          onLoginClick={() => setScreen("login")}
          onRegisterClick={() => setScreen("choose-role")}
          onLogout={handleLogout}
          onAboutClick={() => setScreen("about")}
          onSelectSubject={(subject) => {
            setSelectedSubject(subject);
            setScreen("subject-detail");
          }}
        />
      ) : screen === "subject-detail" && selectedSubject && token ? (
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
      ) : screen === "lesson-detail" && selectedLesson && selectedSubject && token ? (
        <LessonDetail
          token={token}
          lessonId={selectedLesson._id}
          subjectName={selectedSubject.name}
          onBack={() => {
            setSelectedLesson(null);
            setScreen("subject-detail");
          }}
        />
      ) : screen === "about" ? (
        <AboutUs
          token={token}
          onBackHome={() => setScreen("home")}
          onViewAllSubjects={() => setScreen("subjects")}
          onLoginClick={() => setScreen("login")}
          onRegisterClick={() => setScreen("choose-role")}
          onLogout={handleLogout}
        />
      ) : (
        <Home
          token={token}
          onBackHome={() => setScreen("home")}
          onLoginClick={() => setScreen("login")}
          onRegisterClick={() => setScreen("choose-role")}
          onDashboardClick={openRoleDashboard}
          onViewAllSubjects={() => setScreen("subjects")}
          onAboutClick={() => setScreen("about")}
          onLogout={handleLogout}
        />
      )}
    </div>
  );
}

export default App;
