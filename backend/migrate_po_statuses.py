#!/usr/bin/env python3
"""
One-time migration for purchase order statuses.

Purpose:
- Convert legacy PO statuses:
  - approved -> ordered
  - received -> delivered
- Preserve timeline metadata where possible:
  - approved_at -> ordered_at
  - approved_by -> ordered_by
  - received_at -> delivered_at

Usage:
- Dry run (default):
    python migrate_po_statuses.py
- Apply changes:
    python migrate_po_statuses.py --apply
"""

import argparse
import asyncio
import importlib
import os
from datetime import datetime


MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "pharmacy_db")

STATUS_MAP = {
    "approved": "ordered",
    "received": "delivered",
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Migrate purchase order statuses")
    parser.add_argument(
        "--apply",
        action="store_true",
        help="Apply migration changes. Without this flag, script runs in dry-run mode.",
    )
    return parser.parse_args()


async def build_updates(db):
    cursor = db.purchase_orders.find({"status": {"$in": list(STATUS_MAP.keys())}})
    docs = await cursor.to_list(length=None)

    updates = []
    for po in docs:
        old_status = (po.get("status") or "").strip().lower()
        new_status = STATUS_MAP.get(old_status)
        if not new_status:
            continue

        set_fields = {
            "status": new_status,
            "updated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        }

        if old_status == "approved":
            set_fields["ordered_at"] = po.get("ordered_at") or po.get("approved_at") or po.get("updated_at")
            set_fields["ordered_by"] = po.get("ordered_by") or po.get("approved_by") or "Admin"
            if po.get("order_notes") is None and po.get("approval_notes") is not None:
                set_fields["order_notes"] = po.get("approval_notes")

        if old_status == "received":
            set_fields["delivered_at"] = po.get("delivered_at") or po.get("received_at") or po.get("updated_at")

        updates.append(
            {
                "_id": po["_id"],
                "po_number": po.get("po_number", "N/A"),
                "old_status": old_status,
                "new_status": new_status,
                "set_fields": set_fields,
            }
        )

    return updates


async def run_migration(apply_changes: bool) -> int:
    try:
        motor_module = importlib.import_module("motor.motor_asyncio")
        AsyncIOMotorClient = motor_module.AsyncIOMotorClient
    except ModuleNotFoundError:
        print("Missing dependency: motor")
        print("Install backend dependencies first: pip install -r requirements.txt")
        return 1

    print(f"Connecting to MongoDB: {MONGODB_URL}")
    print(f"Database: {DATABASE_NAME}")
    print("Mode:", "APPLY" if apply_changes else "DRY RUN")

    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DATABASE_NAME]

    try:
        await client.admin.command("ping")
        updates = await build_updates(db)

        if not updates:
            print("No legacy purchase orders found. Nothing to migrate.")
            return 0

        print(f"Found {len(updates)} purchase orders to migrate:")
        for item in updates:
            print(
                f"- {item['po_number']}: {item['old_status']} -> {item['new_status']}"
            )

        if not apply_changes:
            print("\nDry run complete. Re-run with --apply to perform the migration.")
            return 0

        migrated = 0
        for item in updates:
            result = await db.purchase_orders.update_one(
                {"_id": item["_id"]},
                {"$set": item["set_fields"]},
            )
            migrated += result.modified_count

        print(f"\nMigration complete. Updated documents: {migrated}")
        return 0

    except Exception as exc:
        print(f"Migration failed: {exc}")
        return 1

    finally:
        client.close()


def main() -> int:
    args = parse_args()
    return asyncio.run(run_migration(apply_changes=args.apply))


if __name__ == "__main__":
    raise SystemExit(main())
