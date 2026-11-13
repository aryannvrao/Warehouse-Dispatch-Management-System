function PackageItem({ pkg, onDelete, currentUser }) {
  return (
    <li className="package">
      <h2>{pkg.name}</h2>
      <p className="destination">📍 Destination: {pkg.destination}</p>
      <p>⚖️ Weight: {pkg.weight} kg</p>
      <p>
        Status: <span className={`badge ${pkg.status}`}>{pkg.status}</span>
      </p>
      <p className="date">
        📅 Arrived: {pkg.arrival_date ? pkg.arrival_date.slice(0, 10) : "N/A"}
      </p>

      <div className="card-actions">
        <button
          className="delete-btn"
          onClick={() => onDelete(pkg.id)}
          title={
            currentUser?.role === "admin"
              ? "Admin permission: Delete package"
              : "Staff permission: Will be blocked with 403 Forbidden"
          }
        >
          🗑️ Delete Package
        </button>
      </div>
    </li>
  );
}

export default PackageItem;
