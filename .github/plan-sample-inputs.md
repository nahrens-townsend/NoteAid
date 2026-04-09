# Raw Input Dropdown and Copy-to-Notes Feature Plan

## TL;DR

Add a `SampleInputSelector` component inside `NoteInput.tsx` with a Chakra `Select` dropdown and "Insert Sample Input" button. Sample data lives in a new `src/data/sampleInputs.ts`. No changes needed to `App.tsx` — the existing `onChange` prop on `NoteInput` is sufficient to replace the textarea content.

---

## Phase 1 — Data & UI Component

### Step 1 — Create `frontend/src/data/sampleInputs.ts`

- Export `SAMPLE_INPUTS: { id: string, label: string, text: string }[]` with 5 entries
- Labels: "Simple Case", "Moderate Case", "Mild Ambiguity", "Incomplete Info", "Highly Ambiguous"
- Each `text` is a realistic raw clinical note matching that complexity level

### Step 2 — Create `frontend/src/components/SampleInputSelector.tsx`

- Props: `onInsert: (text: string) => void`
- Internal state: `selectedId: string` (controlled Chakra `Select`)
- First `<option>` is a disabled placeholder: `"Select a sample input"`
- Remaining options populated from `SAMPLE_INPUTS` by `id`/`label`
- Chakra `Button` labeled `"Insert Sample Input"`, disabled when no option selected
- On click: find matching sample by `id`, call `onInsert(sample.text)` — replaces textarea content
- Dropdown keeps selection visible after insert (user preference)

---

## Phase 2 — Integration

### Step 3 — Modify `frontend/src/components/NoteInput.tsx`

- Import `SampleInputSelector` and render it **above** the existing `Textarea`
- Pass `onChange` directly as `onInsert` — no prop changes or `App.tsx` edits needed

---

## Phase 3 — Behavior & UX

- **Insertion behavior: replace** (not append) — overwrites existing textarea text for clean testing
- Button stays disabled until a selection is made (prevents empty/undefined insertion)
- Dropdown keeps the selected option visible after insert (allows re-insertion)
- Chakra `Select` + `Button` used throughout to match existing component style

---

## Relevant Files

| File                                              | Status | Notes                                    |
| ------------------------------------------------- | ------ | ---------------------------------------- |
| `frontend/src/data/sampleInputs.ts`               | NEW    | Sample data array                        |
| `frontend/src/components/SampleInputSelector.tsx` | NEW    | Dropdown + button UI                     |
| `frontend/src/components/NoteInput.tsx`           | MODIFY | Add `SampleInputSelector` above Textarea |

---

## Verification Checklist

- [ ] All 5 dropdown options appear with correct labels
- [ ] Insert button is disabled until a selection is made
- [ ] Clicking inserts the correct text, replacing existing textarea content
- [ ] Inserted text flows through to AI pipeline (generate still works after insertion)
- [ ] Voice recording and manual typing unaffected
- [ ] No TypeScript errors after implementation
- [ ] Edge cases: rapid clicking, switching selections, empty state — all handled

---

## Future Enhancements (Out of Scope)

- Allow users to add custom sample inputs
- Persist user-defined samples across sessions
- Categorize inputs by specialty or use case
- Add ability to randomize sample selection
- Track which inputs produce best AI results
