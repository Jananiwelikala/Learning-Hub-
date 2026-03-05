import { useState } from "react";
import "./App.css";
import Login from "./Login";
import Home from "./Home";
import Register from "./Register";
import StudentDashboard from "./StudentDashboard";
import SubjectsPage from "./SubjectsPage";

// Root screen controller:
// - stores auth token
// - toggles between Home and Login views
function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [screen, setScreen] = useState(
    localStorage.getItem("token") ? "dashboard" : "home"
  );

  // Save token after successful login.
  function handleLogin(newToken) {
    localStorage.setItem("token", newToken);
    setToken(newToken);
    setScreen("dashboard");
  }

  // Clear token and return to logged-out state.
  function handleLogout() {
    localStorage.removeItem("token");
    setToken(null);
    setScreen("home");
  }

  return (
    <div className="App">
      {screen === "login" ? (
        <Login
          onLogin={handleLogin}
          onClose={() => setScreen("home")}
          onSwitchRegister={() => setScreen("register")}
        />
      ) : screen === "register" ? (
        <Register
          onClose={() => setScreen("home")}
          onSwitchLogin={() => setScreen("login")}
        />
      ) : screen === "dashboard" && token ? (
        <StudentDashboard
          onLogout={handleLogout}
          onBackHome={() => setScreen("home")}
        />
      ) : screen === "subjects" ? (
        <SubjectsPage
          token={token}
          onBackHome={() => setScreen("home")}
          onLoginClick={() => setScreen("login")}
          onRegisterClick={() => setScreen("register")}
          onLogout={handleLogout}
        />
      ) : (
        <Home
          token={token}
          onLoginClick={() => setScreen("login")}
          onRegisterClick={() => setScreen("register")}
          onDashboardClick={() => setScreen("dashboard")}
          onViewAllSubjects={() => setScreen("subjects")}
          onLogout={handleLogout}
        />
      )}
    </div>
  );
}

export default App;
