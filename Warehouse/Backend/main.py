from fastapi import FastAPI, HTTPException, Request
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
    return {"message": "Warehouse Dispatch Management System API", "docs": "/docs"}


@app.get("/packages")
def packages(destination: str = None, status: str = None, arrival_date: str = None):
    return functions.get_all_packages(
        destination=destination,
        status=status,
        arrival_date=arrival_date,
    )


@app.get("/packages/{package_id}")
def get_package(package_id: int):
    package = functions.get_package(package_id)
    if package is None:
        raise HTTPException(status_code=404, detail="Package not found")
    return package


@app.post("/packages")
async def add_package(
    name: str = None,
    destination: str = None,
    weight: float = None,
    arrival_date: str = None,
    status: str = "received",
    request: Request = None,
):
    if request:
        try:
            body = await request.json()
            if isinstance(body, dict):
                name = body.get("name", name)
                destination = body.get("destination", destination)
                weight = body.get("weight", weight)
                arrival_date = body.get("arrival_date", arrival_date)
                status = body.get("status", status or "received")
        except Exception:
            pass

    if not name or not destination or weight is None:
        raise HTTPException(
            status_code=422,
            detail="name, destination, and weight are required",
        )

    return functions.add_package(
        name=name,
        destination=destination,
        weight=weight,
        arrival_date=arrival_date,
        status=status,
    )


@app.patch("/packages/{package_id}")
async def update_package(
    package_id: int,
    name: str = None,
    destination: str = None,
    weight: float = None,
    status: str = None,
    request: Request = None,
):
    if request:
        try:
            body = await request.json()
            if isinstance(body, dict):
                name = body.get("name", name)
                destination = body.get("destination", destination)
                weight = body.get("weight", weight)
                status = body.get("status", status)
        except Exception:
            pass

    package = functions.get_package(package_id)
    if package is None:
        raise HTTPException(status_code=404, detail="Package not found")

    return functions.update_package(
        id=package_id,
        name=name,
        destination=destination,
        weight=weight,
        status=status,
    )


@app.delete("/packages/{package_id}")
def delete_package(package_id: int):
    result = functions.delete_package(package_id)
    if result.get("error") == "not_found":
        raise HTTPException(status_code=404, detail="Package not found")
    if result.get("error") == "dispatched":
        raise HTTPException(
            status_code=400,
            detail="Cannot delete a package that has already been dispatched",
        )
    return result
