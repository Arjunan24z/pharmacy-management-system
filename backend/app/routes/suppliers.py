from fastapi import APIRouter, HTTPException
from app.database import get_database
from datetime import datetime
from bson import ObjectId
from typing import Optional

router = APIRouter()


@router.get("/")
async def get_suppliers(
    search: Optional[str] = None,
    active_only: bool = False
):
    """
    Get all suppliers with optional search and filters.
    """
    db = get_database()
    
    try:
        # Build query
        query = {}
        if search:
            query["$or"] = [
                {"name": {"$regex": search, "$options": "i"}},
                {"contact_person": {"$regex": search, "$options": "i"}},
                {"email": {"$regex": search, "$options": "i"}},
                {"phone": {"$regex": search, "$options": "i"}}
            ]
        
        if active_only:
            query["active"] = True
        
        # Fetch suppliers
        suppliers_cursor = db.suppliers.find(query).sort("name", 1)
        suppliers = await suppliers_cursor.to_list(length=1000)
        
        # Convert ObjectId to string
        for supplier in suppliers:
            supplier["_id"] = str(supplier["_id"])
        
        return suppliers
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching suppliers: {str(e)}")


@router.get("/{supplier_id}")
async def get_supplier(supplier_id: str):
    """
    Get a specific supplier by ID.
    """
    db = get_database()
    
    try:
        supplier = await db.suppliers.find_one({"_id": ObjectId(supplier_id)})
        
        if not supplier:
            raise HTTPException(status_code=404, detail="Supplier not found")
        
        supplier["_id"] = str(supplier["_id"])
        return supplier
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching supplier: {str(e)}")


@router.post("/")
async def create_supplier(supplier: dict):
    """
    Create a new supplier.
    """
    db = get_database()
    
    try:
        # Add metadata
        supplier["created_at"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        supplier["updated_at"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        supplier["active"] = supplier.get("active", True)
        supplier["rating"] = supplier.get("rating", 0)
        supplier["total_orders"] = 0
        supplier["total_amount"] = 0
        
        # Insert supplier
        result = await db.suppliers.insert_one(supplier)
        
        # Fetch created supplier
        created_supplier = await db.suppliers.find_one({"_id": result.inserted_id})
        created_supplier["_id"] = str(created_supplier["_id"])
        
        return created_supplier
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating supplier: {str(e)}")


@router.put("/{supplier_id}")
async def update_supplier(supplier_id: str, supplier: dict):
    """
    Update an existing supplier.
    """
    db = get_database()
    
    try:
        # Remove _id from update data if present
        supplier.pop("_id", None)
        
        # Update timestamp
        supplier["updated_at"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        # Update supplier
        result = await db.suppliers.update_one(
            {"_id": ObjectId(supplier_id)},
            {"$set": supplier}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Supplier not found")
        
        # Fetch updated supplier
        updated_supplier = await db.suppliers.find_one({"_id": ObjectId(supplier_id)})
        updated_supplier["_id"] = str(updated_supplier["_id"])
        
        return updated_supplier
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating supplier: {str(e)}")


@router.delete("/{supplier_id}")
async def delete_supplier(supplier_id: str):
    """
    Delete a supplier (soft delete - mark as inactive).
    """
    db = get_database()
    
    try:
        # Check if supplier has any purchase orders
        po_count = await db.purchase_orders.count_documents({"supplier_id": supplier_id})
        
        if po_count > 0:
            # Soft delete - mark as inactive
            result = await db.suppliers.update_one(
                {"_id": ObjectId(supplier_id)},
                {"$set": {"active": False, "updated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S")}}
            )
            
            if result.matched_count == 0:
                raise HTTPException(status_code=404, detail="Supplier not found")
            
            return {"message": f"Supplier deactivated (has {po_count} purchase orders)"}
        else:
            # Hard delete if no purchase orders
            result = await db.suppliers.delete_one({"_id": ObjectId(supplier_id)})
            
            if result.deleted_count == 0:
                raise HTTPException(status_code=404, detail="Supplier not found")
            
            return {"message": "Supplier deleted successfully"}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting supplier: {str(e)}")


@router.get("/{supplier_id}/history")
async def get_supplier_history(supplier_id: str):
    """
    Get purchase order history for a supplier.
    """
    db = get_database()
    
    try:
        # Verify supplier exists
        supplier = await db.suppliers.find_one({"_id": ObjectId(supplier_id)})
        if not supplier:
            raise HTTPException(status_code=404, detail="Supplier not found")
        
        # Get purchase orders
        po_cursor = db.purchase_orders.find({"supplier_id": supplier_id}).sort("created_at", -1)
        purchase_orders = await po_cursor.to_list(length=1000)
        
        # Convert ObjectId to string
        for po in purchase_orders:
            po["_id"] = str(po["_id"])
        
        # Calculate statistics
        total_orders = len(purchase_orders)
        completed_orders = len([
            po for po in purchase_orders if po.get("status") in ["delivered", "received"]
        ])
        pending_orders = len([
            po for po in purchase_orders if po.get("status") in ["pending", "ordered", "approved"]
        ])
        total_amount = sum([
            po.get("total_amount", 0) for po in purchase_orders if po.get("status") in ["delivered", "received"]
        ])
        
        return {
            "supplier": {
                "_id": str(supplier["_id"]),
                "name": supplier.get("name"),
                "rating": supplier.get("rating", 0)
            },
            "statistics": {
                "total_orders": total_orders,
                "completed_orders": completed_orders,
                "pending_orders": pending_orders,
                "total_amount": total_amount
            },
            "purchase_orders": purchase_orders
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching supplier history: {str(e)}")


@router.get("/{supplier_id}/stats")
async def get_supplier_stats(supplier_id: str):
    """
    Get statistics for a specific supplier.
    """
    db = get_database()
    
    try:
        supplier = await db.suppliers.find_one({"_id": ObjectId(supplier_id)})
        if not supplier:
            raise HTTPException(status_code=404, detail="Supplier not found")
        
        # Aggregate statistics from purchase orders
        pipeline = [
            {"$match": {"supplier_id": supplier_id}},
            {"$group": {
                "_id": "$status",
                "count": {"$sum": 1},
                "total_amount": {"$sum": "$total_amount"}
            }}
        ]
        
        stats_cursor = db.purchase_orders.aggregate(pipeline)
        stats = await stats_cursor.to_list(length=100)
        
        # Format response
        result = {
            "supplier_id": supplier_id,
            "supplier_name": supplier.get("name"),
            "by_status": {},
            "total_orders": 0,
            "total_amount": 0
        }
        
        for stat in stats:
            status = stat["_id"]
            result["by_status"][status] = {
                "count": stat["count"],
                "amount": stat["total_amount"]
            }
            result["total_orders"] += stat["count"]
            result["total_amount"] += stat["total_amount"]
        
        return result
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching supplier stats: {str(e)}")
