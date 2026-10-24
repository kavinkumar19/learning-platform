from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId

from app.core.dependencies import get_current_user, require_admin
from app.database.connection import get_db
from app.schemas.exam import (
    ExamCreate, ExamUpdate, ExamOut,
    QuestionCreate, QuestionOut,
    ExamSubmit, AttemptOut,
)
from app.utils.mongo_helpers import serialize_doc, serialize_list, to_object_id

router = APIRouter(tags=["Exams"])


# ─────────────────────────── EXAM CRUD (Admin) ───────────────────────────────

@router.post("/admin/exams", response_model=ExamOut, status_code=201)
async def create_exam(
    payload: ExamCreate,
    db: AsyncIOMotorDatabase = Depends(get_db),
    admin=Depends(require_admin),
):
    doc = payload.model_dump()
    doc["created_by"] = str(admin["_id"])
    doc["created_at"] = datetime.now(timezone.utc)
    result = await db["exams"].insert_one(doc)
    created = await db["exams"].find_one({"_id": result.inserted_id})
    return ExamOut(**serialize_doc(created))


@router.put("/admin/exams/{exam_id}", response_model=ExamOut)
async def update_exam(
    exam_id: str,
    payload: ExamUpdate,
    db: AsyncIOMotorDatabase = Depends(get_db),
    admin=Depends(require_admin),
):
    oid = to_object_id(exam_id)
    update = {k: v for k, v in payload.model_dump().items() if v is not None}
    if not update:
        raise HTTPException(400, "No fields to update")
    await db["exams"].update_one({"_id": oid}, {"$set": update})
    doc = await db["exams"].find_one({"_id": oid})
    if not doc:
        raise HTTPException(404, "Exam not found")
    return ExamOut(**serialize_doc(doc))


@router.delete("/admin/exams/{exam_id}", status_code=204)
async def delete_exam(
    exam_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
    admin=Depends(require_admin),
):
    oid = to_object_id(exam_id)
    result = await db["exams"].delete_one({"_id": oid})
    if result.deleted_count == 0:
        raise HTTPException(404, "Exam not found")
    await db["exam_questions"].delete_many({"exam_id": exam_id})


# ─────────────────────────── QUESTION CRUD (Admin) ───────────────────────────

@router.post("/admin/exams/{exam_id}/questions", response_model=QuestionOut, status_code=201)
async def add_question(
    exam_id: str,
    payload: QuestionCreate,
    db: AsyncIOMotorDatabase = Depends(get_db),
    admin=Depends(require_admin),
):
    # Validate exam exists
    oid = to_object_id(exam_id)
    exam = await db["exams"].find_one({"_id": oid})
    if not exam:
        raise HTTPException(404, "Exam not found")

    if payload.question_type == "mcq":
        if not payload.options or len(payload.options) != 4:
            raise HTTPException(400, "MCQ questions require exactly 4 options")
        if not payload.correct_answer:
            raise HTTPException(400, "MCQ questions require a correct_answer")

    doc = payload.model_dump()
    doc["exam_id"] = exam_id
    doc["created_at"] = datetime.now(timezone.utc)
    result = await db["exam_questions"].insert_one(doc)
    created = await db["exam_questions"].find_one({"_id": result.inserted_id})
    return QuestionOut(**serialize_doc(created))


@router.delete("/admin/questions/{question_id}", status_code=204)
async def delete_question(
    question_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
    admin=Depends(require_admin),
):
    oid = to_object_id(question_id)
    result = await db["exam_questions"].delete_one({"_id": oid})
    if result.deleted_count == 0:
        raise HTTPException(404, "Question not found")


# ─────────────────────────── EXAMS (Student) ─────────────────────────────────

