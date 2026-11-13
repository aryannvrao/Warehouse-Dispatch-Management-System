from pathlib import Path
from datetime import datetime, timedelta, timezone
from sqlalchemy import Integer, String, Float, Column, DateTime, create_engine
from sqlalchemy.orm import Session, declarative_base
import jwt
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError

DB_PATH = Path(__file__).resolve().with_name("warehouse.db")
engine = create_engine(f"sqlite:///{DB_PATH}")
Base = declarative_base()

# --- JWT Configuration ---
ACCESS_TOKEN_EXPIRY = 60  # minutes
REFRESH_TOKEN_EXPIRY = 7   # days
SECRET_KEY = "SECRET67_WAREHOUSE_DISPATCH_JWT_KEY_2026"
ALGORITHM = "HS256"

# Password hasher
ph = PasswordHasher()


# ==========================================
# Database Models
# ==========================================

class User(Base):
    __tablename__ = "users"

    user_id = Column(Integer, primary_key=True)
    username = Column(String, unique=True, nullable=False)
    password = Column(String, nullable=False)
    role = Column(String, default="staff")  # "admin" or "staff"


class Package(Base):
    __tablename__ = "packages"

    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    destination = Column(String, nullable=False)
    weight = Column(Float, nullable=False)
    arrival_date = Column(DateTime, default=datetime.now)
    status = Column(String, default="received")


class DispatchBatch(Base):
    __tablename__ = "dispatch_batches"

    id = Column(Integer, primary_key=True)
    destination = Column(String, nullable=False)
    vehicle = Column(String, nullable=False)
    status = Column(String, default="pending")


Base.metadata.create_all(engine)


# ==========================================
# Initialize Sample Data (Users + Batches)
# ==========================================

def init_sample_data():
    session = Session(engine)

    # 1. Seed Batches if empty
    if session.query(DispatchBatch).count() == 0:
        b1 = DispatchBatch(destination="New York", vehicle="Truck-A", status="pending")
        b2 = DispatchBatch(destination="Chicago", vehicle="Van-B", status="dispatched")
        session.add_all([b1, b2])
        session.commit()

    # 2. Seed Default Users with Hashed Passwords
    # Admin 1: admin / admin123 (role: admin)
    # Admin 2: aryan / aryan@06 (role: admin)
    # Staff 1: staff / staff123 (role: staff)
    if session.query(User).count() == 0:
        users = [
            User(username="admin", password=ph.hash("admin123"), role="admin"),
            User(username="aryan", password=ph.hash("aryan@06"), role="admin"),
            User(username="staff", password=ph.hash("staff123"), role="staff"),
        ]
        session.add_all(users)
        session.commit()

    session.close()


init_sample_data()


# ==========================================
# JWT Token Functions
# ==========================================

def create_token(username: str, role: str = "staff", token_type: str = "access"):
    if token_type == "access":
        payload = {
            "username": username,
            "role": role,
            "exp": datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRY),
        }
    else:
        payload = {
            "username": username,
            "role": role,
            "exp": datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRY),
        }
    return jwt.encode(payload=payload, key=SECRET_KEY, algorithm=ALGORITHM)


def verify_token(token: str, token_type: str = "access"):
    if not token:
        return False
    try:
        payload = jwt.decode(jwt=token, key=SECRET_KEY, algorithms=[ALGORITHM])
        return {
            "username": payload.get("username"),
            "role": payload.get("role", "staff"),
        }
    except Exception:
        return False


# ==========================================
# User Authentication (Argon2 Hashing)
# ==========================================

def register_user(username: str, password: str, role: str = "staff"):
    session = Session(engine)
    user_exists = session.query(User).filter_by(username=username).first()
    if user_exists:
        session.close()
        return False

    valid_role = role if role in ["admin", "staff"] else "staff"
    new_user = User(
        username=username,
        password=ph.hash(password),
        role=valid_role,
    )
    session.add(new_user)
    session.commit()
    session.close()
    return True


def login(username: str, password: str):
    session = Session(engine)
    user = session.query(User).filter_by(username=username).first()
    session.close()
    if not user:
        return None

    try:
        if ph.verify(user.password, password):
            access_token = create_token(username=user.username, role=user.role, token_type="access")
            refresh_token = create_token(username=user.username, role=user.role, token_type="refresh")
            return {
                "access_token": access_token,
                "refresh_token": refresh_token,
                "token": access_token,
                "username": user.username,
                "role": user.role,
            }
    except VerifyMismatchError:
        return None
    return None


# ==========================================
# Warehouse Package & Batch CRUD Functions
# ==========================================

