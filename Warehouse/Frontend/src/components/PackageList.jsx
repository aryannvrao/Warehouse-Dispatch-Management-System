import PackageItem from "./PackageItem";

function PackageList({ packages, onUpdate, onDelete, token }) {
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
            token={token}
          />
        ))}
      </ul>
    </>
  );
}

export default PackageList;
