from fastapi import FastAPI, HTTPException, Header, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator
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


def check_token(token: str = Header(None), required_role: str = None) -> dict:
    if not token:
        raise HTTPException(status_code=401, detail="Invalid or missing token")

    user_info = functions.verify_token(token)
    if not user_info:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    user_role = user_info.get("role", "staff")
    if required_role and user_role != required_role:
        raise HTTPException(
            status_code=403,
            detail=f"Forbidden: {required_role.capitalize()} access required",
        )

    return user_info


# Schemas
class UserRegister(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=4, max_length=100)
    role: str = Field("staff")

    @field_validator("role")
    @classmethod
    def validate_role(cls, v: str) -> str:
        role = v.lower().strip()
        if role not in {"admin", "staff"}:
            raise ValueError("Role must be either 'admin' or 'staff'")
        return role


class LoginRequest(BaseModel):
    username: str
    password: str


class PackageCreate(BaseModel):
    name: str = Field(..., min_length=1)
    destination: str = Field(..., min_length=1)
    weight: float = Field(..., gt=0)
    arrival_date: str | None = None
    status: str = "received"

    @field_validator("name", "destination")
    @classmethod
    def validate_not_blank(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Field cannot be blank")
        return v.strip()

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str) -> str:
        valid = {"received", "pending", "dispatched"}
        if v.lower() not in valid:
            raise ValueError(f"Status must be one of: {', '.join(valid)}")
        return v.lower()


class PackageUpdate(BaseModel):
    name: str | None = Field(None, min_length=1)
    destination: str | None = Field(None, min_length=1)
    weight: float | None = Field(None, gt=0)
    status: str | None = None

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str | None) -> str | None:
        if v is not None:
            valid = {"received", "pending", "dispatched"}
            if v.lower() not in valid:
                raise ValueError(f"Status must be one of: {', '.join(valid)}")
            return v.lower()
        return v


class BatchCreate(BaseModel):
    destination: str = Field(..., min_length=1)
    vehicle: str = Field(..., min_length=1)
    status: str = "pending"
    package_ids: list[int] | None = None

    @field_validator("status")
    @classmethod
    def validate_batch_status(cls, v: str) -> str:
        valid = {"pending", "dispatched"}
        if v.lower() not in valid:
            raise ValueError(f"Batch status must be one of: {', '.join(valid)}")
        return v.lower()


class PackageFilter(BaseModel):
    destination: str | None = None
    status: str | None = None
    arrival_date: str | None = None


class BatchFilter(BaseModel):
    destination: str | None = None
    vehicle: str | None = None
    status: str | None = None


class MessageResponse(BaseModel):
    message: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token: str
    username: str
    role: str
    token_type: str = "bearer"


class PackageResponse(BaseModel):
    id: int
    name: str
    destination: str
    weight: float
    arrival_date: str
    status: str


class BatchResponse(BaseModel):
    id: int
    destination: str
    vehicle: str
    status: str
    assigned_package_ids: list[int] = []


class SummaryResponse(BaseModel):
    total_packages: int
    total_received: int
    total_pending: int
    total_dispatched: int
    destination_counts: dict[str, int]


# Endpoints
@app.get("/")
def root():
    return {"message": "Warehouse API is running", "docs": "/docs"}


@app.post("/register", response_model=MessageResponse)
def register(user: UserRegister):
    success = functions.register_user(
        username=user.username,
        password=user.password,
        role=user.role,
    )
    if not success:
        raise HTTPException(status_code=400, detail="Username already exists")
    return {"message": f"User '{user.username}' registered successfully as {user.role}"}


@app.post("/login", response_model=TokenResponse)
def login(username: str = None, password: str = None, login_data: LoginRequest = None):
    user = (login_data.username if login_data else None) or username
    pwd = (login_data.password if login_data else None) or password

    token_data = functions.login(username=user, password=pwd)
    if token_data:
        return token_data
    raise HTTPException(status_code=401, detail="Invalid username or password")


@app.post("/packages", response_model=PackageResponse)
def add_package(package: PackageCreate, token: str = Header(None)):
    check_token(token)
    return functions.add_package(
        name=package.name,
        destination=package.destination,
        weight=package.weight,
        arrival_date=package.arrival_date,
        status=package.status,
    )


@app.get("/packages/{package_id}", response_model=PackageResponse)
def get_package(package_id: int, token: str = Header(None)):
    check_token(token)
    package = functions.get_package(package_id)
    if not package:
        raise HTTPException(status_code=404, detail="Package not found")
    return package


@app.patch("/packages/{package_id}", response_model=PackageResponse)
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


@app.delete("/packages/{package_id}", response_model=MessageResponse)
def delete_package(package_id: int, token: str = Header(None)):
    check_token(token, required_role="admin")
    result = functions.delete_package(package_id)
    if result == "not_found":
        raise HTTPException(status_code=404, detail="Package not found")
    if result == "dispatched":
        raise HTTPException(status_code=400, detail="Cannot delete a package that has already been dispatched")
    return {"message": "Package deleted successfully"}


@app.get("/packages", response_model=list[PackageResponse])
def get_all_packages(filters: PackageFilter = Depends(), token: str = Header(None)):
    check_token(token)
    return functions.get_all_packages(
        destination=filters.destination,
        status=filters.status,
        arrival_date=filters.arrival_date,
    )


@app.get("/dispatch-batches", response_model=list[BatchResponse])
def get_dispatch_batches(filters: BatchFilter = Depends(), token: str = Header(None)):
    check_token(token)
    return functions.get_dispatch_batches(
        destination=filters.destination,
        vehicle=filters.vehicle,
        status=filters.status,
    )


@app.get("/analytics/summary", response_model=SummaryResponse)
def get_summary(token: str = Header(None)):
    check_token(token, required_role="admin")
    return functions.get_summary()


@app.post("/dispatch-batches", response_model=BatchResponse)
def add_dispatch_batch(batch: BatchCreate, token: str = Header(None)):
    check_token(token, required_role="admin")
    return functions.add_dispatch_batch(
        destination=batch.destination,
        vehicle=batch.vehicle,
        status=batch.status,
        package_ids=batch.package_ids,
    )
