# NoteAid

A lightweight AI-assisted clinical documentation tool that converts unstructured practitioner notes into structured SOAP-format notes. The practitioner can edit all generated fields before finalising, and voice input is supported via a live transcription pipeline.

> **Disclaimer:** Not medical advice. All AI-generated notes must be reviewed and verified by a qualified practitioner before clinical use.

---

## What It Does

1. **Input** — The practitioner types or dictates an unstructured clinical note. Sample notes are provided for testing.
2. **Transcription** — Voice input is streamed from the browser to the AI service, which proxies audio to Deepgram's `nova-2-medical` speech-to-text model in real time.
3. **SOAP generation** — The note is sent to Google Gemini, which returns structured Subjective / Objective / Assessment / Plan fields along with a confidence score and a list of uncertain phrases ("flags").
4. **Human-in-the-loop editing** — Every generated SOAP field is editable. The practitioner reviews the AI output and corrects it before use.
5. **Persistence** — The final note (raw input + SOAP fields + confidence + flags) is saved to the database via the Rails API.

---

## Stack

| Layer         | Technology                                      |
| ------------- | ----------------------------------------------- |
| Frontend      | React 18, TypeScript, Vite, Chakra UI           |
| Backend       | Ruby on Rails 8.1 (API mode), SQLite, Faraday   |
| AI Service    | Python 3.10+, FastAPI, Uvicorn                  |
| LLM           | Google Gemini `gemini-3.1-flash-lite-preview`   |
| Transcription | Deepgram `nova-2-medical` (streaming WebSocket) |

---

## Architecture

```
Browser (React + TypeScript)           port 5173
  |
  |── POST /api/v1/generate-note ──▶  Rails API (backend)       port 3000
  |                                        |
  |                                        └── POST /process-note ──▶  FastAPI (ai-service)  port 8000
  |                                                                          |
  |                                                                          └── Google Gemini API
  |
  └── WS  /ws/transcribe ──────────▶  FastAPI (ai-service)      port 8000
                                           |
                                           └── Deepgram nova-2-medical (streaming WS)
```

---

## LLM Usage & Design Decisions

### Model choice

`gemini-3.1-flash-lite-preview` is used for SOAP generation. It is fast and cheap, appropriate for a single-turn structured extraction task where low latency matters more than maximum reasoning depth.

### Structured output

The Gemini SDK is configured with `response_mime_type="application/json"` and a strict `response_schema`. This enforces a typed JSON response (subjective, objective, assessment, plan, confidence, flags) without requiring post-processing regex or JSON repair.

### Prompt design

The system prompt explicitly instructs the model to:

- Extract only what is stated or clearly implied — never fabricate clinical information.
- Leave a SOAP section as an empty string if no information is present.
- Return a `confidence` float (0.0–1.0) reflecting how complete and unambiguous the source note is.
- Populate `flags` with verbatim phrases from the note that are vague or uncertain.

### Heuristic fallback

If the model returns empty `flags` or omits `confidence`, a deterministic fallback runs on the generated text:

- **Flags** — regex match against a fixed vocabulary of uncertainty words (`likely`, `maybe`, `possibly`, `appears`, `seems`, `might`, `suspect`).
- **Confidence** — score derived from the density of those uncertainty words in the output.

This ensures the UI always has signal for the practitioner even if the LLM under-reports uncertainty.

### Human-in-the-loop

The frontend renders every SOAP field in an editable textarea. The confidence badge and flags panel are visible alongside the editable fields so the practitioner can prioritise their review. The LLM output is a starting point, not a final document.

---

## Prerequisites

| Service    | Requirement                                           |
| ---------- | ----------------------------------------------------- |
| frontend   | Node.js 18+, npm                                      |
| backend    | Ruby 3.2+, Bundler                                    |
| ai-service | Python 3.10+, Google Gemini API key, Deepgram API key |

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

# Create .env with your API keys
echo GEMINI_API_KEY=your_gemini_key_here > .env
echo DEEPGRAM_API_KEY=your_deepgram_key_here >> .env

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

---

## HIPAA Compliance Considerations

NoteAid in its current form is **not HIPAA-compliant**. It is a prototype intended for development and demonstration purposes only. The notes it processes and stores contain Protected Health Information (PHI), which means any production deployment handling real patient data must address every item below before going live.

> The following is a non-exhaustive technical and operational roadmap. It does not constitute legal advice. Consult a qualified healthcare compliance attorney and a HIPAA Security Officer before handling real PHI.

---

### 1. Business Associate Agreements (BAAs)

Every third-party service that touches PHI must sign a BAA.

| Service              | Current status  | Action required                                                                                                                                    |
| -------------------- | --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Google Gemini API    | No BAA in place | Switch to a Google Cloud Vertex AI endpoint covered under Google's HIPAA BAA, or evaluate an on-premises / private-cloud LLM alternative           |
| Deepgram             | No BAA in place | Obtain a Deepgram BAA (Deepgram offers HIPAA-eligible plans) or replace with an on-premises speech-to-text model (e.g. OpenAI Whisper self-hosted) |
| Render.com (hosting) | No BAA in place | Either obtain a Render BAA (Render offers HIPAA plans) or migrate to a BAA-covered cloud provider (AWS, Azure, GCP)                                |

---

### 2. Encryption at Rest

