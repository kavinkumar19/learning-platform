from fastapi import APIRouter, Depends, Query
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.dependencies import get_current_user, require_admin
from app.database.connection import get_db
from app.utils.mongo_helpers import serialize_list

router = APIRouter(tags=["History & Analytics"])


@router.get("/history")
async def get_my_history(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncIOMotorDatabase = Depends(get_db),
    user=Depends(get_current_user),
):
    student_id = str(user["_id"])
    docs = (
        await db["learning_history"]
        .find({"student_id": student_id})
        .sort("created_at", -1)
        .skip(skip)
        .limit(limit)
        .to_list(length=limit)
    )
    return serialize_list(docs)


@router.get("/admin/analytics")
async def get_analytics(
    db: AsyncIOMotorDatabase = Depends(get_db),
    admin=Depends(require_admin),
):
    """Returns real counts from MongoDB — no hardcoded numbers."""
    total_students = await db["users"].count_documents({"role": "student"})
    total_subjects = await db["subjects"].count_documents({})
    total_materials = await db["materials"].count_documents({})
    total_assignments = await db["assignments"].count_documents({})
    total_exams = await db["exams"].count_documents({})
    total_questions = await db["exam_questions"].count_documents({})
    total_attempts = await db["exam_attempts"].count_documents({"status": "submitted"})

    # Recent attempts (last 10)
    recent_attempts = (
        await db["exam_attempts"]
        .find({"status": "submitted"})
        .sort("submitted_at", -1)
        .limit(10)
        .to_list(length=10)
    )

    # Average score per exam (subject-wise performance)
    pipeline = [
        {"$match": {"status": "submitted", "score": {"$ne": None}}},
        {"$group": {
            "_id": "$exam_id",
            "avg_score": {"$avg": "$score"},
            "count": {"$sum": 1},
        }},
        {"$limit": 20},
    ]
    exam_perf = await db["exam_attempts"].aggregate(pipeline).to_list(length=20)

    return {
        "total_students": total_students,
        "total_subjects": total_subjects,
        "total_materials": total_materials,
        "total_assignments": total_assignments,
        "total_exams": total_exams,
        "total_questions": total_questions,
        "total_attempts": total_attempts,
        "recent_attempts": serialize_list(recent_attempts),
        "exam_performance": exam_perf,
    }
