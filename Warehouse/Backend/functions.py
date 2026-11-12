from pathlib import Path
from datetime import datetime
from sqlalchemy import Integer, String, Float, Column, DateTime, create_engine
from sqlalchemy.orm import Session, declarative_base

DB_PATH = Path(__file__).resolve().with_name("warehouse.db")
engine = create_engine(f"sqlite:///{DB_PATH}")
Base = declarative_base()


class Package(Base):
    __tablename__ = "packages"

    id = Column(Integer, primary_key=True)
    name = Column(String)
    destination = Column(String)
    weight = Column(Float)
    arrival_date = Column(DateTime, default=datetime.now())
    status = Column(String)


Base.metadata.create_all(engine)


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


# Get all packages (to display the list)
def get_all_packages():
    session = Session(engine)
    packages = session.query(Package).all()
    response = []
    for package in packages:
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
