import os
import shutil
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from fastapi.responses import FileResponse

from app.core.config import settings
from app.core.dependencies import get_current_user, require_admin
from app.database.connection import get_db
from app.utils.mongo_helpers import serialize_doc, serialize_list, to_object_id
from app.services.extractor import extract_text

router = APIRouter(tags=["Materials"])

ALLOWED_TYPES = {
    "application/pdf": "pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
    "text/plain": "txt",
}
MAX_BYTES = settings.max_file_size_mb * 1024 * 1024


@router.post("/admin/materials", status_code=201)
async def upload_material(
    title: str = Form(...),
    description: str = Form(""),
    semester_id: str = Form(...),
    subject_id: str = Form(...),
    unit_id: str = Form(""),
    file: UploadFile = File(...),
    db: AsyncIOMotorDatabase = Depends(get_db),
    admin=Depends(require_admin),
):
    # Validate file type
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(400, f"Unsupported file type: {file.content_type}")

    content = await file.read()
    if len(content) > MAX_BYTES:
        raise HTTPException(413, f"File exceeds {settings.max_file_size_mb} MB limit")

    # Save file to disk
    upload_dir = Path(settings.upload_dir)
    upload_dir.mkdir(parents=True, exist_ok=True)
    safe_name = f"{datetime.now(timezone.utc).timestamp()}_{file.filename}".replace(" ", "_")
    file_path = upload_dir / safe_name
    file_path.write_bytes(content)

    # Extract text
    file_type = ALLOWED_TYPES[file.content_type]
    extracted_text = ""
    extraction_error = None
    try:
        extracted_text = extract_text(str(file_path), file_type)
    except Exception as e:
        extraction_error = str(e)

    doc = {
        "title": title,
        "description": description,
        "semester_id": semester_id,
        "subject_id": subject_id,
        "unit_id": unit_id or None,
        "file_name": file.filename,
        "file_type": file_type,
        "storage_path": str(file_path),
        "uploaded_by": str(admin["_id"]),
        "extracted_text": extracted_text,
        "extraction_error": extraction_error,
        "status": "published",
        "created_at": datetime.now(timezone.utc),
    }
    result = await db["materials"].insert_one(doc)
    doc["_id"] = result.inserted_id
    return serialize_doc(doc)


@router.get("/materials")
async def list_materials(
    subject_id: Optional[str] = Query(None),
    semester_id: Optional[str] = Query(None),
    unit_id: Optional[str] = Query(None),
    file_type: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncIOMotorDatabase = Depends(get_db),
    user=Depends(get_current_user),
):
    query: dict = {}
    # Students see only published materials; admins see all
    if user.get("role") == "student":
        query["status"] = "published"
    if subject_id:
        query["subject_id"] = subject_id
    if semester_id:
        query["semester_id"] = semester_id
    if unit_id:
        query["unit_id"] = unit_id
    if file_type:
        query["file_type"] = file_type

    total = await db["materials"].count_documents(query)
    docs = (
        await db["materials"]
        .find(query, {"extracted_text": 0})  # exclude large text from listing
        .sort("created_at", -1)
        .skip(skip)
        .limit(limit)
        .to_list(length=limit)
    )
    return {"total": total, "items": serialize_list(docs)}


@router.get("/materials/search")
async def search_materials(
    q: str = Query(..., min_length=2),
    subject_id: Optional[str] = Query(None),
    semester_id: Optional[str] = Query(None),
    unit_id: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncIOMotorDatabase = Depends(get_db),
    user=Depends(get_current_user),
):
    query: dict = {"$text": {"$search": q}}
    if user.get("role") == "student":
        query["status"] = "published"
    if subject_id:
        query["subject_id"] = subject_id
    if semester_id:
        query["semester_id"] = semester_id
    if unit_id:
        query["unit_id"] = unit_id

    projection = {
        "score": {"$meta": "textScore"},
        "title": 1,
        "file_name": 1,
        "file_type": 1,
        "subject_id": 1,
        "unit_id": 1,
        "extracted_text": 1,
        "storage_path": 0,
    }

    cursor = (
        db["materials"]
        .find(query, projection)
        .sort([("score", {"$meta": "textScore"})])
        .skip(skip)
        .limit(limit)
    )
    docs = await cursor.to_list(length=limit)

    # Build snippet from extracted text
    results = []
    for d in docs:
        text = d.get("extracted_text", "")
        snippet = _extract_snippet(text, q)
        item = serialize_doc(d)
        item["snippet"] = snippet
        item.pop("extracted_text", None)
        results.append(item)

    return {"query": q, "results": results}


@router.get("/materials/{material_id}")
async def get_material(
    material_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
    user=Depends(get_current_user),
):
    oid = to_object_id(material_id)
    doc = await db["materials"].find_one({"_id": oid})
    if not doc:
        raise HTTPException(404, "Material not found")
    if user.get("role") == "student" and doc.get("status") != "published":
        raise HTTPException(403, "Material not available")
    return serialize_doc(doc)


@router.get("/materials/{material_id}/download")
async def download_material(
    material_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
    user=Depends(get_current_user),
):
    oid = to_object_id(material_id)
    doc = await db["materials"].find_one({"_id": oid}, {"storage_path": 1, "file_name": 1, "status": 1})
    if not doc:
        raise HTTPException(404, "Material not found")
    if user.get("role") == "student" and doc.get("status") != "published":
        raise HTTPException(403, "Material not available")
    path = doc["storage_path"]
    if not os.path.exists(path):
        raise HTTPException(404, "File not found on server")
    return FileResponse(path, filename=doc["file_name"])


@router.delete("/admin/materials/{material_id}", status_code=204)
async def delete_material(
    material_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
    admin=Depends(require_admin),
):
    oid = to_object_id(material_id)
    doc = await db["materials"].find_one({"_id": oid}, {"storage_path": 1})
    if not doc:
        raise HTTPException(404, "Material not found")
    # Remove file
    path = doc.get("storage_path")
    if path and os.path.exists(path):
        os.remove(path)
    await db["materials"].delete_one({"_id": oid})


@router.patch("/admin/materials/{material_id}/status", status_code=200)
async def toggle_material_status(
    material_id: str,
    status_value: str = Query(..., pattern="^(published|draft)$"),
    db: AsyncIOMotorDatabase = Depends(get_db),
    admin=Depends(require_admin),
):
    oid = to_object_id(material_id)
    result = await db["materials"].update_one({"_id": oid}, {"$set": {"status": status_value}})
    if result.matched_count == 0:
        raise HTTPException(404, "Material not found")
    return {"status": status_value}


def _extract_snippet(text: str, query: str, context: int = 200) -> str:
    """Return a text snippet around the first occurrence of the query keyword."""
    if not text:
        return ""
    lower_text = text.lower()
    lower_query = query.lower().split()[0]  # use first keyword
    idx = lower_text.find(lower_query)
    if idx == -1:
        return text[:context]
    start = max(0, idx - context // 2)
    end = min(len(text), idx + context // 2)
    snippet = text[start:end]
    if start > 0:
        snippet = "…" + snippet
    if end < len(text):
        snippet = snippet + "…"
    return snippet
