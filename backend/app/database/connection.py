from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from app.core.config import settings

_client: AsyncIOMotorClient = None


async def connect_db():
    global _client
    _client = AsyncIOMotorClient(settings.mongodb_uri)
    # Ping to verify connection
    await _client.admin.command("ping")
    print(f"[DB] Connected to MongoDB at {settings.mongodb_uri}")
    await _ensure_indexes()


async def close_db():
    global _client
    if _client:
        _client.close()
        print("[DB] MongoDB connection closed")


import asyncio

def get_database() -> AsyncIOMotorDatabase:
    global _client
    try:
        current_loop = asyncio.get_running_loop()
    except RuntimeError:
        current_loop = None

    if _client is None or getattr(_client, "_attached_loop", None) != current_loop:
        _client = AsyncIOMotorClient(settings.mongodb_uri)
        _client._attached_loop = current_loop
    return _client[settings.database_name]


async def get_db() -> AsyncIOMotorDatabase:
    return get_database()


async def _ensure_indexes():
    db = get_database()

    # users
    await db["users"].create_index("email", unique=True)

    # semesters
    await db["semesters"].create_index("semester_number")

    # subjects
    await db["subjects"].create_index("semester_id")
    await db["subjects"].create_index("subject_code")

    # units
    await db["units"].create_index("subject_id")

    # materials — text index on title + extracted_text for keyword search
    await db["materials"].create_index(
        [("title", "text"), ("extracted_text", "text"), ("description", "text")],
        name="materials_text_idx",
    )
    await db["materials"].create_index("semester_id")
    await db["materials"].create_index("subject_id")
    await db["materials"].create_index("unit_id")
    await db["materials"].create_index("status")

    # assignments
    await db["assignments"].create_index("subject_id")
    await db["assignments"].create_index("unit_id")

    # assignment_drafts
    await db["assignment_drafts"].create_index([("student_id", 1), ("assignment_id", 1)])

    # exams
    await db["exams"].create_index("subject_id")
    await db["exams"].create_index("status")

    # exam_questions
    await db["exam_questions"].create_index("exam_id")

    # exam_attempts
    await db["exam_attempts"].create_index([("exam_id", 1), ("student_id", 1)])
    await db["exam_attempts"].create_index("student_id")

    # student_answers
    await db["student_answers"].create_index("attempt_id")

    # learning_history
    await db["learning_history"].create_index("student_id")

    print("[DB] Indexes ensured")
