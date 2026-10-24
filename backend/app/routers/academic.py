from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId

from app.database.connection import get_db
from app.schemas.academic import (
    SemesterCreate, SemesterUpdate, SemesterOut,
    SubjectCreate, SubjectUpdate, SubjectOut,
    UnitCreate, UnitUpdate, UnitOut,
)
from app.core.dependencies import get_current_user, require_admin
from app.utils.mongo_helpers import serialize_doc, serialize_list, to_object_id

router = APIRouter(tags=["Academic"])


# ─────────────────────────── SEMESTERS ───────────────────────────────────────

@router.get("/semesters", response_model=list[SemesterOut])
async def list_semesters(db: AsyncIOMotorDatabase = Depends(get_db), _=Depends(get_current_user)):
    docs = await db["semesters"].find().sort("semester_number", 1).to_list(length=100)
    return [SemesterOut(**serialize_doc(d)) for d in docs]


@router.post("/admin/semesters", response_model=SemesterOut, status_code=201)
async def create_semester(
    payload: SemesterCreate,
    db: AsyncIOMotorDatabase = Depends(get_db),
    admin=Depends(require_admin),
):
    doc = payload.model_dump()
    result = await db["semesters"].insert_one(doc)
    created = await db["semesters"].find_one({"_id": result.inserted_id})
    return SemesterOut(**serialize_doc(created))


@router.put("/admin/semesters/{semester_id}", response_model=SemesterOut)
async def update_semester(
    semester_id: str,
    payload: SemesterUpdate,
    db: AsyncIOMotorDatabase = Depends(get_db),
    admin=Depends(require_admin),
):
    oid = to_object_id(semester_id)
    update = {k: v for k, v in payload.model_dump().items() if v is not None}
    if not update:
        raise HTTPException(400, "No fields to update")
    await db["semesters"].update_one({"_id": oid}, {"$set": update})
    doc = await db["semesters"].find_one({"_id": oid})
    if not doc:
        raise HTTPException(404, "Semester not found")
    return SemesterOut(**serialize_doc(doc))


@router.delete("/admin/semesters/{semester_id}", status_code=204)
async def delete_semester(
    semester_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
    admin=Depends(require_admin),
):
    oid = to_object_id(semester_id)
    result = await db["semesters"].delete_one({"_id": oid})
    if result.deleted_count == 0:
        raise HTTPException(404, "Semester not found")


# ─────────────────────────── SUBJECTS ────────────────────────────────────────

@router.get("/semesters/{semester_id}/subjects", response_model=list[SubjectOut])
async def list_subjects(
    semester_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
    _=Depends(get_current_user),
):
    docs = await db["subjects"].find({"semester_id": semester_id}).to_list(length=200)
    return [SubjectOut(**serialize_doc(d)) for d in docs]


@router.post("/admin/subjects", response_model=SubjectOut, status_code=201)
async def create_subject(
    payload: SubjectCreate,
    db: AsyncIOMotorDatabase = Depends(get_db),
    admin=Depends(require_admin),
):
    doc = payload.model_dump()
    result = await db["subjects"].insert_one(doc)
    created = await db["subjects"].find_one({"_id": result.inserted_id})
    return SubjectOut(**serialize_doc(created))


@router.put("/admin/subjects/{subject_id}", response_model=SubjectOut)
async def update_subject(
    subject_id: str,
    payload: SubjectUpdate,
    db: AsyncIOMotorDatabase = Depends(get_db),
    admin=Depends(require_admin),
):
    oid = to_object_id(subject_id)
    update = {k: v for k, v in payload.model_dump().items() if v is not None}
    if not update:
        raise HTTPException(400, "No fields to update")
    await db["subjects"].update_one({"_id": oid}, {"$set": update})
    doc = await db["subjects"].find_one({"_id": oid})
    if not doc:
        raise HTTPException(404, "Subject not found")
    return SubjectOut(**serialize_doc(doc))


@router.delete("/admin/subjects/{subject_id}", status_code=204)
async def delete_subject(
    subject_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
    admin=Depends(require_admin),
):
    oid = to_object_id(subject_id)
    result = await db["subjects"].delete_one({"_id": oid})
    if result.deleted_count == 0:
        raise HTTPException(404, "Subject not found")


# ─────────────────────────── UNITS ───────────────────────────────────────────

@router.get("/subjects/{subject_id}/units", response_model=list[UnitOut])
async def list_units(
    subject_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
    _=Depends(get_current_user),
):
    docs = await db["units"].find({"subject_id": subject_id}).sort("unit_number", 1).to_list(length=100)
    return [UnitOut(**serialize_doc(d)) for d in docs]


@router.post("/admin/units", response_model=UnitOut, status_code=201)
async def create_unit(
    payload: UnitCreate,
    db: AsyncIOMotorDatabase = Depends(get_db),
    admin=Depends(require_admin),
):
    doc = payload.model_dump()
    result = await db["units"].insert_one(doc)
    created = await db["units"].find_one({"_id": result.inserted_id})
    return UnitOut(**serialize_doc(created))


@router.put("/admin/units/{unit_id}", response_model=UnitOut)
async def update_unit(
    unit_id: str,
    payload: UnitUpdate,
    db: AsyncIOMotorDatabase = Depends(get_db),
    admin=Depends(require_admin),
):
    oid = to_object_id(unit_id)
    update = {k: v for k, v in payload.model_dump().items() if v is not None}
    if not update:
        raise HTTPException(400, "No fields to update")
    await db["units"].update_one({"_id": oid}, {"$set": update})
    doc = await db["units"].find_one({"_id": oid})
    if not doc:
        raise HTTPException(404, "Unit not found")
    return UnitOut(**serialize_doc(doc))


@router.delete("/admin/units/{unit_id}", status_code=204)
async def delete_unit(
    unit_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
    admin=Depends(require_admin),
):
    oid = to_object_id(unit_id)
    result = await db["units"].delete_one({"_id": oid})
    if result.deleted_count == 0:
        raise HTTPException(404, "Unit not found")
