from fastapi import APIRouter, HTTPException
from app.database import get_database
from datetime import datetime
from bson import ObjectId
from typing import Optional

router = APIRouter()

STATUS_ALIASES = {
    "pending": "pending",
    "ordered": "ordered",
    "approved": "ordered",
    "delivered": "delivered",
    "received": "delivered",
    "cancelled": "cancelled",
}


def normalize_po_status(raw_status: Optional[str]) -> Optional[str]:
    if not raw_status:
        return None
    return STATUS_ALIASES.get(raw_status.strip().lower(), raw_status.strip().lower())


@router.get("/")
async def get_purchase_orders(
    status: Optional[str] = None,
    supplier_id: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
):
    """
    Get all purchase orders with optional filters.
    """
    db = get_database()
    
    try:
        # Build query
        query = {}
        if status:
            normalized_status = normalize_po_status(status)
            if normalized_status == "ordered":
                query["status"] = {"$in": ["ordered", "approved"]}
            elif normalized_status == "delivered":
                query["status"] = {"$in": ["delivered", "received"]}
            else:
                query["status"] = normalized_status
        if supplier_id:
            query["supplier_id"] = supplier_id
        if start_date:
            query["order_date"] = query.get("order_date", {})
            query["order_date"]["$gte"] = start_date
        if end_date:
            query["order_date"] = query.get("order_date", {})
            query["order_date"]["$lte"] = end_date
        
        # Fetch purchase orders
        po_cursor = db.purchase_orders.find(query).sort("created_at", -1)
        purchase_orders = await po_cursor.to_list(length=1000)
        
        # Convert ObjectId to string and fetch supplier names
        for po in purchase_orders:
            po["_id"] = str(po["_id"])
            
            # Get supplier name
            supplier = await db.suppliers.find_one({"_id": ObjectId(po["supplier_id"])})
            if supplier:
                po["supplier_name"] = supplier.get("name", "Unknown")
            else:
                po["supplier_name"] = "Unknown"
        
        return purchase_orders
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching purchase orders: {str(e)}")


@router.get("/{po_id}")
async def get_purchase_order(po_id: str):
    """
    Get a specific purchase order by ID.
    """
    db = get_database()
    
    try:
        po = await db.purchase_orders.find_one({"_id": ObjectId(po_id)})
        
        if not po:
            raise HTTPException(status_code=404, detail="Purchase order not found")
        
        po["_id"] = str(po["_id"])
        
        # Get supplier details
        supplier = await db.suppliers.find_one({"_id": ObjectId(po["supplier_id"])})
        if supplier:
            po["supplier_name"] = supplier.get("name", "Unknown")
            po["supplier_contact"] = supplier.get("phone", "")
        
        return po
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching purchase order: {str(e)}")