@router.get("/exams", response_model=list[ExamOut])
async def list_exams(
    subject_id: Optional[str] = Query(None),
    semester_id: Optional[str] = Query(None),
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
    if semester_id:
        query["semester_id"] = semester_id
    if unit_id:
        query["unit_id"] = unit_id

    docs = (
        await db["exams"]
        .find(query)
        .sort("created_at", -1)
        .skip(skip)
        .limit(limit)
        .to_list(length=limit)
    )
    return [ExamOut(**serialize_doc(d)) for d in docs]


@router.get("/exams/{exam_id}/questions")
async def get_exam_questions(
    exam_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
    user=Depends(get_current_user),
):
    """
    Return questions for an exam.
    - Students NEVER receive correct_answer.
    - Admins/faculty receive all fields.
    """
    oid = to_object_id(exam_id)
    exam = await db["exams"].find_one({"_id": oid})
    if not exam:
        raise HTTPException(404, "Exam not found")
    if user.get("role") == "student" and exam.get("status") != "published":
        raise HTTPException(403, "Exam not available")

    is_admin = user.get("role") in ("admin", "faculty")
    projection = None if is_admin else {"correct_answer": 0}  # hide from students

    questions = await db["exam_questions"].find({"exam_id": exam_id}, projection).to_list(length=500)
    return serialize_list(questions)


# ─────────────────────────── ATTEMPT ─────────────────────────────────────────

@router.post("/exams/{exam_id}/start", response_model=AttemptOut, status_code=201)
async def start_exam(
    exam_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
    user=Depends(get_current_user),
):
    oid = to_object_id(exam_id)
    exam = await db["exams"].find_one({"_id": oid})
    if not exam:
        raise HTTPException(404, "Exam not found")
    if exam.get("status") != "published":
        raise HTTPException(403, "Exam is not published")

    student_id = str(user["_id"])
    # Check for existing in-progress attempt
    existing = await db["exam_attempts"].find_one(
        {"exam_id": exam_id, "student_id": student_id, "status": "in_progress"}
    )
    if existing:
        return AttemptOut(**serialize_doc(existing))

    attempt = {
        "exam_id": exam_id,
        "student_id": student_id,
        "started_at": datetime.now(timezone.utc),
        "submitted_at": None,
        "score": None,
        "status": "in_progress",
    }
    result = await db["exam_attempts"].insert_one(attempt)
    attempt["_id"] = result.inserted_id

    # Log learning history
    await db["learning_history"].insert_one({
        "student_id": student_id,
        "activity_type": "exam_started",
        "reference_id": exam_id,
        "created_at": datetime.now(timezone.utc),
    })

    return AttemptOut(**serialize_doc(attempt))


@router.post("/exams/{exam_id}/submit")
async def submit_exam(
    exam_id: str,
    payload: ExamSubmit,
    db: AsyncIOMotorDatabase = Depends(get_db),
    user=Depends(get_current_user),
):
    student_id = str(user["_id"])

    # Find active attempt
    attempt = await db["exam_attempts"].find_one(
        {"exam_id": exam_id, "student_id": student_id, "status": "in_progress"}
    )
    if not attempt:
        raise HTTPException(404, "No active attempt found. Start the exam first.")

    # Get all MCQ questions with correct answers (server-side only)
    questions = await db["exam_questions"].find({"exam_id": exam_id}).to_list(length=500)
    q_map = {str(q["_id"]): q for q in questions}

    # Fetch exam for negative marking config
    oid = to_object_id(exam_id)
    exam = await db["exams"].find_one({"_id": oid})
    negative_marking = exam.get("negative_marking", 0.0) if exam else 0.0

    # Score calculation (backend only)
    total_score = 0.0
    student_answer_docs = []
    now = datetime.now(timezone.utc)

    for answer in payload.answers:
        q = q_map.get(answer.question_id)
        if not q:
            continue
        marks_awarded = 0.0
        if q.get("question_type") == "mcq":
            if answer.selected_answer == q.get("correct_answer"):
                marks_awarded = float(q.get("marks", 1))
            elif answer.selected_answer:  # wrong answer
                marks_awarded = -negative_marking
        # Descriptive answers are not auto-graded
        total_score += marks_awarded
        student_answer_docs.append({
            "attempt_id": str(attempt["_id"]),
            "question_id": answer.question_id,
            "selected_answer": answer.selected_answer,
            "marks_awarded": marks_awarded,
        })

    if student_answer_docs:
        await db["student_answers"].insert_many(student_answer_docs)

    # Update attempt
    await db["exam_attempts"].update_one(
        {"_id": attempt["_id"]},
        {"$set": {"status": "submitted", "submitted_at": now, "score": max(0, total_score)}},
    )

    # Log history
    await db["learning_history"].insert_one({
        "student_id": student_id,
        "activity_type": "exam_submitted",
        "reference_id": exam_id,
        "created_at": now,
    })

    return {
        "attempt_id": str(attempt["_id"]),
        "score": max(0, total_score),
        "submitted_at": now.isoformat(),
    }


@router.get("/results")
async def list_results(
    db: AsyncIOMotorDatabase = Depends(get_db),
    user=Depends(get_current_user),
):
    student_id = str(user["_id"])
    attempts = (
        await db["exam_attempts"]
        .find({"student_id": student_id, "status": "submitted"})
        .sort("submitted_at", -1)
        .to_list(length=50)
    )
    return serialize_list(attempts)


@router.get("/results/{attempt_id}")
async def get_result(
    attempt_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
    user=Depends(get_current_user),
):
    oid = to_object_id(attempt_id)
    attempt = await db["exam_attempts"].find_one({"_id": oid})
    if not attempt:
        raise HTTPException(404, "Attempt not found")

    # Students can only view their own results
    if user.get("role") == "student" and attempt["student_id"] != str(user["_id"]):
        raise HTTPException(403, "Access denied")

    # Get answers and questions
    answers = await db["student_answers"].find({"attempt_id": attempt_id}).to_list(length=500)
    questions = await db["exam_questions"].find({"exam_id": attempt["exam_id"]}).to_list(length=500)
    q_map = {str(q["_id"]): q for q in questions}

    # Build result detail with model answers (safe to share post-submission)
    detail = []
    for ans in answers:
        q = q_map.get(ans["question_id"], {})
        detail.append({
            "question_id": ans["question_id"],
            "question_text": q.get("question_text", ""),
            "question_type": q.get("question_type", ""),
            "selected_answer": ans["selected_answer"],
            "correct_answer": q.get("correct_answer"),  # shown post-submission
            "model_answer": q.get("model_answer"),
            "marks_awarded": ans["marks_awarded"],
            "marks": q.get("marks", 0),
        })

    return {
        "attempt": serialize_doc(attempt),
        "answers": detail,
    }
