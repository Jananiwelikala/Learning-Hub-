import { useState } from "react";
import "./App.css";
import Login from "./Login";
import Home from "./Home";

// Root screen controller:
// - stores auth token
// - toggles between Home and Login views
function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [showLogin, setShowLogin] = useState(false);

  // Save token after successful login.
  function handleLogin(newToken) {
    localStorage.setItem("token", newToken);
    setToken(newToken);
    setShowLogin(false);
  }

  // Clear token and return to logged-out state.
  function handleLogout() {
    localStorage.removeItem("token");
    setToken(null);
  }

  return (
    <div className="App">
      {/* Simple view switch instead of route-based navigation */}
      {showLogin ? (
        <Login onLogin={handleLogin} onClose={() => setShowLogin(false)} />
      ) : (
        <Home
          token={token}
          onLoginClick={() => setShowLogin(true)}
          onLogout={handleLogout}
        />
      )}
    </div>
  );
}

export default App;