@router.post("/")
async def create_purchase_order(po: dict):
    """
    Create a new purchase order.
    """
    db = get_database()
    
    try:
        # Verify supplier exists
        supplier = await db.suppliers.find_one({"_id": ObjectId(po["supplier_id"])})
        if not supplier:
            raise HTTPException(status_code=404, detail="Supplier not found")
        
        # Generate PO number
        po_count = await db.purchase_orders.count_documents({})
        po["po_number"] = f"PO-{datetime.now().strftime('%Y%m%d')}-{po_count + 1:04d}"
        
        # Calculate total amount
        total_amount = 0
        for item in po.get("items", []):
            item_total = item.get("quantity", 0) * item.get("unit_price", 0)
            item["total_price"] = item_total
            total_amount += item_total
        
        po["total_amount"] = total_amount
        po["status"] = "pending"
        po["created_at"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        po["updated_at"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        po["order_date"] = po.get("order_date", datetime.now().strftime("%Y-%m-%d"))
        
        # Insert purchase order
        result = await db.purchase_orders.insert_one(po)
        
        # Update supplier statistics
        await db.suppliers.update_one(
            {"_id": ObjectId(po["supplier_id"])},
            {
                "$inc": {"total_orders": 1},
                "$set": {"updated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S")}
            }
        )
        
        # Fetch created PO
        created_po = await db.purchase_orders.find_one({"_id": result.inserted_id})
        created_po["_id"] = str(created_po["_id"])
        created_po["supplier_name"] = supplier.get("name", "Unknown")
        
        return created_po
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating purchase order: {str(e)}")


@router.put("/{po_id}")
async def update_purchase_order(po_id: str, po_data: dict):
    """
    Update an existing purchase order (only if status is pending).
    """
    db = get_database()
    
    try:
        # Check current status
        existing_po = await db.purchase_orders.find_one({"_id": ObjectId(po_id)})
        if not existing_po:
            raise HTTPException(status_code=404, detail="Purchase order not found")
        
        if normalize_po_status(existing_po.get("status")) != "pending":
            raise HTTPException(status_code=400, detail="Cannot update ordered or delivered purchase orders")
        
        # Remove _id from update data
        po_data.pop("_id", None)
        
        # Recalculate total if items changed
        if "items" in po_data:
            total_amount = 0
            for item in po_data["items"]:
                item_total = item.get("quantity", 0) * item.get("unit_price", 0)
                item["total_price"] = item_total
                total_amount += item_total
            po_data["total_amount"] = total_amount
        
        # Update timestamp
        po_data["updated_at"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        # Update PO
        result = await db.purchase_orders.update_one(
            {"_id": ObjectId(po_id)},
            {"$set": po_data}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Purchase order not found")
        
        # Fetch updated PO
        updated_po = await db.purchase_orders.find_one({"_id": ObjectId(po_id)})
        updated_po["_id"] = str(updated_po["_id"])
        
        return updated_po
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating purchase order: {str(e)}")


@router.put("/{po_id}/approve")
async def approve_purchase_order(po_id: str, approval_data: dict):
    """
    Mark a purchase order as ordered (legacy route name retained for compatibility).
    """
    db = get_database()
    
    try:
        # Check if PO exists and is pending
        po = await db.purchase_orders.find_one({"_id": ObjectId(po_id)})
        if not po:
            raise HTTPException(status_code=404, detail="Purchase order not found")
        
        if normalize_po_status(po.get("status")) != "pending":
            raise HTTPException(status_code=400, detail=f"Cannot place order for PO with status: {po.get('status')}")
        
        # Update status
        result = await db.purchase_orders.update_one(
            {"_id": ObjectId(po_id)},
            {
                "$set": {
                    "status": "ordered",
                    "ordered_by": approval_data.get("ordered_by") or approval_data.get("approved_by", "Admin"),
                    "ordered_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                    "updated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                    "order_notes": approval_data.get("notes", "")
                }
            }
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Purchase order not found")
        
        # Fetch updated PO
        updated_po = await db.purchase_orders.find_one({"_id": ObjectId(po_id)})
        updated_po["_id"] = str(updated_po["_id"])
        
        return updated_po
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error approving purchase order: {str(e)}")


@router.put("/{po_id}/receive")
async def receive_purchase_order(po_id: str, receive_data: dict):
    """
    Receive goods from purchase order and update inventory.
    """
    db = get_database()
    
    try:
        # Check if PO exists and is ordered
        po = await db.purchase_orders.find_one({"_id": ObjectId(po_id)})
        if not po:
            raise HTTPException(status_code=404, detail="Purchase order not found")
        
        if normalize_po_status(po.get("status")) != "ordered":
            raise HTTPException(status_code=400, detail=f"Can only receive ordered POs. Current status: {po.get('status')}")
        
        # Update inventory for each item
        items_received = receive_data.get("items_received", receive_data.get("items", []))
        
        for item in items_received:
            medicine_id = item.get("medicine_id")
            quantity_received = item.get("quantity_received", 0)
            batch_number = item.get("batch_number", "")
            
            if quantity_received > 0:
                # Find medicine
                medicine = await db.medicines.find_one({"_id": ObjectId(medicine_id)})
                
                if medicine:
                    # Update quantity
                    new_quantity = medicine.get("quantity", 0) + quantity_received
                    
                    update_data = {
                        "quantity": new_quantity,
                        "updated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                    }
                    
                    # Update batch number if provided
                    if batch_number:
                        update_data["batch_number"] = batch_number
                    
                    await db.medicines.update_one(
                        {"_id": ObjectId(medicine_id)},
                        {"$set": update_data}
                    )
        
        # Update PO status
        result = await db.purchase_orders.update_one(
            {"_id": ObjectId(po_id)},
            {
                "$set": {
                    "status": "delivered",
                    "received_by": receive_data.get("received_by", "Admin"),
                    "delivered_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                    "updated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                    "items_received": items_received,
                    "receive_notes": receive_data.get("notes", ""),
                    "payment_status": receive_data.get("payment_status", "pending")
                }
            }
        )
        
        # Update supplier total amount
        await db.suppliers.update_one(
            {"_id": ObjectId(po["supplier_id"])},
            {
                "$inc": {"total_amount": po.get("total_amount", 0)},
                "$set": {"updated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S")}
            }
        )
        
        # Fetch updated PO
        updated_po = await db.purchase_orders.find_one({"_id": ObjectId(po_id)})
        updated_po["_id"] = str(updated_po["_id"])
        
        return {
            "message": "Purchase order delivered and inventory updated",
            "purchase_order": updated_po
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error receiving purchase order: {str(e)}")


@router.put("/{po_id}/cancel")
async def cancel_purchase_order(po_id: str, cancel_data: dict):
    """
    Cancel a purchase order.
    """
    db = get_database()
    
    try:
        # Check if PO exists
        po = await db.purchase_orders.find_one({"_id": ObjectId(po_id)})
        if not po:
            raise HTTPException(status_code=404, detail="Purchase order not found")
        
        if normalize_po_status(po.get("status")) == "delivered":
            raise HTTPException(status_code=400, detail="Cannot cancel a delivered purchase order")
        
        # Update status
        result = await db.purchase_orders.update_one(
            {"_id": ObjectId(po_id)},
            {
                "$set": {
                    "status": "cancelled",
                    "cancelled_by": cancel_data.get("cancelled_by", "Admin"),
                    "cancelled_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                    "updated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                    "cancellation_reason": cancel_data.get("reason", "")
                }
            }
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Purchase order not found")
        
        # Fetch updated PO
        updated_po = await db.purchase_orders.find_one({"_id": ObjectId(po_id)})
        updated_po["_id"] = str(updated_po["_id"])
        
        return updated_po
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error cancelling purchase order: {str(e)}")


@router.delete("/{po_id}")
async def delete_purchase_order(po_id: str):
    """
    Delete a purchase order (only if status is pending or cancelled).
    """
    db = get_database()
    
    try:
        # Check status before deleting
        po = await db.purchase_orders.find_one({"_id": ObjectId(po_id)})
        if not po:
            raise HTTPException(status_code=404, detail="Purchase order not found")
        
        if po.get("status") not in ["pending", "cancelled"]:
            raise HTTPException(status_code=400, detail="Can only delete pending or cancelled purchase orders")
        
        # Delete PO
        result = await db.purchase_orders.delete_one({"_id": ObjectId(po_id)})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Purchase order not found")
        
        return {"message": "Purchase order deleted successfully"}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting purchase order: {str(e)}")


@router.get("/summary/statistics")
async def get_po_statistics():
    """
    Get overall purchase order statistics.
    """
    db = get_database()
    
    try:
        # Count by status
        total_pos = await db.purchase_orders.count_documents({})
        pending = await db.purchase_orders.count_documents({"status": "pending"})
        ordered = await db.purchase_orders.count_documents({"status": {"$in": ["ordered", "approved"]}})
        delivered = await db.purchase_orders.count_documents({"status": {"$in": ["delivered", "received"]}})
        cancelled = await db.purchase_orders.count_documents({"status": "cancelled"})
        
        # Calculate total amount (received orders only)
        pipeline = [
            {"$match": {"status": {"$in": ["delivered", "received"]}}},
            {"$group": {
                "_id": None,
                "total_amount": {"$sum": "$total_amount"}
            }}
        ]
        
        amount_cursor = db.purchase_orders.aggregate(pipeline)
        amount_result = await amount_cursor.to_list(length=1)
        total_amount = amount_result[0]["total_amount"] if amount_result else 0
        
        return {
            "total_purchase_orders": total_pos,
            "by_status": {
                "pending": pending,
                "ordered": ordered,
                "delivered": delivered,
                "cancelled": cancelled
            },
            "total_amount_received": total_amount
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching statistics: {str(e)}")
