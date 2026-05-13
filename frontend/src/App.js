import { useState } from "react";
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

function App() {
  const storedUser = JSON.parse(localStorage.getItem("user") || "null");
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [user, setUser] = useState(storedUser);
  const [screen, setScreen] = useState(
    storedUser?.role === "admin"
      ? "admin"
      : storedUser?.role === "teacher"
        ? "teacher"
        : storedUser?.role === "student" && token
          ? "dashboard"
          : "home"
  );
  const [selectedRole, setSelectedRole] = useState("student");
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedLesson, setSelectedLesson] = useState(null);

  function handleLogin(loginResult) {
    if (!loginResult?.token || !loginResult?.user) {
      return;
    }

    localStorage.setItem("token", loginResult.token);
    localStorage.setItem("user", JSON.stringify(loginResult.user));
    setToken(loginResult.token);
    setUser(loginResult.user);

    if (loginResult.user.role === "admin") {
      setScreen("admin");
    } else if (loginResult.user.role === "teacher") {
      setScreen("teacher");
    } else {
      setScreen("dashboard");
    }
  }

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
    setScreen("home");
  }

  const isAdmin = user?.role === "admin";
  const isTeacher = user?.role === "teacher";
  const isStudent = user?.role === "student";

  function openRoleDashboard() {
    if (user?.role === "admin") {
      setScreen("admin");
    } else if (user?.role === "teacher") {
      setScreen("teacher");
    } else if (user?.role === "student") {
      setScreen("dashboard");
    } else {
      setScreen("login");
    }
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
        <AdminPanel adminName={user.name} onLogout={handleLogout} />
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