# 1. Register a package
def add_package(name, destination, weight, arrival_date=None, status="received"):
    session = Session(engine)
    parsed_date = None
    if arrival_date:
        try:
            parsed_date = datetime.fromisoformat(arrival_date)
        except Exception:
            parsed_date = datetime.now()
    else:
        parsed_date = datetime.now()

    package = Package(
        name=name,
        destination=destination,
        weight=float(weight),
        arrival_date=parsed_date,
        status=status,
    )
    session.add(package)
    session.commit()
    response = {
        "id": package.id,
        "name": package.name,
        "destination": package.destination,
        "weight": package.weight,
        "arrival_date": str(package.arrival_date),
        "status": package.status,
    }
    session.close()
    return response


# 2. Get details of a specific package
def get_package(id: int):
    session = Session(engine)
    package = session.get(Package, id)
    if not package:
        session.close()
        return None
    response = {
        "id": package.id,
        "name": package.name,
        "destination": package.destination,
        "weight": package.weight,
        "arrival_date": str(package.arrival_date),
        "status": package.status,
    }
    session.close()
    return response


# 3. Partially update package details
def update_package(id: int, name=None, destination=None, weight=None, status=None):
    session = Session(engine)
    package = session.get(Package, id)
    if not package:
        session.close()
        return None
    if name is not None:
        package.name = name
    if destination is not None:
        package.destination = destination
    if weight is not None:
        package.weight = float(weight)
    if status is not None:
        package.status = status
    session.commit()
    response = {
        "id": package.id,
        "name": package.name,
        "destination": package.destination,
        "weight": package.weight,
        "arrival_date": str(package.arrival_date),
        "status": package.status,
    }
    session.close()
    return response


# 4. Delete a package (only if not dispatched)
def delete_package(id: int):
    session = Session(engine)
    package = session.get(Package, id)
    if not package:
        session.close()
        return "not_found"
    if package.status.lower() == "dispatched":
        session.close()
        return "dispatched"
    session.delete(package)
    session.commit()
    session.close()
    return "success"


# 5. Search and filter packages (by destination, status, arrival date)
def get_all_packages(destination=None, status=None, arrival_date=None):
    session = Session(engine)
    packages = session.query(Package).all()
    response = []
    for package in packages:
        if destination and destination.lower() not in package.destination.lower():
            continue
        if status and package.status.lower() != status.lower():
            continue
        if arrival_date and arrival_date not in str(package.arrival_date):
            continue
        response.append({
            "id": package.id,
            "name": package.name,
            "destination": package.destination,
            "weight": package.weight,
            "arrival_date": str(package.arrival_date),
            "status": package.status,
        })
    session.close()
    return response


# 6. View dispatch batches (filter by destination, vehicle, dispatch status)
def get_dispatch_batches(destination=None, vehicle=None, status=None):
    session = Session(engine)
    batches = session.query(DispatchBatch).all()
    response = []
    for batch in batches:
        if destination and destination.lower() not in batch.destination.lower():
            continue
        if vehicle and vehicle.lower() not in batch.vehicle.lower():
            continue
        if status and batch.status.lower() != status.lower():
            continue
        response.append({
            "id": batch.id,
            "destination": batch.destination,
            "vehicle": batch.vehicle,
            "status": batch.status,
        })
    session.close()
    return response


# 7. Get warehouse statistics (dispatch summary)
def get_summary():
    session = Session(engine)
    packages = session.query(Package).all()

    total_received = 0
    total_pending = 0
    total_dispatched = 0
    destination_counts = {}

    for package in packages:
        if package.status == "received":
            total_received += 1
        elif package.status == "pending":
            total_pending += 1
        elif package.status == "dispatched":
            total_dispatched += 1

        dest = package.destination
        destination_counts[dest] = destination_counts.get(dest, 0) + 1

    session.close()
    return {
        "total_packages": len(packages),
        "total_received": total_received,
        "total_pending": total_pending,
        "total_dispatched": total_dispatched,
        "destination_counts": destination_counts,
    }


# 8. Add dispatch batch manually and assign packages
def add_dispatch_batch(destination: str, vehicle: str, status: str = "pending", package_ids: list[int] = None):
    session = Session(engine)
    batch = DispatchBatch(
        destination=destination,
        vehicle=vehicle,
        status=status,
    )
    session.add(batch)
    session.commit()

    assigned_packages = []
    if package_ids:
        for pkg_id in package_ids:
            pkg = session.get(Package, pkg_id)
            if pkg:
                pkg.status = "dispatched" if status.lower() == "dispatched" else "pending"
                assigned_packages.append(pkg.id)
        session.commit()

    response = {
        "id": batch.id,
        "destination": batch.destination,
        "vehicle": batch.vehicle,
        "status": batch.status,
        "assigned_package_ids": assigned_packages,
    }
    session.close()
    return response
