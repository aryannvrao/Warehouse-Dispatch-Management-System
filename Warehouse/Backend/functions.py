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
    arrival_date = Column(DateTime, default=datetime.now)
    status = Column(String)


Base.metadata.create_all(engine)


def add_package(name, destination, weight, arrival_date=None, status="received"):
    session = Session(engine)
    if arrival_date is None:
        arrival_dt = datetime.now()
    elif isinstance(arrival_date, str):
        try:
            arrival_dt = datetime.fromisoformat(arrival_date)
        except Exception:
            arrival_dt = datetime.now()
    else:
        arrival_dt = arrival_date

    package = Package(
        name=name,
        destination=destination,
        weight=float(weight),
        arrival_date=arrival_dt,
        status=status,
    )
    session.add(package)
    session.commit()
    session.refresh(package)
    response = {
        "id": package.id,
        "name": package.name,
        "destination": package.destination,
        "weight": package.weight,
        "arrival_date": package.arrival_date,
        "status": package.status,
    }
    session.close()
    return response


def get_all_packages(destination=None, status=None, arrival_date=None):
    session = Session(engine)
    query = session.query(Package)
    if destination:
        query = query.filter(Package.destination == destination)
    if status:
        query = query.filter(Package.status == status)
    if arrival_date:
        query = query.filter(Package.arrival_date == arrival_date)
    packages = query.all()
    response = []
    for package in packages:
        temp_package = {
            "id": package.id,
            "name": package.name,
            "destination": package.destination,
            "weight": package.weight,
            "arrival_date": package.arrival_date,
            "status": package.status,
        }
        response.append(temp_package)
    session.close()
    return response


def get_package(id):
    session = Session(engine)
    package = session.get(Package, id)
    if package is None:
        session.close()
        return None
    response = {
        "id": package.id,
        "name": package.name,
        "destination": package.destination,
        "weight": package.weight,
        "arrival_date": package.arrival_date,
        "status": package.status,
    }
    session.close()
    return response


def update_package(id, name=None, destination=None, weight=None, status=None):
    session = Session(engine)
    package = session.get(Package, id)
    if package is None:
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
    session.refresh(package)
    response = {
        "id": package.id,
        "name": package.name,
        "destination": package.destination,
        "weight": package.weight,
        "arrival_date": package.arrival_date,
        "status": package.status,
    }
    session.close()
    return response


def delete_package(id):
    session = Session(engine)
    package = session.get(Package, id)
    if package is None:
        session.close()
        return {"error": "not_found"}
    if package.status == "dispatched":
        session.close()
        return {"error": "dispatched"}

    session.delete(package)
    session.commit()
    session.close()
    return {"message": "Package deleted successfully"}
