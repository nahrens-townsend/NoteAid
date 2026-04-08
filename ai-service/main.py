import json
import os
import re

import google.generativeai as genai
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException

from prompt import build_prompt
from schema import NoteRequest, NoteResponse

load_dotenv()

genai.configure(api_key=os.environ["GEMINI_API_KEY"])

app = FastAPI(title="NoteAid AI Service")

_RESPONSE_SCHEMA = {
    "type": "object",
    "properties": {
        "subjective": {"type": "string"},
        "objective": {"type": "string"},
        "assessment": {"type": "string"},
        "plan": {"type": "string"},
        "confidence": {"type": "number"},
        "flags": {"type": "array", "items": {"type": "string"}},
    },
    "required": [
        "subjective",
        "objective",
        "assessment",
        "plan",
        "confidence",
        "flags",
    ],
}

_model = genai.GenerativeModel(
    model_name="gemini-3.1-flash-lite-preview",
    generation_config=genai.GenerationConfig(
        response_mime_type="application/json",
        response_schema=_RESPONSE_SCHEMA,
    ),
)

UNCERTAINTY_WORDS = {
    "likely",
    "maybe",
    "possibly",
    "appears",
    "seems",
    "might",
    "suspect",
}


def _heuristic_flags(text: str) -> list[str]:
    """Return words/phrases from text that match uncertainty vocabulary."""

    pattern = re.compile(
        r"\b(" + "|".join(re.escape(w) for w in UNCERTAINTY_WORDS) + r")\b",
        re.IGNORECASE,
    )
    found = pattern.findall(text)

    return found


def _heuristic_confidence(text: str) -> float:
    words = text.split()
    word_count = max(len(words), 1)
    uncertain_count = sum(
        1 for w in words if w.strip(".,;:!?").lower() in UNCERTAINTY_WORDS
    )
    raw = 1.0 - (uncertain_count / word_count) * 5
    return max(0.1, min(1.0, raw))


@app.post("/process-note", response_model=NoteResponse)
def process_note(request: NoteRequest) -> NoteResponse:
    prompt = build_prompt(request.raw_input)

    try:
        result = _model.generate_content(prompt)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Gemini API error: {exc}") from exc

    try:
        if not result.text:
            raise ValueError("Empty response from Gemini")
        data = json.loads(result.text)
    except (json.JSONDecodeError, ValueError) as exc:
        raise HTTPException(
            status_code=502, detail=f"Invalid JSON from Gemini: {exc}"
        ) from exc

    # Heuristic fallback: populate flags if LLM returned none
    full_text = " ".join(
        [
            data.get("subjective", ""),
            data.get("objective", ""),
            data.get("assessment", ""),
            data.get("plan", ""),
        ]
    )

    flags = data.get("flags") or []
    if not flags:
        flags = _heuristic_flags(full_text)

    confidence = data.get("confidence")
    if confidence is None:
        confidence = _heuristic_confidence(full_text)

    return NoteResponse(
        subjective=data.get("subjective", ""),
        objective=data.get("objective", ""),
        assessment=data.get("assessment", ""),
        plan=data.get("plan", ""),
        confidence=float(confidence),
        flags=flags,
    )
