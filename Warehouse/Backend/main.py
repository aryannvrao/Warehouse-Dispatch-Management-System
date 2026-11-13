from fastapi import FastAPI, HTTPException, Header, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import functions

app = FastAPI(title="Warehouse Dispatch Management API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==========================================
# 1. JWT & Role-Based Access Control (RBAC)
# ==========================================

def check_token(token: str = Header(None), required_role: str = None):
    """
    Validates JWT token and enforces Role-Based Access Control (RBAC).
    - If required_role is 'admin', only admin users are allowed.
    - If required_role is None, both admin and staff users are allowed.
    """
    if not token:
        raise HTTPException(status_code=401, detail="Invalid or missing token")

    user_info = functions.verify_token(token)
    if not user_info:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    user_role = user_info.get("role", "staff")
    if required_role and user_role != required_role:
        raise HTTPException(
            status_code=403,
            detail=f"Forbidden: {required_role.capitalize()} access required"
        )

    return user_info


# ==========================================
# 2. Pydantic Models (Data Schemas)
# ==========================================

class UserRegister(BaseModel):
    username: str
    password: str
    role: str = "staff"  # "staff" or "admin"


class LoginRequest(BaseModel):
    username: str
    password: str


class PackageCreate(BaseModel):
    name: str
    destination: str
    weight: float
    arrival_date: str | None = None
    status: str = "received"


class PackageUpdate(BaseModel):
    name: str | None = None
    destination: str | None = None
    weight: float | None = None
    status: str | None = None


class BatchCreate(BaseModel):
    destination: str
    vehicle: str
    status: str = "pending"
    package_ids: list[int] | None = None


# ==========================================
# 3. Authentication Endpoints
# ==========================================

@app.get("/")
def root():
    return {"message": "Warehouse API is running", "docs": "/docs"}


# Register a new user (with Argon2 password hashing and user role)
@app.post("/register")
def register(user: UserRegister):
    success = functions.register_user(
        username=user.username,
        password=user.password,
        role=user.role,
    )
    if not success:
        raise HTTPException(status_code=400, detail="Username already exists")
    return {"message": f"User '{user.username}' registered successfully as {user.role}"}


# Login (verifies password via Argon2 and returns JWT with role)
@app.post("/login")
def login(username: str = None, password: str = None, login_data: LoginRequest = None):
    user = (login_data.username if login_data else None) or username
    pwd = (login_data.password if login_data else None) or password

    token_data = functions.login(username=user, password=pwd)
    if token_data:
        return token_data
    raise HTTPException(status_code=401, detail="Invalid username or password")


# ==========================================
# 4. The 8 Warehouse Endpoints (From Readme.md)
# ==========================================

# Endpoint 1: Register a package (Roles: Staff, Admin)
@app.post("/packages")
def add_package(package: PackageCreate, token: str = Header(None)):
    check_token(token)
    return functions.add_package(
        name=package.name,
        destination=package.destination,
        weight=package.weight,
        arrival_date=package.arrival_date,
        status=package.status,
    )


# Endpoint 2: Get details of a specific package (Roles: Staff, Admin)
@app.get("/packages/{package_id}")
def get_package(package_id: int, token: str = Header(None)):
    check_token(token)
    package = functions.get_package(package_id)
    if not package:
        raise HTTPException(status_code=404, detail="Package not found")
    return package


# Endpoint 3: Partially update package details (Roles: Staff, Admin)
@app.patch("/packages/{package_id}")
def update_package(package_id: int, package: PackageUpdate, token: str = Header(None)):
    check_token(token)
    updated = functions.update_package(
        id=package_id,
        name=package.name,
        destination=package.destination,
        weight=package.weight,
        status=package.status,
    )
    if not updated:
        raise HTTPException(status_code=404, detail="Package not found")
    return updated


# Endpoint 4: Delete a package (Role: Admin ONLY)
@app.delete("/packages/{package_id}")
def delete_package(package_id: int, token: str = Header(None)):
    check_token(token, required_role="admin")
    result = functions.delete_package(package_id)
    if result == "not_found":
        raise HTTPException(status_code=404, detail="Package not found")
    if result == "dispatched":
        raise HTTPException(status_code=400, detail="Cannot delete a package that has already been dispatched")
    return {"message": "Package deleted successfully"}


# Endpoint 5: Search and filter packages (Roles: Staff, Admin)
@app.get("/packages")
def get_all_packages(destination: str = None, status: str = None, arrival_date: str = None, token: str = Header(None)):
    check_token(token)
    return functions.get_all_packages(destination=destination, status=status, arrival_date=arrival_date)


# Endpoint 6: View dispatch batches (Roles: Staff, Admin)
@app.get("/dispatch-batches")
def get_dispatch_batches(destination: str = None, vehicle: str = None, status: str = None, token: str = Header(None)):
    check_token(token)
    return functions.get_dispatch_batches(destination=destination, vehicle=vehicle, status=status)


# Endpoint 7: Get warehouse statistics summary (Role: Admin ONLY)
@app.get("/analytics/summary")
def get_summary(token: str = Header(None)):
    check_token(token, required_role="admin")
    return functions.get_summary()


# Endpoint 8: Add dispatch batch manually & assign packages (Role: Admin ONLY)
@app.post("/dispatch-batches")
def add_dispatch_batch(batch: BatchCreate, token: str = Header(None)):
    check_token(token, required_role="admin")
    return functions.add_dispatch_batch(
        destination=batch.destination,
        vehicle=batch.vehicle,
        status=batch.status,
        package_ids=batch.package_ids,
    )
