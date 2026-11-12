from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import functions

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {"message": "Warehouse API", "docs": "/docs"}


# Endpoint 1: Register a package
@app.post("/packages")
def add_package(name: str, destination: str, weight: float, status: str = "received"):
    return functions.add_package(name=name, destination=destination, weight=weight, status=status)


# Helper endpoint: Get all packages (used by frontend to list packages)
@app.get("/packages")
def get_all_packages():
    return functions.get_all_packages()


# Endpoint 2: Get the details of a specific package
@app.get("/packages/{id}")
def get_package(id: int):
    package = functions.get_package(id)
    if not package:
        raise HTTPException(status_code=404, detail="Package not found")
    return package


# Endpoint 3: Partially update package details
@app.patch("/packages/{id}")
def update_package(id: int, name: str = None, destination: str = None, weight: float = None, status: str = None):
    package = functions.update_package(id=id, name=name, destination=destination, weight=weight, status=status)
    if not package:
        raise HTTPException(status_code=404, detail="Package not found")
    return package


# Endpoint 4: Delete a package (only if it has not been dispatched)
@app.delete("/packages/{id}")
def delete_package(id: int):
    result = functions.delete_package(id)
    if result == "not_found":
        raise HTTPException(status_code=404, detail="Package not found")
    if result == "dispatched":
        raise HTTPException(status_code=400, detail="Cannot delete a package that has already been dispatched")
    return {"message": "Package deleted successfully"}
