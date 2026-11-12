from pathlib import Path
from datetime import datetime,timedelta
from sqlalchemy import Integer, String, Float, Column, DateTime, create_engine
from sqlalchemy.orm import Session, declarative_base
import jwt
DB_PATH = Path(__file__).resolve().with_name("warehouse.db")
engine = create_engine(f"sqlite:///{DB_PATH}")
Base = declarative_base()
ADMIN_USERNAME = "aryan"
ADMIN_PASSWORD = "aryan@06"
Acces_token_expiriry=15
SECRET_KEY="SECRET67"
ALGORITHM = 'HS256'

class Package(Base):
    __tablename__ = "packages"

    id = Column(Integer, primary_key=True)
    name = Column(String)
    destination = Column(String)
    weight = Column(Float)
    arrival_date = Column(DateTime, default=datetime.now())
    status = Column(String)


class DispatchBatch(Base):
    __tablename__ = "dispatch_batches"

    id = Column(Integer, primary_key=True)
    destination = Column(String)
    vehicle = Column(String)
    status = Column(String)


Base.metadata.create_all(engine)


# Seed sample batches if empty so Endpoint 6 has data to view
def init_sample_batches():
    session = Session(engine)
    if session.query(DispatchBatch).count() == 0:
        b1 = DispatchBatch(destination="New York", vehicle="Truck-A", status="pending")
        b2 = DispatchBatch(destination="Chicago", vehicle="Van-B", status="dispatched")
        session.add_all([b1, b2])
        session.commit()
    session.close()


init_sample_batches()


# 1. Add / Register a package
def add_package(name, destination, weight, status="received"):
    session = Session(engine)
    package = Package(
        name=name,
        destination=destination,
        weight=float(weight),
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


# 5. Search and filter packages (by destination, status, arrival date)
def get_all_packages(destination=None, status=None, arrival_date=None):
    session = Session(engine)
    packages = session.query(Package).all()
    response = []
    for package in packages:
        if destination and package.destination.lower() != destination.lower():
            continue
        if status and package.status.lower() != status.lower():
            continue
        if arrival_date and arrival_date not in str(package.arrival_date):
            continue
        temp_package = {
            "id": package.id,
            "name": package.name,
            "destination": package.destination,
            "weight": package.weight,
            "arrival_date": str(package.arrival_date),
            "status": package.status,
        }
        response.append(temp_package)
    session.close()
    return response


# 2. Get details of a specific package
def get_package(id):
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
def update_package(id, name=None, destination=None, weight=None, status=None):
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
def delete_package(id):
    session = Session(engine)
    package = session.get(Package, id)
    if not package:
        session.close()
        return "not_found"
    if package.status == "dispatched":
        session.close()
        return "dispatched"
    session.delete(package)
    session.commit()
    session.close()
    return "success"


# 6. View dispatch batches (filter by destination, vehicle, dispatch status)
def get_dispatch_batches(destination=None, vehicle=None, status=None):
    session = Session(engine)
    batches = session.query(DispatchBatch).all()
    response = []
    for batch in batches:
        if destination and batch.destination.lower() != destination.lower():
            continue
        if vehicle and batch.vehicle.lower() != vehicle.lower():
            continue
        if status and batch.status.lower() != status.lower():
            continue
        temp_batch = {
            "id": batch.id,
            "destination": batch.destination,
            "vehicle": batch.vehicle,
            "status": batch.status,
        }
        response.append(temp_batch)
    session.close()
    return response


def add_dispatch_batch(destination, vehicle, status="pending"):
    session = Session(engine)
    batch = DispatchBatch(
        destination=destination,
        vehicle=vehicle,
        status=status,
    )
    session.add(batch)
    session.commit()
    response = {
        "id": batch.id,
        "destination": batch.destination,
        "vehicle": batch.vehicle,
        "status": batch.status,
    }
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
        if dest in destination_counts:
            destination_counts[dest] += 1
        else:
            destination_counts[dest] = 1

    session.close()
    return {
        "total_packages": len(packages),
        "total_received": total_received,
        "total_pending": total_pending,
        "total_dispatched": total_dispatched,
        "destination_counts": destination_counts,
    }

def login(username: str, password: str):
    if username == ADMIN_USERNAME and password == ADMIN_PASSWORD:
        token=creat_token(username=username)
        return {"token": token}
    else:
        return None

def creat_token(username):
    payload={
        "username": username,

        "exp": datetime.now() + timedelta(minutes=Acces_token_expiriry) 
    }
    token=jwt.encode(payload=payload,key=SECRET_KEY,algorithm=ALGORITHM)
    return token

def verify_token(token:str):
    try:
        payload=jwt.decode(jwt=token,key=SECRET_KEY,algorithms=[ALGORITHM])
        return payload['username']
    except:
        return False