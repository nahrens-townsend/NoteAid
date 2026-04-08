from pydantic import BaseModel, field_validator
from typing import List


class NoteRequest(BaseModel):
    raw_input: str

    @field_validator("raw_input")
    @classmethod
    def raw_input_must_be_valid(cls, v: str) -> str:
        if len(v) < 10:
            raise ValueError("Input must be at least 10 characters long")
        if len(v) > 10000:
            raise ValueError("Input must be at most 10,000 characters long")
        return v


class NoteResponse(BaseModel):
    subjective: str
    objective: str
    assessment: str
    plan: str
    confidence: float
    flags: List[str]
