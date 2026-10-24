from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.dependencies import get_current_user, require_admin
from app.database.connection import get_db
from app.schemas.assignment import AssignmentCreate, AssignmentUpdate, AssignmentOut, DraftCreate, DraftUpdate, DraftOut
from app.utils.mongo_helpers import serialize_doc, serialize_list, to_object_id
from bson import ObjectId

router = APIRouter(tags=["Assignments"])


# ─────────────────────────── ASSIGNMENTS (Admin) ──────────────────────────────

@router.post("/admin/assignments", response_model=AssignmentOut, status_code=201)
async def create_assignment(
    payload: AssignmentCreate,
    db: AsyncIOMotorDatabase = Depends(get_db),
    admin=Depends(require_admin),
):
    doc = payload.model_dump()
    doc["created_by"] = str(admin["_id"])
    doc["created_at"] = datetime.now(timezone.utc)
    result = await db["assignments"].insert_one(doc)
    created = await db["assignments"].find_one({"_id": result.inserted_id})
    return AssignmentOut(**serialize_doc(created))


@router.put("/admin/assignments/{assignment_id}", response_model=AssignmentOut)
async def update_assignment(
    assignment_id: str,
    payload: AssignmentUpdate,
    db: AsyncIOMotorDatabase = Depends(get_db),
    admin=Depends(require_admin),
):
    oid = to_object_id(assignment_id)
    update = {k: v for k, v in payload.model_dump().items() if v is not None}
    if not update:
        raise HTTPException(400, "No fields to update")
    await db["assignments"].update_one({"_id": oid}, {"$set": update})
    doc = await db["assignments"].find_one({"_id": oid})
    if not doc:
        raise HTTPException(404, "Assignment not found")
    return AssignmentOut(**serialize_doc(doc))


@router.delete("/admin/assignments/{assignment_id}", status_code=204)
async def delete_assignment(
    assignment_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
    admin=Depends(require_admin),
):
    oid = to_object_id(assignment_id)
    result = await db["assignments"].delete_one({"_id": oid})
    if result.deleted_count == 0:
        raise HTTPException(404, "Assignment not found")


# ─────────────────────────── ASSIGNMENTS (Student) ───────────────────────────

@router.get("/assignments", response_model=list[AssignmentOut])
async def list_assignments(
    subject_id: Optional[str] = Query(None),
    unit_id: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncIOMotorDatabase = Depends(get_db),
    user=Depends(get_current_user),
):
    query: dict = {}
    if user.get("role") == "student":
        query["status"] = "published"
    if subject_id:
        query["subject_id"] = subject_id
    if unit_id:
        query["unit_id"] = unit_id

    docs = (
        await db["assignments"]
        .find(query)
        .sort("created_at", -1)
        .skip(skip)
        .limit(limit)
        .to_list(length=limit)
    )
    return [AssignmentOut(**serialize_doc(d)) for d in docs]


@router.get("/assignments/{assignment_id}", response_model=AssignmentOut)
async def get_assignment(
    assignment_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
    user=Depends(get_current_user),
):
    oid = to_object_id(assignment_id)
    doc = await db["assignments"].find_one({"_id": oid})
    if not doc:
        raise HTTPException(404, "Assignment not found")
    if user.get("role") == "student" and doc.get("status") != "published":
        raise HTTPException(403, "Assignment not available")
    return AssignmentOut(**serialize_doc(doc))


# ─────────────────────────── DRAFTS ──────────────────────────────────────────

@router.post("/assignments/{assignment_id}/drafts", response_model=DraftOut, status_code=201)
async def create_draft(
    assignment_id: str,
    payload: DraftCreate,
    db: AsyncIOMotorDatabase = Depends(get_db),
    user=Depends(get_current_user),
):
    # Verify assignment exists
    oid = to_object_id(assignment_id)
    assignment = await db["assignments"].find_one({"_id": oid})
    if not assignment:
        raise HTTPException(404, "Assignment not found")

    student_id = str(user["_id"])
    now = datetime.now(timezone.utc)

    # Upsert — one draft per student per assignment
    existing = await db["assignment_drafts"].find_one(
        {"student_id": student_id, "assignment_id": assignment_id}
    )
    if existing:
        await db["assignment_drafts"].update_one(
            {"_id": existing["_id"]},
            {"$set": {"draft_text": payload.draft_text, "updated_at": now}},
        )
        doc = await db["assignment_drafts"].find_one({"_id": existing["_id"]})
    else:
        doc_data = {
            "student_id": student_id,
            "assignment_id": assignment_id,
            "draft_text": payload.draft_text,
            "updated_at": now,
        }
        result = await db["assignment_drafts"].insert_one(doc_data)
        doc = await db["assignment_drafts"].find_one({"_id": result.inserted_id})

    return DraftOut(**serialize_doc(doc))


@router.get("/assignments/drafts/all", response_model=list[DraftOut])
async def list_my_drafts(
    db: AsyncIOMotorDatabase = Depends(get_db),
    user=Depends(get_current_user),
):
    student_id = str(user["_id"])
    docs = (
        await db["assignment_drafts"]
        .find({"student_id": student_id})
        .sort("updated_at", -1)
        .to_list(length=100)
    )
    return [DraftOut(**serialize_doc(d)) for d in docs]


@router.get("/assignments/{assignment_id}/drafts/my", response_model=DraftOut)
async def get_my_draft(
    assignment_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
    user=Depends(get_current_user),
):
    student_id = str(user["_id"])
    doc = await db["assignment_drafts"].find_one(
        {"student_id": student_id, "assignment_id": assignment_id}
    )
    if not doc:
        raise HTTPException(404, "No draft found for this assignment")
    return DraftOut(**serialize_doc(doc))


@router.put("/assignments/drafts/{draft_id}", response_model=DraftOut)
async def update_draft(
    draft_id: str,
    payload: DraftUpdate,
    db: AsyncIOMotorDatabase = Depends(get_db),
    user=Depends(get_current_user),
):
    oid = to_object_id(draft_id)
    doc = await db["assignment_drafts"].find_one({"_id": oid})
    if not doc:
        raise HTTPException(404, "Draft not found")
    # Ownership check — students can only edit their own drafts
    if str(user["_id"]) != doc["student_id"]:
        raise HTTPException(403, "You do not own this draft")
    now = datetime.now(timezone.utc)
    await db["assignment_drafts"].update_one(
        {"_id": oid}, {"$set": {"draft_text": payload.draft_text, "updated_at": now}}
    )
    updated = await db["assignment_drafts"].find_one({"_id": oid})
    return DraftOut(**serialize_doc(updated))


@router.delete("/assignments/drafts/{draft_id}", status_code=204)
async def delete_draft(
    draft_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
    user=Depends(get_current_user),
):
    oid = to_object_id(draft_id)
    doc = await db["assignment_drafts"].find_one({"_id": oid})
    if not doc:
        raise HTTPException(404, "Draft not found")
    if str(user["_id"]) != doc["student_id"]:
        raise HTTPException(403, "You do not own this draft")
    await db["assignment_drafts"].delete_one({"_id": oid})
