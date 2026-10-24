from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class MaterialOut(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    semester_id: str
    subject_id: str
    unit_id: Optional[str] = None
    file_name: str
    file_type: str
    uploaded_by: str
    status: str
    created_at: datetime


class MaterialSearchResult(BaseModel):
    id: str
    title: str
    file_name: str
    file_type: str
    subject_id: str
    unit_id: Optional[str] = None
    snippet: str
    score: Optional[float] = None
