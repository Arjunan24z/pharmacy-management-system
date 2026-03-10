#!/usr/bin/env python3
"""
Post-migration verification for purchase order statuses.

Checks:
- Count by status
- Legacy status leftovers (approved, received)
- Sample purchase orders for evidence

Usage:
    python verify_po_status_migration.py
"""

import asyncio
import importlib
import os


MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "pharmacy_db")


async def run_verification() -> int:
    try:
        motor_module = importlib.import_module("motor.motor_asyncio")
        AsyncIOMotorClient = motor_module.AsyncIOMotorClient
    except ModuleNotFoundError:
        print("Missing dependency: motor")
        print("Install backend dependencies first: pip install -r requirements.txt")
        return 1

    print(f"Connecting to MongoDB: {MONGODB_URL}")
    print(f"Database: {DATABASE_NAME}")

    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DATABASE_NAME]

    try:
        await client.admin.command("ping")

        counts_pipeline = [
            {"$group": {"_id": "$status", "count": {"$sum": 1}}},
            {"$sort": {"_id": 1}},
        ]
        counts = await db.purchase_orders.aggregate(counts_pipeline).to_list(length=100)

        total = await db.purchase_orders.count_documents({})
        legacy_approved = await db.purchase_orders.count_documents({"status": "approved"})
        legacy_received = await db.purchase_orders.count_documents({"status": "received"})

        print("\n=== Purchase Order Status Counts ===")
        print(f"Total purchase orders: {total}")
        for row in counts:
            print(f"- {row.get('_id', 'unknown')}: {row.get('count', 0)}")

        print("\n=== Legacy Status Residuals ===")
        print(f"approved: {legacy_approved}")
        print(f"received: {legacy_received}")

        if legacy_approved == 0 and legacy_received == 0:
            print("Migration verification PASSED: no legacy statuses remaining.")
        else:
            print("Migration verification WARNING: legacy statuses still present.")

        sample_projection = {
            "po_number": 1,
            "status": 1,
            "created_at": 1,
            "ordered_at": 1,
            "delivered_at": 1,
            "approved_at": 1,
            "received_at": 1,
        }
        sample = await db.purchase_orders.find({}, sample_projection).sort("created_at", -1).limit(10).to_list(length=10)

        print("\n=== Latest 10 Purchase Orders (Sample) ===")
        if not sample:
            print("No purchase orders found")
        for po in sample:
            print(
                f"- {po.get('po_number', 'N/A')} | status={po.get('status', 'N/A')} | "
                f"created={po.get('created_at', '-') } | ordered={po.get('ordered_at', po.get('approved_at', '-'))} | "
                f"delivered={po.get('delivered_at', po.get('received_at', '-'))}"
            )

        return 0

    except Exception as exc:
        print(f"Verification failed: {exc}")
        return 1

    finally:
        client.close()


def main() -> int:
    return asyncio.run(run_verification())


if __name__ == "__main__":
    raise SystemExit(main())
