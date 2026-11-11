import { useState } from "react";

function PackageDetail({ pkg, onClose, onUpdatePackage, onDeletePackage }) {
  if (!pkg) return null;

  const [status, setStatus] = useState(pkg.status);
  const [destination, setDestination] = useState(pkg.destination);
  const [weight, setWeight] = useState(pkg.weight);

  function handleUpdate() {
    onUpdatePackage(pkg.id, {
      status: status,
      destination: destination,
      weight: parseFloat(weight),
    });
  }

  function handleDelete() {
    onDeletePackage(pkg.id);
    onClose();
  }

  return (
    <div className="package-detail">
      <h2>Package Details (Package #{pkg.id})</h2>
      <p>
        <strong>Name:</strong> {pkg.name}
      </p>
      <p>
        <strong>Destination:</strong>{" "}
        <input
          type="text"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
        />
      </p>
      <p>
        <strong>Weight:</strong>{" "}
        <input
          type="number"
          step="0.1"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
        />{" "}
        kg
      </p>
      <p>
        <strong>Arrival Date:</strong> {pkg.arrival_date}
      </p>
      <p>
        <strong>Status:</strong>{" "}
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="received">received</option>
          <option value="pending">pending</option>
          <option value="dispatched">dispatched</option>
        </select>
      </p>

      <div className="detail-actions">
        <button className="btn-primary" onClick={handleUpdate}>
          Save Changes
        </button>
        <button
          className="btn-danger"
          disabled={pkg.status === "dispatched"}
          onClick={handleDelete}
        >
          Delete Package
        </button>
        <button className="btn-secondary" onClick={onClose}>
          Close Details
        </button>
      </div>
    </div>
  );
}

export default PackageDetail;
