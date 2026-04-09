# NoteAid — Free Production Hosting Plan

## Platform Selections

| Service               | Platform         | Reason                                                            |
| --------------------- | ---------------- | ----------------------------------------------------------------- |
| Frontend (React/Vite) | **Vercel**       | Static, zero cold starts, build-time env vars, GitHub auto-deploy |
| Backend (Rails)       | **Render**       | Ruby buildpack, `db:migrate` pre-deploy, SQLite fine for demo     |
| AI Service (FastAPI)  | **Render**       | Python buildpack, WebSocket capable for Phase 2 voice             |
| Cold-start mitigation | **cron-job.org** | Free pings every 14 min to prevent Render 15-min spin-down        |

---

## Phase 1 — Backend Code Fixes

**Step 1.** Uncomment `config.force_ssl = true` and `config.assume_ssl = true` in `backend/config/environments/production.rb`. Render terminates TLS at the load balancer — `assume_ssl` tells Rails the request is already HTTPS.

**Step 2.** Fix the mailer host placeholder (`"example.com"`) in `production.rb` — change to read from `ENV.fetch("APP_HOST", "localhost")`. (Not critical for demo; prevents log warnings.)

---

## Phase 2 — New Deployment Config Files

**Step 3.** Create `backend/Procfile`:

```
web: bundle exec puma -C config/puma.rb
```

**Step 4.** Create `ai-service/runtime.txt`:

```
python-3.11.0
```

**Step 5.** Create `ai-service/Procfile`:

```
web: uvicorn main:app --host 0.0.0.0 --port $PORT
```

**Step 6.** Pin versions in `ai-service/requirements.txt` — all packages currently unpinned; pin to known-good versions to prevent deployment breakage.

**Step 7.** Create `render.yaml` at repo root — defines both Render services as IaC (build command, start command, env var group references, pre-deploy hooks).

---

## Phase 3 — Deploy in Dependency Order

### Step 8. Deploy AI Service on Render _(first)_

- Root directory: `ai-service/`
- Build: `pip install -r requirements.txt`
- Start: `uvicorn main:app --host 0.0.0.0 --port $PORT`
- Env vars: `GEMINI_API_KEY`, `DEEPGRAM_API_KEY`
- Record HTTPS URL → e.g. `https://noteaid-ai.onrender.com`

### Step 9. Deploy Backend on Render _(depends on Step 8)_

- Root directory: `backend/`
- Pre-deploy: `bundle exec rails db:migrate`
- Start: `bundle exec puma -C config/puma.rb`
- Env vars:
  - `RAILS_ENV=production`
  - `AI_SERVICE_URL` = URL from Step 8
  - `SECRET_KEY_BASE` = generate with `openssl rand -hex 64` — replaces `RAILS_MASTER_KEY`; Rails boots with this directly and ignores `credentials.yml.enc`
  - `FRONTEND_ORIGIN` = placeholder, update after Step 10
  - `RAILS_LOG_LEVEL=info`
  - `RAILS_MAX_THREADS=5`
- Record HTTPS URL → e.g. `https://noteaid-api.onrender.com`

### Step 10. Deploy Frontend on Vercel _(depends on Step 9)_

- Root: `frontend/`
- Build command: `npm run build` (`tsc -b && vite build`)
- Output directory: `dist/`
- Build env vars:
  - `VITE_API_BASE_URL` = URL from Step 9
  - `VITE_AI_WS_URL` = `wss://<ai-service>.onrender.com/ws/transcribe` (set now; voice works in Phase 2 without a rebuild)
- Record Vercel URL → e.g. `https://noteaid.vercel.app`

### Step 11. Update Backend CORS _(depends on Step 10)_

- Set `FRONTEND_ORIGIN` = Vercel URL from Step 10 → Render auto-redeploys → CORS now allows the real frontend origin

### Step 12. Set Up cron-job.org Keep-Alives

- Two jobs pinging the backend and AI service every **14 minutes**
- Prevents both Render free services from spinning down (Render idles after 15 min)

---

## Environment Variables Reference

### Frontend (Vercel — baked at build time)

| Variable            | Value                                           |
| ------------------- | ----------------------------------------------- |
| `VITE_API_BASE_URL` | `https://<backend>.onrender.com`                |
| `VITE_AI_WS_URL`    | `wss://<ai-service>.onrender.com/ws/transcribe` |

### Backend (Render)

| Variable            | Value                                 |
| ------------------- | ------------------------------------- |
| `RAILS_ENV`         | `production`                          |
| `SECRET_KEY_BASE`   | 128-char hex (`openssl rand -hex 64`) |
| `AI_SERVICE_URL`    | `https://<ai-service>.onrender.com`   |
| `FRONTEND_ORIGIN`   | `https://<app>.vercel.app`            |
| `RAILS_LOG_LEVEL`   | `info`                                |
| `RAILS_MAX_THREADS` | `5`                                   |

### AI Service (Render)

| Variable           | Value                 |
| ------------------ | --------------------- |
| `GEMINI_API_KEY`   | from Google AI Studio |
| `DEEPGRAM_API_KEY` | from Deepgram console |

---

## WebSocket Voice — Phase 2

The frontend already reads `VITE_AI_WS_URL` and the AI service already exposes `/ws/transcribe`. Setting `VITE_AI_WS_URL` at build time (Step 10) means voice works automatically once confirmed on Render. If Render's idle timeout drops long-running WebSocket connections, the fix is sending a small keepalive ping from the client every 25 seconds — no structural changes needed.

---

## Files to Create / Modify

| File                                        | Action                                       |
| ------------------------------------------- | -------------------------------------------- |
| `backend/Procfile`                          | Create                                       |
| `backend/config/environments/production.rb` | Modify — uncomment `force_ssl`, `assume_ssl` |
| `ai-service/runtime.txt`                    | Create                                       |
| `ai-service/Procfile`                       | Create                                       |
| `ai-service/requirements.txt`               | Modify — pin dependency versions             |
| `render.yaml` (repo root)                   | Create                                       |

---

## Known Limitations

- **Render cold starts (~30s):** First request after idle wakes the service. Mitigated by cron-job.org.
- **Ephemeral SQLite:** Notes reset on Render redeploy/restart. Acceptable for demo.
- **`VITE_*` vars baked at build time:** Changing backend URLs requires a Vercel rebuild.
- **`gemini-3.1-flash-lite-preview`** is a preview model — may be renamed or deprecated.

## Future Upgrade Path

- Switch SQLite → **Neon.tech** (free Postgres) for persistent notes across restarts
- Upgrade Render to paid tier (~$7/mo) to eliminate cold starts and ephemeral storage
- Add **Sentry** (free tier) for error monitoring across all three services
