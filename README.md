# NoteAid

A lightweight AI-assisted clinical documentation tool that converts unstructured practitioner notes into structured SOAP-format notes, with human-in-the-loop editing and basic validation.

> **Disclaimer:** Not medical advice. All AI-generated notes must be reviewed and verified by a qualified practitioner before clinical use.

---

## Architecture

```
React (frontend)          port 5173
  |
  | POST /api/v1/generate-note
  v
Rails API (backend)       port 3000
  |
  | POST /process-note
  v
Python FastAPI (ai-service) port 8000
  |
  v
Google Gemini API
```

---

## Prerequisites

| Service    | Requirement                         |
| ---------- | ----------------------------------- |
| frontend   | Node.js 18+, npm                    |
| backend    | Ruby 3.2+, Bundler                  |
| ai-service | Python 3.10+, Google Gemini API key |

---

## Setup & Run

Start each service in a separate terminal, in the order listed below.

### 1. AI Service

```bash
cd ai-service

# Create and activate virtual environment
python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS / Linux:
source .venv/bin/activate

pip install -r requirements.txt

# Create .env with your Gemini API key
echo GEMINI_API_KEY=your_api_key_here > .env

python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

### 2. Backend

```bash
cd backend
bundle install
bin/rails db:migrate
bin/rails server
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.
