import { useState } from "react";

function PackageItem({ pkg, onSelectPackage, onUpdatePackage, onDeletePackage }) {
  const [isEditing, setIsEditing] = useState(false);
  const [newStatus, setNewStatus] = useState(pkg.status);

  function handleSaveStatus() {
    onUpdatePackage(pkg.id, { status: newStatus });
    setIsEditing(false);
  }

  return (
    <li className="package-item">
      <h3>{pkg.name}</h3>
      <p>
        <strong>Package ID:</strong> #{pkg.id}
      </p>
      <p>
        <strong>Destination:</strong> {pkg.destination}
      </p>
      <p>
        <strong>Weight:</strong> {pkg.weight} kg
      </p>
      <p>
        <strong>Status:</strong>{" "}
        {isEditing ? (
          <span>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
            >
              <option value="received">received</option>
              <option value="pending">pending</option>
              <option value="dispatched">dispatched</option>
            </select>{" "}
            <button className="btn-small" onClick={handleSaveStatus}>
              Save
            </button>{" "}
            <button className="btn-small" onClick={() => setIsEditing(false)}>
              Cancel
            </button>
          </span>
        ) : (
          <span className="status-badge">{pkg.status}</span>
        )}
      </p>

      <div className="card-actions">
        <button
          className="btn-secondary"
          onClick={() => onSelectPackage(pkg.id)}
        >
          View Details
        </button>
        {!isEditing && (
          <button
            className="btn-secondary"
            onClick={() => setIsEditing(true)}
          >
            Edit Status
          </button>
        )}
        <button
          className="btn-danger"
          disabled={pkg.status === "dispatched"}
          onClick={() => onDeletePackage(pkg.id)}
          title={
            pkg.status === "dispatched"
              ? "Dispatched packages cannot be deleted"
              : "Delete package"
          }
        >
          Delete
        </button>
      </div>
    </li>
  );
}

export default PackageItem;
