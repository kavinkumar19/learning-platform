from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class AssignmentCreate(BaseModel):
    title: str = Field(..., min_length=2)
    question: str = Field(..., min_length=10)
    semester_id: str
    subject_id: str
    unit_id: Optional[str] = None
    due_date: Optional[datetime] = None
    status: str = Field("published", pattern="^(published|draft)$")


class AssignmentUpdate(BaseModel):
    title: Optional[str] = None
    question: Optional[str] = None
    due_date: Optional[datetime] = None
    status: Optional[str] = None


class AssignmentOut(BaseModel):
    id: str
    title: str
    question: str
    semester_id: str
    subject_id: str
    unit_id: Optional[str] = None
    due_date: Optional[datetime] = None
    status: str
    created_by: str
    created_at: datetime


class DraftCreate(BaseModel):
    draft_text: str = ""


class DraftUpdate(BaseModel):
    draft_text: str


class DraftOut(BaseModel):
    id: str
    student_id: str
    assignment_id: str
    draft_text: str
    updated_at: datetime
