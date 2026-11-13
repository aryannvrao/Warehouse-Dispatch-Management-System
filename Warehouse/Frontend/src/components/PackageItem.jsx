function PackageItem({ pkg }) {
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
    </li>
  );
}

export default PackageItem;
