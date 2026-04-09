# Voice-to-Text Transcription Feature Plan

## Decisions

- **STT Provider:** Web Speech API (browser-native, no API cost, no audio sent to a third-party backend)
- **WebSocket:** Not needed for Phases 1–3. Deferred to Phase 4 as an upgrade path if a cloud provider is adopted.
- **Connection:** Direct browser → (Phase 4) FastAPI. Rails is not involved in transcription at any phase.
- **State lift required:** `rawInput` is currently local to `NoteInput.tsx` and must be lifted to `App.tsx`.

> **HIPAA note:** Web Speech API in Chrome sends audio to Google's servers. If PHI handling requirements are strict, Phase 4 with a HIPAA-compliant provider (AssemblyAI Healthcare or on-prem Whisper) must be implemented before production deployment.

---

## Phase 1 — State Lift + Abstraction

**1.** Lift `rawInput` out of `NoteInput.tsx` into `App.tsx` as a controlled `useState("")`. Pass `value` and `onChange` as props.

**2.** Make `NoteInput` a controlled component — remove its internal `useState`, accept `value: string` and `onChange: (val: string) => void`.

**3.** Create `frontend/src/hooks/useVoiceTranscription.ts` — the abstraction interface. Returns `{ isRecording, start, stop, partialTranscript, error }`. Phase 1 implements via Web Speech API. Phase 4 swaps to WebSocket without touching callers.

---

## Phase 2 — Web Speech API Implementation

**4.** Implement the hook body using `window.SpeechRecognition` (with `webkit` prefix fallback):

- `continuous: true`, `interimResults: true`, `lang: 'en-US'`
- `onresult`: separate interim vs. final results; fire provided `onFinal` callback on finalized segments
- `onend`: auto-restart if `isRecording` is still true (browser auto-stops on silence)
- `onerror`: map error codes (`not-allowed`, `no-speech`, `network`) to readable messages
- Returns `isRecording`, `start()`, `stop()`, `partialTranscript`, `error`

**5.** In `App.tsx`: `onFinal` callback appends text to `rawInput` with cursor-safe spacing:

```ts
setRawInput((prev) => prev + (prev.trim() ? " " : "") + finalText);
```

**6.** `partialTranscript` stored in `App.tsx` state, passed down to `NoteInput` for preview display.

---

## Phase 3 — UI Components

**7.** Create `frontend/src/components/VoiceRecordButton.tsx`:

- Chakra `Button` toggling Start / Stop Recording
- Pulsing red dot (CSS animation) visible while `isRecording`
- Disabled when `isLoading` (AI is generating a note)
- Inline error display for permission denial or unsupported browser
- Browser support guard: if `SpeechRecognition` is not available, render a disabled button with tooltip _"Voice input requires Chrome or Edge"_

**8.** Update `NoteInput.tsx`:

- Place `VoiceRecordButton` in the label row beside "Clinical Notes"
- Below the `<Textarea>`, render `partialTranscript` as muted italic text (`Text color="gray.400"`) — only visible while `isRecording && partialTranscript`

---

## Phase 4 — FastAPI WebSocket (Cloud Provider Upgrade Path)

**9.** Add `websockets` to `ai-service/requirements.txt`

**10.** Add `WS /ws/transcribe` WebSocket endpoint to `ai-service/main.py` — receives binary audio chunks, forwards to Deepgram / AssemblyAI, returns `{"type": "partial"|"final", "text": "..."}` frames.

**11.** Swap `useVoiceTranscription.ts` implementation to use `MediaRecorder` + `WebSocket` to FastAPI instead of Web Speech API. Callers remain unchanged.

---

## Files

| File                                            | Change                                                                |
| ----------------------------------------------- | --------------------------------------------------------------------- |
| `frontend/src/App.tsx`                          | Lift `rawInput` state; add `partialTranscript`; wire `onFinal` append |
| `frontend/src/components/NoteInput.tsx`         | Make controlled; add `VoiceRecordButton`; add partial preview         |
| `frontend/src/hooks/useVoiceTranscription.ts`   | **New** — Web Speech API hook                                         |
| `frontend/src/components/VoiceRecordButton.tsx` | **New** — recording toggle + status indicator                         |
| `ai-service/main.py`                            | **Phase 4** — add `/ws/transcribe` endpoint                           |
| `ai-service/requirements.txt`                   | **Phase 4** — add `websockets`                                        |

---

## Verification

1. Chrome: speak → italic partial preview appears → on pause, text appends to textarea
2. Manual edits during recording: next final segment appends to end, not overwritten
3. "Generate SOAP Note" after recording: transcribed text flows into SOAP pipeline normally
4. Firefox / Safari: button disabled with tooltip, no crash
5. Microphone denied: readable error message shown in UI
6. Stop + restart in same session: works without reload
7. `isLoading` is true: mic button is disabled

---

## Milestones

| Phase | Goal                                                               |
| ----- | ------------------------------------------------------------------ |
| 1     | State lift + hook abstraction wired up, controlled `NoteInput`     |
| 2     | Live transcription appending to raw notes field via Web Speech API |
| 3     | VoiceRecordButton, recording indicator, partial transcript preview |
| 4     | FastAPI WebSocket endpoint + MediaRecorder for cloud provider swap |
