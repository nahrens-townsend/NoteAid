# NoteAid — Backend

Rails API that receives note generation requests from the frontend, forwards them to the AI service, persists the result, and returns the structured SOAP note. Runs on **port 3000**.

## Prerequisites

- Ruby 3.2+
- Bundler (`gem install bundler`)

## Setup

```bash
cd backend
bundle install
bin/rails db:migrate
```

## Environment variables

Create a `.env` file (or set these in your shell):

```
AI_SERVICE_URL=http://localhost:8000
```

## Run

```bash
bin/rails server
```

The API will be available at [http://localhost:3000](http://localhost:3000).

### Key endpoint

```
POST /api/v1/generate-note
Content-Type: application/json

{ "raw_input": "..." }
```
