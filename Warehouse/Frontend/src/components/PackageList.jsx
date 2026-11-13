import PackageItem from "./PackageItem";

function PackageList({ packages }) {
  if (!packages || packages.length === 0) {
    return <p className="empty-message">No packages found.</p>;
  }

  return (
    <>
      <h2>Warehouse Packages ({packages.length})</h2>
      <ul className="packages">
        {packages.map((pkg) => (
          <PackageItem key={pkg.id} pkg={pkg} />
        ))}
      </ul>
    </>
  );
}

export default PackageList;
