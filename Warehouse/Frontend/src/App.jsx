import { useState, useEffect } from "react";
import PackageList from "./components/PackageList";

function App() {
  const [packages, setPackages] = useState([]);
  const [name, setName] = useState("");
  const [destination, setDestination] = useState("");
  const [weight, setWeight] = useState("");

  // Function to load all packages
  function loadPackages() {
    fetch("http://127.0.0.1:8000/packages")
      .then((response) => response.json())
      .then((data) => setPackages(data));
  }

  // Load packages when page opens
  useEffect(() => {
    loadPackages();
  }, []);

  // Endpoint 1: Register a package
  function addPackage(e) {
    e.preventDefault();
    fetch(`http://127.0.0.1:8000/packages?name=${name}&destination=${destination}&weight=${weight}`, {
      method: "POST",
    })
      .then((response) => response.json())
      .then(() => {
        loadPackages();
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
      .then(() => loadPackages());
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
      });
  }

  return (
    <>
      <h1>Warehouse Packages</h1>

      {/* Endpoint 1 Form */}
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

      {/* Package List */}
      <PackageList
        packages={packages}
        onUpdate={updatePackage}
        onDelete={deletePackage}
      />
    </>
  );
}

export default App;
