import { useState, useEffect } from "react";
import PackageList from "./components/PackageList";

function App() {
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

  // Endpoint 5: Load packages (with optional filters)
  function loadPackages() {
    let url = "http://127.0.0.1:8000/packages";
    const params = [];
    if (filterDestination) params.push(`destination=${filterDestination}`);
    if (filterStatus) params.push(`status=${filterStatus}`);
    if (params.length > 0) {
      url += "?" + params.join("&");
    }

    fetch(url)
      .then((response) => response.json())
      .then((data) => setPackages(data));
  }

  // Endpoint 7: Load warehouse statistics
  function loadSummary() {
    fetch("http://127.0.0.1:8000/analytics/summary")
      .then((response) => response.json())
      .then((data) => setSummary(data));
  }

  // Endpoint 6: Load dispatch batches (with optional filter)
  function loadBatches() {
    let url = "http://127.0.0.1:8000/dispatch-batches";
    if (filterBatchDestination) {
      url += `?destination=${filterBatchDestination}`;
    }

    fetch(url)
      .then((response) => response.json())
      .then((data) => setBatches(data));
  }

  // Initial load
  useEffect(() => {
    loadPackages();
    loadSummary();
    loadBatches();
  }, []);

  // Reload packages when filters change (Endpoint 5)
  useEffect(() => {
    loadPackages();
  }, [filterDestination, filterStatus]);

  // Reload batches when batch filter changes (Endpoint 6)
  useEffect(() => {
    loadBatches();
  }, [filterBatchDestination]);

  // Endpoint 1: Register a package
  function addPackage(e) {
    e.preventDefault();
    fetch(`http://127.0.0.1:8000/packages?name=${name}&destination=${destination}&weight=${weight}`, {
      method: "POST",
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

  // Endpoint 3: Partially update package details
  function updatePackage(id, newStatus) {
    fetch(`http://127.0.0.1:8000/packages/${id}?status=${newStatus}`, {
      method: "PATCH",
    })
      .then((response) => response.json())
      .then(() => {
        loadPackages();
        loadSummary();
      });
  }

  // Endpoint 4: Delete a package
  function deletePackage(id) {
    fetch(`http://127.0.0.1:8000/packages/${id}`, {
      method: "DELETE",
    })
      .then((response) => {
        if (!response.ok) {
          alert("Cannot delete a dispatched package!");
        }
        loadPackages();
        loadSummary();
      });
  }

  return (
    <>
      <h1>Warehouse Dispatch Management System</h1>

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
            {Object.keys(summary.destination_counts).map((dest) => (
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
