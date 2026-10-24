from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


# ─── Semester ────────────────────────────────────────────────────────────────

class SemesterCreate(BaseModel):
    semester_number: int = Field(..., ge=1, le=8)
    academic_year: str = Field(..., example="2024-25")
    regulation: str = Field(..., example="R2021")
    is_active: bool = True


class SemesterUpdate(BaseModel):
    semester_number: Optional[int] = None
    academic_year: Optional[str] = None
    regulation: Optional[str] = None
    is_active: Optional[bool] = None


class SemesterOut(BaseModel):
    id: str
    semester_number: int
    academic_year: str
    regulation: str
    is_active: bool


# ─── Subject ─────────────────────────────────────────────────────────────────

class SubjectCreate(BaseModel):
    semester_id: str
    subject_code: str = Field(..., min_length=2, max_length=20)
    subject_name: str = Field(..., min_length=2, max_length=200)
    description: Optional[str] = None


class SubjectUpdate(BaseModel):
    subject_code: Optional[str] = None
    subject_name: Optional[str] = None
    description: Optional[str] = None


class SubjectOut(BaseModel):
    id: str
    semester_id: str
    subject_code: str
    subject_name: str
    description: Optional[str] = None


# ─── Unit ────────────────────────────────────────────────────────────────────

class UnitCreate(BaseModel):
    subject_id: str
    unit_number: int = Field(..., ge=1)
    unit_title: str = Field(..., min_length=2, max_length=200)


class UnitUpdate(BaseModel):
    unit_number: Optional[int] = None
    unit_title: Optional[str] = None


class UnitOut(BaseModel):
    id: str
    subject_id: str
    unit_number: int
    unit_title: str
