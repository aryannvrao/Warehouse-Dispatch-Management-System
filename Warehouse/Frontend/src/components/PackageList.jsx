import PackageItem from "./PackageItem";

function PackageList({
  packages,
  onSelectPackage,
  onUpdatePackage,
  onDeletePackage,
  filterStatus,
  onFilterChange,
}) {
  return (
    <>
      <div className="list-header">
        <h2>Warehouse Packages ({packages.length})</h2>
        <div className="filter-controls">
          <label>Filter by Status: </label>
          <select
            value={filterStatus}
            onChange={(e) => onFilterChange(e.target.value)}
          >
            <option value="">All</option>
            <option value="received">Received</option>
            <option value="pending">Pending</option>
            <option value="dispatched">Dispatched</option>
          </select>
        </div>
      </div>

      {packages.length === 0 ? (
        <p>No packages found in warehouse.</p>
      ) : (
        <ul className="packages">
          {packages.map((pkg) => (
            <PackageItem
              key={pkg.id}
              pkg={pkg}
              onSelectPackage={onSelectPackage}
              onUpdatePackage={onUpdatePackage}
              onDeletePackage={onDeletePackage}
            />
          ))}
        </ul>
      )}
    </>
  );
}

export default PackageList;
