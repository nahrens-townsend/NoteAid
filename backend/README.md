# NoteAid — Backend

Ruby on Rails 8.1 JSON API. Receives note generation requests from the frontend, forwards them to the AI service, persists the result, and returns the structured SOAP note. Runs on **port 3000**.

## Prerequisites

- Ruby 3.2+
- Bundler

## Environment variables

```
AI_SERVICE_URL=http://localhost:8000
```

## Run

```bash
bundle install
bin/rails db:migrate
bin/rails server
```