- **Database** — The production database is SQLite stored as a flat file (`storage/production.sqlite3`). SQLite has no native encryption. Replace with PostgreSQL or MySQL and enable Transparent Data Encryption (TDE) at the storage layer, or use an encrypted volume (AWS EBS with KMS, Azure Disk Encryption, etc.).
- **Backups** — All database backups must be encrypted before leaving the server. Use AES-256 and store keys in a dedicated key management service (AWS KMS, Azure Key Vault, GCP Cloud KMS).
- **Application secrets** — Rails credentials (`credentials.yml.enc`) and `.env` files must never be committed to source control. Use a secrets manager (AWS Secrets Manager, HashiCorp Vault) in production.

### 3. Encryption in Transit

- **Backend → AI Service** — The internal `AI_SERVICE_URL` call currently goes over plain HTTP in development. In production, all inter-service communication must use TLS (HTTPS/WSS). Enforce this at the load balancer or service mesh layer.
- **Browser → AI Service WebSocket** — The voice transcription WebSocket (`ws://`) must be upgraded to `wss://` in production. The `VITE_AI_WS_URL` environment variable controls this.
- **TLS version** — Require TLS 1.2 or higher; disable TLS 1.0 and 1.1 at the reverse proxy (Nginx, Caddy, AWS ALB).
- **HSTS** — Already enabled in Rails production config (`config.force_ssl = true`). Verify the `Strict-Transport-Security` header is present with a long `max-age` and `includeSubDomains`.

### 4. Authentication & Access Control

- **No authentication exists** — Any user who reaches the frontend can submit and retrieve notes. Add an authentication layer before any PHI is processed.
  - Add an identity provider: Auth0, AWS Cognito, or a self-hosted solution such as Keycloak.
  - Require MFA for all practitioner accounts.
- **Authorisation** — Implement role-based access control (RBAC). At minimum, practitioners should only be able to read notes they created.
- **Session management** — Use short-lived JWT tokens or server-side sessions with secure, `HttpOnly`, `SameSite=Strict` cookies. Enforce token expiry and idle session timeout.
- **API keys** — The Rails API is currently open. Add API key or OAuth 2.0 Bearer token validation on every endpoint.

### 5. Audit Logging

HIPAA requires a maintained audit trail of who accessed or modified PHI, and when.

- **What to log** — Record every read, create, update, and delete of a note, along with the actor's user ID, timestamp, IP address, and the action taken.
- **Current state** — Rails logs requests at the `info` level, but PHI fields are not filtered (only passwords, tokens, SSNs, etc. are filtered in `filter_parameter_logging.rb`). Add `raw_input`, `subjective`, `objective`, `assessment`, and `plan` to the filter list so PHI is never written to logs in plaintext.
- **Audit storage** — Write audit logs to an append-only, tamper-evident store separate from the application database (e.g. AWS CloudTrail, a dedicated audit log table with no `DELETE` privilege, or a SIEM).
- **Retention** — Retain audit logs for a minimum of 6 years per HIPAA requirements.

### 6. Minimum Necessary PHI

- **Raw input persistence** — The `raw_input` column stores the practitioner's full unstructured note verbatim. Evaluate whether retaining it after SOAP generation is necessary, or whether it can be discarded once the structured fields are confirmed.
- **Flags field** — The `flags` JSON column stores verbatim phrases from clinical notes. Apply the same access controls and encryption as the SOAP fields.
- **LLM data retention** — Confirm with the LLM provider that prompt data is not retained, used for training, or logged outside the BAA scope. Vertex AI and Deepgram HIPAA plans provide these guarantees; verify the specific data processing addendum.

### 7. Infrastructure & Network Security

- **Network isolation** — The AI service should not be publicly reachable. Place it in a private subnet and route only the Rails backend to it via an internal load balancer or VPC peering. Remove the public-facing port if deploying on a cloud provider.
- **Firewall / security groups** — Restrict inbound traffic to: port 443 (HTTPS) from the internet to the frontend and Rails API only; all other ports blocked from public access.
- **Dependency scanning** — Run `bundle audit` (Ruby), `pip-audit` (Python), and `npm audit` (Node) in CI to catch known CVEs in dependencies before deployment.
- **Container / OS hardening** — Run services as non-root users. Disable unused OS services. Apply OS security patches on a regular schedule.

### 8. Availability & Disaster Recovery

- **Backup and recovery** — Implement automated, encrypted, off-site database backups. Test restoration procedures to meet a documented Recovery Time Objective (RTO) and Recovery Point Objective (RPO).
- **Uptime SLA** — HIPAA does not mandate a specific uptime figure, but your organisation's risk analysis must document acceptable downtime and the controls in place to meet it.

### 9. Policies & Organisational Requirements

Technical controls alone are insufficient. HIPAA also requires:

- A designated **HIPAA Security Officer** and **Privacy Officer**.
- A documented **Risk Analysis** and **Risk Management Plan** (45 CFR § 164.308(a)(1)).
- **Workforce training** on handling PHI for all staff who access the system.
- A **Breach Notification Procedure** — documented steps to follow within 60 days of discovering a breach.
- A **Sanctions Policy** for workforce members who violate PHI handling rules.
- Regular **penetration testing** and **vulnerability assessments** of the application and infrastructure.
