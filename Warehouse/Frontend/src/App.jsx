import { useState, useEffect } from "react";
import PackageList from "./components/PackageList";

function App() {
  // Authentication State
  const [token, setToken] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  // Data State
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(false);

  // ==========================================
  // Endpoint 1: Login (POST /login)
  // ==========================================
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

  // ==========================================
  // Endpoint 2: Get Packages (GET /packages)
  // ==========================================
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

  // ==========================================
  // Endpoint 4: Delete Package (DELETE /packages/{id})
  // Highlights Role-Based Access Control (Admin vs. Staff)
  // ==========================================
  function handleDeletePackage(id) {
    fetch(`http://127.0.0.1:8001/packages/${id}`, {
      method: "DELETE",
      headers: { token: token },
    })
      .then(async (res) => {
        const data = await res.json();

        // 403 Forbidden: Staff is not authorized to delete
        if (res.status === 403) {
          alert(
            `⛔ 403 Forbidden (RBAC Enforced)!\n\nBackend Response: "${data.detail}"\n\nYou are logged in as role "${currentUser?.role.toUpperCase()}". Only ADMIN users are authorized to delete packages.`
          );
          return;
        }

        // 400 Bad Request: Dispatched packages cannot be deleted
        if (res.status === 400) {
          alert(`⚠️ Cannot Delete: ${data.detail}`);
          return;
        }

        // Other errors
        if (!res.ok) {
          alert(`⚠️ Error: ${data.detail || "Failed to delete package"}`);
          return;
        }

        // Success (Admin)
        alert("✅ Package deleted successfully by ADMIN!");
        loadPackages();
      })
      .catch((err) => {
        alert("Network error: " + err.message);
      });
  }

  // Fetch packages on login
  useEffect(() => {
    if (token) {
      loadPackages();
    }
  }, [token]);

  // Logout handler
  function handleLogout() {
    setToken("");
    setCurrentUser(null);
    setPackages([]);
  }

  // 1. If not logged in, render Login card (Endpoint 1)
  if (!token) {
    return (
      <div className="login-card">
        <h2>Warehouse Login</h2>
        <p className="login-hint">
          Sign in to access packages. Role-Based Access Control is active.
        </p>

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
          <p><strong>Quick Test Accounts:</strong></p>
          <div className="demo-buttons">
            <button
              type="button"
              className="demo-btn"
              onClick={() => {
                setUsername("admin");
                setPassword("admin123");
              }}
            >
              Fill Admin (Can Delete)
            </button>
            <button
              type="button"
              className="demo-btn"
              onClick={() => {
                setUsername("staff");
                setPassword("staff123");
              }}
            >
              Fill Staff (Cannot Delete)
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. If logged in, render Package List + RBAC Demo Banner
  return (
    <div className="container">
      <header className="header">
        <div>
          <h1>Warehouse Dispatch Management</h1>
          <p className="user-info">
            👤 User: <strong>{currentUser?.username}</strong> &nbsp;|&nbsp;
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

      {/* RBAC Info Banner */}
      <div className={`rbac-banner ${currentUser?.role}`}>
        <strong>🛡️ Role-Based Access Control in Action:</strong>
        {currentUser?.role === "admin" ? (
          <span>
            {" "}You are logged in as <strong>ADMIN</strong>. You have permission to delete packages using the delete button below.
          </span>
        ) : (
          <span>
            {" "}You are logged in as <strong>STAFF</strong>. Try clicking the "Delete Package" button below to see the backend block you with a <strong>403 Forbidden</strong> error!
          </span>
        )}
      </div>

      {loading ? (
        <p>Loading warehouse packages...</p>
      ) : (
        <PackageList
          packages={packages}
          onDelete={handleDeletePackage}
          currentUser={currentUser}
        />
      )}
    </div>
  );
}

export default App;
