# NoteAid — Frontend

React 18 + TypeScript + Vite + Chakra UI. Practitioner-facing interface for submitting clinical notes, reviewing AI-generated SOAP output, and editing fields before finalising. Runs on **port 5173**.

## Prerequisites

- Node.js 18+
- npm

## Environment variables

Create a `.env.local` file if either service is not on its default port:

```
VITE_API_BASE_URL=http://localhost:3000
VITE_AI_WS_URL=ws://127.0.0.1:8000/ws/transcribe
```

## Run

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.
