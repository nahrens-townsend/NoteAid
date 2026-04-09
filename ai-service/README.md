# NoteAid — AI Service

Python FastAPI service with two responsibilities:

- **SOAP generation** (`POST /process-note`) — sends the raw clinical note to Google Gemini and returns structured SOAP fields, a confidence score, and uncertainty flags.
- **Voice transcription** (`WS /ws/transcribe`) — proxies binary audio from the browser to Deepgram's `nova-2-medical` model and streams partial/final transcript frames back to the client.

Runs on **port 8000**.

## Prerequisites

- Python 3.10+
- Google Gemini API key
- Deepgram API key

## Environment variables

Create a `.env` file in `ai-service/`:

```
GEMINI_API_KEY=your_gemini_key_here
DEEPGRAM_API_KEY=your_deepgram_key_here
```

## Run

```bash
python -m venv .venv
# Windows: .venv\Scripts\activate
# macOS / Linux: source .venv/bin/activate

pip install -r requirements.txt
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```
