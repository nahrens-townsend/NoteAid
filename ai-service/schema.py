from pydantic import BaseModel
from typing import List


class NoteRequest(BaseModel):
    raw_input: str


class NoteResponse(BaseModel):
    subjective: str
    objective: str
    assessment: str
    plan: str
    confidence: float
    flags: List[str]
