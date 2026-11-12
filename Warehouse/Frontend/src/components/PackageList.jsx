import PackageItem from "./PackageItem";

function PackageList({ packages, onUpdate, onDelete }) {
  return (
    <>
      <h2>All Packages</h2>
      <ul className="packages">
        {packages.map((pkg) => (
          <PackageItem
            key={pkg.id}
            pkg={pkg}
            onUpdate={onUpdate}
            onDelete={onDelete}
          />
        ))}
      </ul>
    </>
  );
}

export default PackageList;
