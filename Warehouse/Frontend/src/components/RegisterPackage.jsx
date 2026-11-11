import { useState } from "react";

function RegisterPackage({ onPackageAdded }) {
  const [name, setName] = useState("");
  const [destination, setDestination] = useState("");
  const [weight, setWeight] = useState("");
  const [status, setStatus] = useState("received");

  function handleSubmit(e) {
    e.preventDefault();
    if (!name || !destination || !weight) {
      alert("Please fill in name, destination, and weight");
      return;
    }

    fetch("http://127.0.0.1:8000/packages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: name,
        destination: destination,
        weight: parseFloat(weight),
        status: status,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        onPackageAdded(data);
        setName("");
        setDestination("");
        setWeight("");
        setStatus("received");
      });
  }

  return (
    <form className="package-form" onSubmit={handleSubmit}>
      <h2>Register a Package</h2>
      <div className="form-group">
        <label>Package Name:</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Electronics Box"
          required
        />
      </div>
      <div className="form-group">
        <label>Destination:</label>
        <input
          type="text"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          placeholder="e.g. New York"
          required
        />
      </div>
      <div className="form-group">
        <label>Weight (kg):</label>
        <input
          type="number"
          step="0.1"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          placeholder="e.g. 5.5"
          required
        />
      </div>
      <div className="form-group">
        <label>Status:</label>
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="received">received</option>
          <option value="pending">pending</option>
          <option value="dispatched">dispatched</option>
        </select>
      </div>
      <button type="submit" className="btn-primary">
        Register Package
      </button>
    </form>
  );
}

export default RegisterPackage;

