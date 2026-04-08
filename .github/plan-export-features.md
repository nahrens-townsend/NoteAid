# Plan: Export Features (PDF + Copy-to-Clipboard)

## Overview

Add two export features to the AI Clinical Note Assistant:

1. **Copy-to-Clipboard** — frontend-driven, formats SOAP note as plain text for EMR pasting
2. **PDF Export** — backend-driven via Rails, generates a professional downloadable PDF

Both features export `soapFields` (the user-edited version of the note), not the raw API response.

---

## Context

- **Frontend:** React + Chakra UI v3, local `useState`, `soapFields` holds user-edited note
- **Backend:** Rails 8.1, `/api/v1/` namespace, SQLite, rack-cors
- **AI Service:** FastAPI — not involved in export logic
- **SOAP note shape:** `{ subjective, objective, assessment, plan, confidence, flags }`
- **No PDF gem currently installed** — `prawn` must be added

---

## Non-Goals (MVP Scope)

- Word (.docx) export
- CSV export
- EMR integrations (Epic, Cerner, etc.)
- Digital signatures or audit trails
- Long-term document storage

---

## Phase 1: Copy-to-Clipboard (frontend only)

### Steps

1. Add `formatSOAPText(fields)` utility in `frontend/src/api/noteService.ts`
   - Returns plain text string with section headers + line breaks
   - No markdown, HTML, or special characters
   - Format:

     ```
     Subjective:
     <content>

     Objective:
     <content>

     Assessment:
     <content>

     Plan:
     <content>
     ```

2. Add "Copy to Clipboard" button in `frontend/src/App.tsx`, right column, below `SOAPForm`, above "Regenerate"
   - Calls `navigator.clipboard.writeText(formatSOAPText(soapFields))`
   - Add `copyState: "idle" | "copied"` via `useState`
   - Button label toggles to "Copied!" for ~2s, then resets to "Copy to Clipboard"
   - Only visible when `soapFields` has content (same guard as "Regenerate")

---

## Phase 2: PDF Export (backend + frontend)

### Backend

3. Add `prawn` and `prawn-table` to `backend/Gemfile`; run `bundle install`
   - Pure Ruby — no external binary dependencies

4. Create `backend/app/controllers/api/v1/exports_controller.rb` _(new file)_
   - Action: `pdf`
   - Accepts `POST` with JSON body `{ subjective, objective, assessment, plan }`
   - Validates all four fields are present strings
   - Generates PDF with Prawn:
     - Title: "SOAP Note"
     - Date generated
     - Labeled sections with consistent spacing
   - Returns: `send_data pdf_binary, filename: "soap-note.pdf", type: "application/pdf", disposition: "attachment"`
   - Does **not** persist PDF to disk

5. Add route in `backend/config/routes.rb` inside existing `namespace :api { namespace :v1 }`:
   ```ruby
   namespace :exports do
     post "pdf", to: "exports#pdf"
   end
   ```
   Resulting URL: `POST /api/v1/exports/pdf`

### Frontend

6. Add `exportPDF(fields)` function in `frontend/src/api/noteService.ts`
   - POSTs `soapFields` as JSON to `/api/v1/exports/pdf`
   - Receives response as `Blob`
   - Creates an object URL, triggers `<a download="soap-note.pdf">` click, revokes URL

7. Add "Download PDF" button in `frontend/src/App.tsx`, right column, alongside Copy button
   - Add `isPdfLoading` state for loading indicator
   - Show inline error on failure

---

## Files to Modify

| File                                                   | Change                                                    |
| ------------------------------------------------------ | --------------------------------------------------------- |
| `backend/Gemfile`                                      | Add `gem "prawn"` and `gem "prawn-table"`                 |
| `backend/config/routes.rb`                             | Add exports namespace and pdf route                       |
| `backend/app/controllers/api/v1/exports_controller.rb` | **Create new file** — PDF generation logic                |
| `frontend/src/api/noteService.ts`                      | Add `formatSOAPText()` and `exportPDF()`                  |
| `frontend/src/App.tsx`                                 | Add export buttons, `copyState`, and `isPdfLoading` state |

---

## Verification

1. Click "Copy to Clipboard" → paste into a text editor → confirm all 4 sections with headers and spacing
2. Confirm button label shows "Copied!" for ~2s, then resets
3. Click "Download PDF" → `soap-note.pdf` downloads
4. Open PDF → verify title, date, all 4 sections, no truncation on long notes
5. Run `bundle install` in `backend/` to confirm Prawn installs cleanly
6. Confirm both buttons are hidden when no note has been generated

---

## Decisions

- **`prawn`** chosen over `wicked_pdf` — pure Ruby, no external binary required
- Route is `/api/v1/exports/pdf` (plural) to allow future export types (e.g., docx)
- Exports use `soapFields` (user-edited), not the raw `soapData` API response
- PDFs are generated on-demand, never stored server-side
- Both buttons share the same visibility guard as the "Regenerate" button

---

## Future Enhancements

- Word document export
- Custom templates per clinic
- Digital signatures
- Audit logs for generated notes
- EMR integration (FHIR or direct APIs)
