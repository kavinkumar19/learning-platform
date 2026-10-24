"""
Seed script: populates the database with sample development data.
Run: python seed.py
This is for DEVELOPMENT only. Clear this data before production.
"""
import asyncio
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
from app.core.security import hash_password

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "it_learnhub")


async def seed():
    client = AsyncIOMotorClient(MONGODB_URI)
    db = client[DATABASE_NAME]

    # Clear existing data
    collections = ["users", "semesters", "subjects", "units", "assignments", "exams", "exam_questions"]
    for col in collections:
        await db[col].delete_many({})

    # ── Users ──────────────────────────────────────────────────────────────────
    admin_result = await db["users"].insert_one({
        "name": "Admin Faculty",
        "email": "admin@itlearnhub.com",
        "password_hash": hash_password("admin123"),
        "role": "admin",
        "created_at": datetime.now(timezone.utc),
    })
    student_result = await db["users"].insert_one({
        "name": "Alice Student",
        "email": "alice@student.com",
        "password_hash": hash_password("student123"),
        "role": "student",
        "created_at": datetime.now(timezone.utc),
    })
    print(f"[seed] Created admin: admin@itlearnhub.com / admin123")
    print(f"[seed] Created student: alice@student.com / student123")

    # ── Semesters ─────────────────────────────────────────────────────────────
    sem_result = await db["semesters"].insert_one({
        "semester_number": 3,
        "academic_year": "2024-25",
        "regulation": "R2021",
        "is_active": True,
    })
    sem_id = str(sem_result.inserted_id)
    print(f"[seed] Created Semester 3 (id={sem_id})")

    # ── Subjects ──────────────────────────────────────────────────────────────
    sub_result = await db["subjects"].insert_one({
        "semester_id": sem_id,
        "subject_code": "CS301",
        "subject_name": "Database Management Systems",
        "description": "Fundamentals of relational databases, SQL, normalization and transactions.",
    })
    sub_id = str(sub_result.inserted_id)

    sub2_result = await db["subjects"].insert_one({
        "semester_id": sem_id,
        "subject_code": "CS302",
        "subject_name": "Operating Systems",
        "description": "Process management, memory, file systems and security.",
    })
    sub2_id = str(sub2_result.inserted_id)
    print(f"[seed] Created subjects: DBMS (id={sub_id}), OS (id={sub2_id})")

    # ── Units ─────────────────────────────────────────────────────────────────
    for i, title in enumerate([
        "Introduction to DBMS",
        "Relational Model and SQL",
        "Normalization",
        "Transactions and Concurrency",
        "NoSQL Databases",
    ], 1):
        await db["units"].insert_one({"subject_id": sub_id, "unit_number": i, "unit_title": title})

    unit_result = await db["units"].find_one({"subject_id": sub_id, "unit_number": 1})
    unit_id = str(unit_result["_id"])
    print("[seed] Created 5 units for DBMS")

    # ── Assignments ───────────────────────────────────────────────────────────
    await db["assignments"].insert_one({
        "title": "ER Diagram Design",
        "question": "Design an Entity-Relationship diagram for a college management system. "
                    "Include entities, attributes, primary keys and relationships. "
                    "Use study materials from Unit 1 to understand ER notation.",
        "semester_id": sem_id,
        "subject_id": sub_id,
        "unit_id": unit_id,
        "due_date": None,
        "status": "published",
        "created_by": str(admin_result.inserted_id),
        "created_at": datetime.now(timezone.utc),
    })
    await db["assignments"].insert_one({
        "title": "SQL Query Practice",
        "question": "Write SQL queries to: (1) Create a student table, "
                    "(2) Insert 5 records, (3) Find students with marks > 80, "
                    "(4) Update a student's grade, (5) Delete a student record.",
        "semester_id": sem_id,
        "subject_id": sub_id,
        "unit_id": unit_id,
        "due_date": None,
        "status": "published",
        "created_by": str(admin_result.inserted_id),
        "created_at": datetime.now(timezone.utc),
    })
    print("[seed] Created 2 sample assignments")

    # ── Exams ─────────────────────────────────────────────────────────────────
    exam_result = await db["exams"].insert_one({
        "title": "DBMS Unit 1 MCQ Test",
        "semester_id": sem_id,
        "subject_id": sub_id,
        "unit_id": unit_id,
        "duration_minutes": 30,
        "total_marks": 20,
        "negative_marking": 0.0,
        "status": "published",
        "created_by": str(admin_result.inserted_id),
        "created_at": datetime.now(timezone.utc),
    })
    exam_id = str(exam_result.inserted_id)

    sample_questions = [
        {
            "exam_id": exam_id,
            "question_text": "What does DBMS stand for?",
            "question_type": "mcq",
            "marks": 2,
            "options": ["Data Base Management System", "Digital Base Management System", "Data Binary Management System", "None of the above"],
            "correct_answer": "Data Base Management System",
            "model_answer": "DBMS stands for Database Management System.",
            "created_at": datetime.now(timezone.utc),
        },
        {
            "exam_id": exam_id,
            "question_text": "Which of the following is NOT a type of database model?",
            "question_type": "mcq",
            "marks": 2,
            "options": ["Relational Model", "Hierarchical Model", "Network Model", "Sequential Model"],
            "correct_answer": "Sequential Model",
            "model_answer": "Sequential Model is not a standard database model type.",
            "created_at": datetime.now(timezone.utc),
        },
        {
            "exam_id": exam_id,
            "question_text": "What is a primary key?",
            "question_type": "mcq",
            "marks": 2,
            "options": [
                "A key that uniquely identifies a record",
                "A key that can have NULL values",
                "A key used only for indexing",
                "A foreign key reference",
            ],
            "correct_answer": "A key that uniquely identifies a record",
            "model_answer": "A primary key uniquely identifies each record in a table and cannot be NULL.",
            "created_at": datetime.now(timezone.utc),
        },
        {
            "exam_id": exam_id,
            "question_text": "Which SQL command is used to retrieve data?",
            "question_type": "mcq",
            "marks": 2,
            "options": ["INSERT", "SELECT", "UPDATE", "DELETE"],
            "correct_answer": "SELECT",
            "model_answer": "The SELECT statement retrieves data from a database table.",
            "created_at": datetime.now(timezone.utc),
        },
        {
            "exam_id": exam_id,
            "question_text": "What is normalization in DBMS?",
            "question_type": "2mark",
            "marks": 2,
            "options": None,
            "correct_answer": None,
            "model_answer": "Normalization is the process of organizing a database to reduce redundancy "
                            "and improve data integrity by dividing large tables into smaller related tables.",
            "created_at": datetime.now(timezone.utc),
        },
    ]
    await db["exam_questions"].insert_many(sample_questions)
    print(f"[seed] Created exam '{exam_result.inserted_id}' with {len(sample_questions)} questions")

    # Ensure indexes
    await db["users"].create_index("email", unique=True)
    await db["materials"].create_index(
        [("title", "text"), ("extracted_text", "text"), ("description", "text")],
        name="materials_text_idx",
    )

    print("\n[seed] ✅ Seeding complete!")
    print("  Admin login: admin@itlearnhub.com / admin123")
    print("  Student login: alice@student.com / student123")
    client.close()


if __name__ == "__main__":
    asyncio.run(seed())
