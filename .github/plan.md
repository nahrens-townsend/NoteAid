# NoteAid MVP — Project Plan

## Concept

A lightweight AI-assisted clinical documentation tool that converts unstructured practitioner notes into structured SOAP-format notes, with human-in-the-loop editing and basic validation.

---

## Decisions

- **LLM:** Google Gemini (`gemini-2.0-flash`)
- **Local dev:** Run each service independently (no Docker)
- **Persistence:** SQLite via Rails ActiveRecord (note history)
- **Frontend:** React + Vite + TypeScript + Chakra UI v3
- **Backend:** Rails API mode (no views)
- **AI Service:** Python FastAPI
- **Ports:** Frontend `5173`, Rails `3000`, FastAPI `8000`

---

## JSON Contract

**Input to FastAPI:**

```json
{ "raw_input": "string" }
```

**Output from FastAPI (and Rails):**

```json
{
  "subjective": "string",
  "objective": "string",
  "assessment": "string",
  "plan": "string",
  "confidence": 0.0,
  "flags": ["string"]
}
```

---

## Architecture

```
React (client)
  ↓  POST /api/v1/generate-note
Rails API
  ↓  POST /process-note
Python FastAPI (AI service)
  ↓
Google Gemini API
```

---

## Directory Layout

```
NoteAid/
├── .github/
│   └── plan.md
├── frontend/
│   ├── src/
│   │   ├── api/noteService.ts
│   │   ├── components/
│   │   │   ├── NoteInput.tsx
│   │   │   ├── SOAPForm.tsx
│   │   │   ├── ConfidenceBadge.tsx
│   │   │   ├── FlagsDisplay.tsx
│   │   │   └── Disclaimer.tsx
│   │   └── App.tsx
│   └── package.json
├── backend/
│   ├── app/
│   │   ├── controllers/api/v1/notes_controller.rb
│   │   └── models/note.rb
│   ├── config/
│   │   ├── routes.rb
│   │   └── initializers/cors.rb
│   ├── db/migrate/
│   └── Gemfile
└── ai-service/
    ├── main.py
    ├── prompt.py
    ├── schema.py
    ├── requirements.txt
    └── .env
```

---

## Phase Breakdown

### Phase 1 — Scaffold Projects

1. **`frontend/`** — `npm create vite@latest frontend -- --template react-ts`, add `@chakra-ui/react`, `axios`
2. **`backend/`** — `rails new backend --api --database=sqlite3`, add gems: `rack-cors`, `faraday`
3. **`ai-service/`** — Python project with `requirements.txt`: `fastapi`, `uvicorn`, `google-generativeai`, `pydantic`, `python-dotenv`

---

### Phase 2 — AI Service (`ai-service/`)

4. **`schema.py`** — Pydantic models: `NoteRequest { raw_input: str }`, `NoteResponse { subjective, objective, assessment, plan, confidence: float, flags: list[str] }`
5. **`prompt.py`** — Build Gemini prompt that instructs the model to return **only valid JSON** matching the schema. Prompt constraints: no fabrication, structured extraction only, return `confidence` 0–1 and a `flags` list of uncertain phrases
6. **`main.py`** — FastAPI app with `POST /process-note`:
   - Call Gemini (`gemini-2.0-flash`) with JSON response schema
   - Parse response into `NoteResponse`
   - Apply heuristic fallback: scan output text for uncertainty words (`likely`, `maybe`, `possibly`, `appears`, `seems`, `might`, `suspect`) to populate `flags` if LLM didn't
   - `confidence` = LLM-provided value or heuristic `1.0 - (uncertain_word_count / max(word_count, 1)) * 5` clamped to `[0.1, 1.0]`
7. **`.env`** — `GEMINI_API_KEY`

---

### Phase 3 — Rails Backend (`backend/`)

8. **Migration** — `Note` model: `raw_input:text`, `subjective:text`, `objective:text`, `assessment:text`, `plan:text`, `confidence:float`, `flags:json`
9. **`routes.rb`** — `namespace :api { namespace :v1 { post 'generate-note', to: 'notes#create' } }`
10. **`notes_controller.rb`**:
    - Validate `raw_input` present and not empty (400 if missing)
    - POST to `http://localhost:8000/process-note` via Faraday
    - On success: create `Note` record, return JSON response
    - On AI service error: return 502 with error message
11. **`cors.rb`** — Allow `http://localhost:5173`
12. **`.env`** — `AI_SERVICE_URL=http://localhost:8000`

---

### Phase 4 — React Frontend (`frontend/`)

13. **`App.tsx`** — Two-panel layout (Chakra `Grid`/`Stack`): input panel left, output panel right
14. **`NoteInput.tsx`** — `Textarea` for raw clinical notes + "Generate SOAP Note" `Button`, loading state
15. **`SOAPForm.tsx`** — Four editable `Textarea` fields (Subjective, Objective, Assessment, Plan), pre-filled from API response, user can edit before any further use
16. **`ConfidenceBadge.tsx`** — `Badge` + `Progress` bar showing `confidence` percentage (color: green ≥0.8, yellow ≥0.5, red <0.5)
17. **`FlagsDisplay.tsx`** — `Alert` (warning) listing each flag phrase if `flags.length > 0`
18. **`Disclaimer.tsx`** — Sticky bottom banner: _"Not medical advice. Always review and verify AI-generated notes."_
19. **`api/noteService.ts`** — `generateNote(rawInput: string): Promise<NoteResponse>` — POST to `http://localhost:3000/api/v1/generate-note`, typed with interface matching JSON contract
20. **State wiring:** on submit → call API → populate `SOAPForm` + `ConfidenceBadge` + `FlagsDisplay`. "Regenerate" button re-triggers same call with current `rawInput`

---

### Phase 5 — Integration & Polish

21. Error handling: frontend shows `Alert` (error) on API failure with message
22. Per-service `README.md` — setup + run commands for each service
23. Root `README.md` — ASCII architecture diagram, prerequisites, how to run all three

---

## Verification Checklist

- [ ] Start FastAPI, POST sample note to `localhost:8000/process-note` directly — confirm valid JSON with all 6 fields
- [ ] Start Rails, POST to `localhost:3000/api/v1/generate-note` — confirm note saved in SQLite (`rails console`) and response matches schema
- [ ] Start Vite dev server, enter a sample clinical note, click Generate — confirm SOAP fields populate, confidence badge renders, flags appear if uncertainty words present
- [ ] Edit a SOAP field manually — confirm edits are preserved until next generate
- [ ] Click Regenerate — confirm fresh AI response overwrites fields
- [ ] Submit empty input — confirm frontend shows validation error (no API call made), and Rails also returns 400 if hit directly

---

## Out of Scope (MVP)

- Deployment configuration (Vercel / Render / Railway)
- Authentication or multi-user support
- Real EMR integration
- Advanced NLP beyond Gemini prompt
- Complex database schema
- Export SOAP note to document (pdf, word, etc.)

---

## Disclaimer

> **Not medical advice.** All AI-generated notes must be reviewed and verified by a qualified practitioner before clinical use.
