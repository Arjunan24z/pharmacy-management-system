from fastapi import APIRouter, HTTPException
from app.database import get_database
from app.models import Medicine, ALLOWED_MEDICINE_CATEGORIES
from bson import ObjectId
from datetime import datetime

router = APIRouter()

@router.post("/")
async def add_medicine(medicine: Medicine):
    db = get_database()
    result = await db.medicines.insert_one(medicine.dict())
    return {"id": str(result.inserted_id), "message": "Medicine added"}

@router.get("/")
async def get_medicines():
    db = get_database()
    medicines = await db.medicines.find().to_list(1000)
    for med in medicines:
        med["_id"] = str(med["_id"])
    return medicines

@router.get("/expiring")
async def get_expiring_medicines():
    db = get_database()
    medicines = await db.medicines.find().to_list(1000)
    expiring = []
    today = datetime.now()
    
    for med in medicines:
        exp_date = datetime.strptime(med["expiry_date"], "%Y-%m-%d")
        days_left = (exp_date - today).days
        if 0 < days_left <= 90:
            med["_id"] = str(med["_id"])
            med["days_until_expiry"] = days_left
            expiring.append(med)
    
    return sorted(expiring, key=lambda x: x["days_until_expiry"])

@router.get("/categories")
async def get_medicine_categories():
    return {"categories": list(ALLOWED_MEDICINE_CATEGORIES)}

@router.put("/{medicine_id}")
async def update_medicine(medicine_id: str, medicine: Medicine):
    db = get_database()
    result = await db.medicines.update_one(
        {"_id": ObjectId(medicine_id)},
        {"$set": medicine.dict()}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Medicine not found")
    return {"message": "Medicine updated"}

@router.delete("/{medicine_id}")
async def delete_medicine(medicine_id: str):
    db = get_database()
    result = await db.medicines.delete_one({"_id": ObjectId(medicine_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Medicine not found")
    return {"message": "Medicine deleted"}