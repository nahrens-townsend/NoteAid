# NoteAid — AI Service

FastAPI service that calls the Google Gemini API to convert raw clinical notes into structured SOAP notes. Runs on **port 8000**.

## Prerequisites

- Python 3.10+
- A Google Gemini API key

## Setup

```bash
cd ai-service
python -m venv .venv

# Windows
.venv\Scripts\activate

# macOS / Linux
source .venv/bin/activate

pip install -r requirements.txt
```

## Environment variables

Create a `.env` file in `ai-service/`:

```
GEMINI_API_KEY=your_api_key_here
```

## Run

```bash
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

### Key endpoint

```
POST /process-note
Content-Type: application/json

{ "raw_input": "..." }
```

Returns a JSON object with fields: `subjective`, `objective`, `assessment`, `plan`, `confidence`, `flags`.
