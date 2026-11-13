import { useState, useEffect } from "react";
import PackageList from "./components/PackageList";

function App() {
  const [token, setToken] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(false);

  function handleLogin(e) {
    e.preventDefault();
    setError("");

    fetch("http://127.0.0.1:8001/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Invalid username or password");
        }
        return res.json();
      })
      .then((data) => {
        const receivedToken = data.access_token || data.token;
        if (receivedToken) {
          setToken(receivedToken);
          setCurrentUser({
            username: data.username || username,
            role: data.role || "staff",
          });
          setPassword("");
        }
      })
      .catch((err) => {
        setError(err.message);
      });
  }

  function loadPackages() {
    if (!token) return;
    setLoading(true);

    fetch("http://127.0.0.1:8001/packages", {
      headers: { token: token },
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setPackages(data);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }

  useEffect(() => {
    if (token) {
      loadPackages();
    }
  }, [token]);

  function handleLogout() {
    setToken("");
    setCurrentUser(null);
    setPackages([]);
  }

  if (!token) {
    return (
      <div className="login-card">
        <h2>Warehouse Login</h2>
        <p className="login-hint">Sign in to view warehouse packages.</p>

        {error && <p className="error-message">{error}</p>}

        <form onSubmit={handleLogin}>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit">Sign In</button>
        </form>

        <div className="demo-accounts">
          <p>Demo Accounts:</p>
          <div className="demo-buttons">
            <button
              type="button"
              className="demo-btn"
              onClick={() => {
                setUsername("admin");
                setPassword("admin123");
              }}
            >
              Admin
            </button>
            <button
              type="button"
              className="demo-btn"
              onClick={() => {
                setUsername("staff");
                setPassword("staff123");
              }}
            >
              Staff
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <header className="header">
        <div>
          <h1>Warehouse Dispatch Management</h1>
          <p className="user-info">
            Logged in as: <strong>{currentUser?.username}</strong> &nbsp;|&nbsp;
            Role:{" "}
            <span className={`role-badge ${currentUser?.role}`}>
              {currentUser?.role?.toUpperCase()}
            </span>
          </p>
        </div>
        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </header>

      {loading ? (
        <p>Loading packages...</p>
      ) : (
        <PackageList packages={packages} />
      )}
    </div>
  );
}

export default App;
