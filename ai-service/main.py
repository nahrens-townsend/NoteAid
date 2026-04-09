import asyncio
import json
import os
import re

import google.generativeai as genai
import websockets
import websockets.asyncio.client
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect

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


_DEEPGRAM_URL = (
    "wss://api.deepgram.com/v1/listen"
    "?model=nova-2-medical"
    "&interim_results=true"
    "&punctuate=true"
    "&smart_format=true"
)


@app.websocket("/ws/transcribe")
async def ws_transcribe(websocket: WebSocket) -> None:
    """Receive binary audio chunks and return partial/final transcript frames.

    Frame format sent to client:
        {"type": "partial" | "final", "text": "..."}

    Audio forwarded to Deepgram nova-2-medical via their streaming WebSocket API.
    """
    await websocket.accept()
    api_key = os.environ["DEEPGRAM_API_KEY"]

    try:
        async with websockets.asyncio.client.connect(
            _DEEPGRAM_URL,
            additional_headers={"Authorization": f"Token {api_key}"},
        ) as dg_ws:

            async def relay_deepgram_to_client() -> None:
                async for raw in dg_ws:
                    try:
                        data = json.loads(raw)
                        if data.get("type") != "Results":
                            continue
                        alts = data.get("channel", {}).get("alternatives", [])
                        transcript = alts[0].get("transcript", "") if alts else ""
                        is_final = data.get("is_final", False)
                        await websocket.send_text(
                            json.dumps(
                                {
                                    "type": "final" if is_final else "partial",
                                    "text": transcript,
                                }
                            )
                        )
                    except (json.JSONDecodeError, KeyError, IndexError):
                        pass

            relay_task = asyncio.create_task(relay_deepgram_to_client())
            try:
                while True:
                    chunk: bytes = await websocket.receive_bytes()
                    await dg_ws.send(chunk)
            except WebSocketDisconnect:
                pass
            finally:
                relay_task.cancel()
                try:
                    await relay_task
                except asyncio.CancelledError:
                    pass

    except Exception as exc:
        try:
            await websocket.close(code=1011, reason=str(exc))
        except Exception:
            pass
