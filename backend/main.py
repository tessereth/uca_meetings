from typing import Union

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from sqlmodel import Session, create_engine, select
from config import settings
from models import Meeting

engine = create_engine(str(settings.POSTGRES_DSN))

app = FastAPI()

app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/")
def read_root():
    return {"Hello": "World"}


@app.post("/api/meeting/{shortCode}/join")
def join_meeting(shortCode: str):
    with Session(engine) as session:
        meeting = select(Meeting).where(Meeting.shortCode == shortCode)
        results = session.exec(select(Meeting).where(Meeting.shortCode == shortCode))
        meeting = results.first()
        if not meeting:
            return {"error": "Unknown meeting"}, 404
    return meeting