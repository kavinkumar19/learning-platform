from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


# ─── Exam ─────────────────────────────────────────────────────────────────────

class ExamCreate(BaseModel):
    title: str = Field(..., min_length=2)
    semester_id: str
    subject_id: str
    unit_id: Optional[str] = None
    duration_minutes: int = Field(60, ge=5)
    total_marks: int = Field(100, ge=1)
    negative_marking: float = Field(0.0, ge=0.0)
    status: str = Field("draft", pattern="^(published|draft)$")


class ExamUpdate(BaseModel):
    title: Optional[str] = None
    duration_minutes: Optional[int] = None
    total_marks: Optional[int] = None
    negative_marking: Optional[float] = None
    status: Optional[str] = None


class ExamOut(BaseModel):
    id: str
    title: str
    semester_id: str
    subject_id: str
    unit_id: Optional[str] = None
    duration_minutes: int
    total_marks: int
    negative_marking: float
    status: str
    created_by: str
    created_at: datetime


# ─── Question ─────────────────────────────────────────────────────────────────

VALID_QUESTION_TYPES = ("mcq", "2mark", "8mark", "12mark")


class QuestionCreate(BaseModel):
    question_text: str = Field(..., min_length=5)
    question_type: str = Field(..., pattern="^(mcq|2mark|8mark|12mark)$")
    marks: int = Field(..., ge=1)
    options: Optional[List[str]] = None     # MCQ only — 4 options
    correct_answer: Optional[str] = None   # MCQ only — never sent to student before submit
    model_answer: Optional[str] = None


class QuestionOut(BaseModel):
    id: str
    exam_id: str
    question_text: str
    question_type: str
    marks: int
    options: Optional[List[str]] = None
    model_answer: Optional[str] = None
    created_at: datetime
    # correct_answer intentionally omitted from student-facing schema


# ─── Attempt ──────────────────────────────────────────────────────────────────

class AnswerSubmit(BaseModel):
    question_id: str
    selected_answer: str


class ExamSubmit(BaseModel):
    answers: List[AnswerSubmit]


class AttemptOut(BaseModel):
    id: str
    exam_id: str
    student_id: str
    started_at: datetime
    submitted_at: Optional[datetime] = None
    score: Optional[float] = None
    status: str  # in_progress | submitted
