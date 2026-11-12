import { useState } from "react";

function PackageItem({ pkg, onUpdate, onDelete }) {
  const [details, setDetails] = useState(null);

  // Endpoint 2: Get details of a specific package
  function getDetails() {
    if (details) {
      setDetails(null);
    } else {
      fetch(`http://127.0.0.1:8000/packages/${pkg.id}`)
        .then((response) => response.json())
        .then((data) => setDetails(data));
    }
  }

  return (
    <li className="package">
      <h2>{pkg.name}</h2>
      <p>Destination: {pkg.destination}</p>
      <p>Weight: {pkg.weight} kg</p>
      <p>Status: {pkg.status}</p>

      {/* Button for Endpoint 2 */}
      <button onClick={getDetails}>
        {details ? "Hide Details" : "View Details"}
      </button>

      {/* Button for Endpoint 3 */}
      {pkg.status !== "dispatched" && (
        <button onClick={() => onUpdate(pkg.id, "dispatched")}>
          Mark Dispatched
        </button>
      )}

      {/* Button for Endpoint 4 */}
      <button onClick={() => onDelete(pkg.id)}>
        Delete
      </button>

      {/* Detailed view from Endpoint 2 */}
      {details && (
        <div className="details">
          <h3>Details for Package #{details.id}</h3>
          <p>Name: {details.name}</p>
          <p>Destination: {details.destination}</p>
          <p>Weight: {details.weight} kg</p>
          <p>Arrival Date: {details.arrival_date}</p>
          <p>Status: {details.status}</p>
        </div>
      )}
    </li>
  );
}

export default PackageItem;
