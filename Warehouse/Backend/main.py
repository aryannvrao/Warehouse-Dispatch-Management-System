from fastapi import FastAPI, HTTPException, Header
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


# Helper function to verify token on protected endpoints
def check_token(token: str):
    username = functions.verify_token(token)
    if not username:
        raise HTTPException(status_code=401, detail="Invalid or missing token")
    return username


@app.get("/")
def root():
    return {"message": "Warehouse API", "docs": "/docs"}


# Login endpoint (unprotected so users can get a token)
@app.post("/login")
def login(username: str, password: str):
    token = functions.login(username=username, password=password)
    if token:
        return {"token": token}
    else:
        raise HTTPException(status_code=401, detail="Invalid username or password")


# Endpoint 1: Register a package
@app.post("/packages")
def add_package(name: str, destination: str, weight: float, status: str = "received", token: str = Header(None)):
    check_token(token)
    return functions.add_package(name=name, destination=destination, weight=weight, status=status)


# Endpoint 5: Search and filter packages (by destination, status, arrival date)
@app.get("/packages")
def get_all_packages(destination: str = None, status: str = None, arrival_date: str = None, token: str = Header(None)):
    check_token(token)
    return functions.get_all_packages(destination=destination, status=status, arrival_date=arrival_date)


# Endpoint 2: Get the details of a specific package
@app.get("/packages/{id}")
def get_package(id: int, token: str = Header(None)):
    check_token(token)
    package = functions.get_package(id)
    if not package:
        raise HTTPException(status_code=404, detail="Package not found")
    return package


# Endpoint 3: Partially update package details
@app.patch("/packages/{id}")
def update_package(id: int, name: str = None, destination: str = None, weight: float = None, status: str = None, token: str = Header(None)):
    check_token(token)
    package = functions.update_package(id=id, name=name, destination=destination, weight=weight, status=status)
    if not package:
        raise HTTPException(status_code=404, detail="Package not found")
    return package


# Endpoint 4: Delete a package (only if it has not been dispatched)
@app.delete("/packages/{id}")
def delete_package(id: int, token: str = Header(None)):
    check_token(token)
    result = functions.delete_package(id)
    if result == "not_found":
        raise HTTPException(status_code=404, detail="Package not found")
    if result == "dispatched":
        raise HTTPException(status_code=400, detail="Cannot delete a package that has already been dispatched")
    return {"message": "Package deleted successfully"}


# Endpoint 6: View dispatch batches (filter by destination, vehicle, dispatch status)
@app.get("/dispatch-batches")
def get_dispatch_batches(destination: str = None, vehicle: str = None, status: str = None, token: str = Header(None)):
    check_token(token)
    return functions.get_dispatch_batches(destination=destination, vehicle=vehicle, status=status)


# Helper to add a dispatch batch
@app.post("/dispatch-batches")
def add_dispatch_batch(destination: str, vehicle: str, status: str = "pending", token: str = Header(None)):
    check_token(token)
    return functions.add_dispatch_batch(destination=destination, vehicle=vehicle, status=status)


# Endpoint 7: Get warehouse statistics (dispatch summary)
@app.get("/analytics/summary")
def get_summary(token: str = Header(None)):
    check_token(token)
    return functions.get_summary()
