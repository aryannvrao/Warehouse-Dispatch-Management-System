import { useState, useEffect } from "react";
import PackageList from "./components/PackageList";
import RegisterPackage from "./components/RegisterPackage";
import PackageDetail from "./components/PackageDetail";

function App() {
  const [packages, setPackages] = useState([]);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [filterStatus, setFilterStatus] = useState("");

  function loadPackages(status = "") {
    const url = status
      ? `http://127.0.0.1:8000/packages?status=${status}`
      : "http://127.0.0.1:8000/packages";
    fetch(url)
      .then((response) => response.json())
      .then((data) => setPackages(data));
  }

  useEffect(() => {
    loadPackages(filterStatus);
  }, [filterStatus]);

  function handlePackageAdded(newPackage) {
    setPackages((prevPackages) => [...prevPackages, newPackage]);
  }

  function handleSelectPackage(packageId) {
    fetch(`http://127.0.0.1:8000/packages/${packageId}`)
      .then((response) => response.json())
      .then((data) => setSelectedPackage(data));
  }

  function handleUpdatePackage(packageId, updates) {
    fetch(`http://127.0.0.1:8000/packages/${packageId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    })
      .then((response) => response.json())
      .then((updated) => {
        setPackages((prev) =>
          prev.map((pkg) => (pkg.id === packageId ? updated : pkg))
        );
        if (selectedPackage && selectedPackage.id === packageId) {
          setSelectedPackage(updated);
        }
      });
  }

  function handleDeletePackage(packageId) {
    fetch(`http://127.0.0.1:8000/packages/${packageId}`, {
      method: "DELETE",
    })
      .then((response) => {
        if (!response.ok) {
          return response.json().then((err) => {
            alert(err.detail || "Failed to delete package");
          });
        }
        setPackages((prev) => prev.filter((pkg) => pkg.id !== packageId));
        if (selectedPackage && selectedPackage.id === packageId) {
          setSelectedPackage(null);
        }
      });
  }

  function handleCloseDetail() {
    setSelectedPackage(null);
  }

  return (
    <div className="app-container">
      <h1>Warehouse Dispatch Management System</h1>
      <RegisterPackage onPackageAdded={handlePackageAdded} />
      {selectedPackage && (
        <PackageDetail
          pkg={selectedPackage}
          onClose={handleCloseDetail}
          onUpdatePackage={handleUpdatePackage}
          onDeletePackage={handleDeletePackage}
        />
      )}
      <PackageList
        packages={packages}
        onSelectPackage={handleSelectPackage}
        onUpdatePackage={handleUpdatePackage}
        onDeletePackage={handleDeletePackage}
        filterStatus={filterStatus}
        onFilterChange={setFilterStatus}
      />
    </div>
  );
}

export default App;
