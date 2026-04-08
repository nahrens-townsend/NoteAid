from fastapi import FastAPI

app = FastAPI(title="NoteAid AI Service")


@app.post("/process-note")
def process_note():
    # TODO: implement in Phase 2
    pass
