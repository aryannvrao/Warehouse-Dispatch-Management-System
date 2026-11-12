import { useState, useEffect } from "react";
import PackageList from "./components/PackageList";

function App() {
  // Authentication state
  const [token, setToken] = useState("");
  const [loginUser, setLoginUser] = useState("");
  const [loginPass, setLoginPass] = useState("");

  const [packages, setPackages] = useState([]);
  const [summary, setSummary] = useState(null);
  const [batches, setBatches] = useState([]);

  // Form states for adding a package (Endpoint 1)
  const [name, setName] = useState("");
  const [destination, setDestination] = useState("");
  const [weight, setWeight] = useState("");

  // Filter states for packages (Endpoint 5)
  const [filterDestination, setFilterDestination] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  // Filter state for dispatch batches (Endpoint 6)
  const [filterBatchDestination, setFilterBatchDestination] = useState("");

  // Login handler
  function handleLogin(e) {
    e.preventDefault();
    fetch(`http://127.0.0.1:8001/login?username=${loginUser}&password=${loginPass}`, {
      method: "POST",
    })
      .then((res) => {
        if (!res.ok) {
          alert("Invalid username or password");
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data && data.token) {
          setToken(data.token);
          setLoginPass("");
        }
      });
  }

  // Logout handler
  function handleLogout() {
    setToken("");
    setPackages([]);
    setSummary(null);
    setBatches([]);
  }

  // Endpoint 5: Load packages (with token)
  function loadPackages() {
    if (!token) return;
    let url = "http://127.0.0.1:8001/packages";
    const params = [];
    if (filterDestination) params.push(`destination=${filterDestination}`);
    if (filterStatus) params.push(`status=${filterStatus}`);
    if (params.length > 0) {
      url += "?" + params.join("&");
    }

    fetch(url, {
      headers: { token: token },
    })
      .then((response) => response.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setPackages(data);
        }
      });
  }

  // Endpoint 7: Load warehouse statistics (with token)
  function loadSummary() {
    if (!token) return;
    fetch("http://127.0.0.1:8001/analytics/summary", {
      headers: { token: token },
    })
      .then((response) => response.json())
      .then((data) => setSummary(data));
  }

  // Endpoint 6: Load dispatch batches (with token)
  function loadBatches() {
    if (!token) return;
    let url = "http://127.0.0.1:8001/dispatch-batches";
    if (filterBatchDestination) {
      url += `?destination=${filterBatchDestination}`;
    }

    fetch(url, {
      headers: { token: token },
    })
      .then((response) => response.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setBatches(data);
        }
      });
  }

  // Load data whenever token changes
  useEffect(() => {
    if (token) {
      loadPackages();
      loadSummary();
      loadBatches();
    }
  }, [token]);

  // Reload packages when filters change (Endpoint 5)
  useEffect(() => {
    if (token) {
      loadPackages();
    }
  }, [filterDestination, filterStatus]);

  // Reload batches when batch filter changes (Endpoint 6)
  useEffect(() => {
    if (token) {
      loadBatches();
    }
  }, [filterBatchDestination]);

  // Endpoint 1: Register a package (with token)
  function addPackage(e) {
    e.preventDefault();
    fetch(`http://127.0.0.1:8001/packages?name=${name}&destination=${destination}&weight=${weight}`, {
      method: "POST",
      headers: { token: token },
    })
      .then((response) => response.json())
      .then(() => {
        loadPackages();
        loadSummary();
        setName("");
        setDestination("");
        setWeight("");
      });
  }

  // Endpoint 3: Partially update package details (with token)
  function updatePackage(id, newStatus) {
    fetch(`http://127.0.0.1:8001/packages/${id}?status=${newStatus}`, {
      method: "PATCH",
      headers: { token: token },
    })
      .then((response) => response.json())
      .then(() => {
        loadPackages();
        loadSummary();
      });
  }

  // Endpoint 4: Delete a package (with token)
  function deletePackage(id) {
    fetch(`http://127.0.0.1:8001/packages/${id}`, {
      method: "DELETE",
      headers: { token: token },
    })
      .then((response) => {
        if (!response.ok) {
          alert("Cannot delete a dispatched package!");
        }
        loadPackages();
        loadSummary();
      });
  }

  // If not logged in, show simple login card
  if (!token) {
    return (
      <div className="section-card" style={{ maxWidth: "400px", margin: "40px auto" }}>
        <h2>Warehouse Login</h2>
        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <input
            type="text"
            placeholder="Username (e.g. aryan)"
            value={loginUser}
            onChange={(e) => setLoginUser(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password (e.g. aryan@06)"
            value={loginPass}
            onChange={(e) => setLoginPass(e.target.value)}
            required
          />
          <button type="submit">Login</button>
        </form>
      </div>
    );
  }

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>Warehouse Dispatch Management System</h1>
        <button onClick={handleLogout}>Logout</button>
      </div>

      {/* Endpoint 7: Warehouse Statistics */}
      {summary && (
        <div className="section-card">
          <h2>Warehouse Statistics (Summary)</h2>
          <p><strong>Total Packages:</strong> {summary.total_packages}</p>
          <p><strong>Total Received:</strong> {summary.total_received}</p>
          <p><strong>Pending Dispatch:</strong> {summary.total_pending}</p>
          <p><strong>Total Dispatched:</strong> {summary.total_dispatched}</p>
          <p><strong>Destination Counts:</strong></p>
          <ul>
            {summary.destination_counts &&
              Object.keys(summary.destination_counts).map((dest) => (
                <li key={dest}>
                  {dest}: {summary.destination_counts[dest]}
                </li>
              ))}
          </ul>
        </div>
      )}

      {/* Endpoint 1: Register a Package Form */}
      <form onSubmit={addPackage} className="add-form">
        <h3>Register a Package</h3>
        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Destination"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          required
        />
        <input
          type="number"
          step="0.1"
          placeholder="Weight (kg)"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          required
        />
        <button type="submit">Add Package</button>
      </form>

      {/* Endpoint 5: Filter Packages */}
      <div className="filter-bar">
        <h3>Filter Packages</h3>
        <input
          type="text"
          placeholder="Filter by Destination"
          value={filterDestination}
          onChange={(e) => setFilterDestination(e.target.value)}
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="received">Received</option>
          <option value="pending">Pending</option>
          <option value="dispatched">Dispatched</option>
        </select>
      </div>

      {/* Package List (Endpoints 2, 3, 4) */}
      <h2>Packages List</h2>
      <PackageList
        packages={packages}
        onUpdate={updatePackage}
        onDelete={deletePackage}
        token={token}
      />

      {/* Endpoint 6: Dispatch Batches */}
      <div style={{ marginTop: "32px" }}>
        <h2>Dispatch Batches</h2>
        <div className="filter-bar">
          <input
            type="text"
            placeholder="Filter Batches by Destination"
            value={filterBatchDestination}
            onChange={(e) => setFilterBatchDestination(e.target.value)}
          />
        </div>
        <ul className="packages">
          {batches.map((batch) => (
            <li key={batch.id} className="package">
              <h2>Batch #{batch.id}</h2>
              <p>Destination: {batch.destination}</p>
              <p>Vehicle: {batch.vehicle}</p>
              <p>Status: {batch.status}</p>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

export default App;
