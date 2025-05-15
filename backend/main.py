from typing import Union

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session
from config import settings
from models import Meeting, gen_short_code

engine = create_engine(str(settings.POSTGRES_DSN))

app = FastAPI()

app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/")
def read_root():
    return {"Hello": "World"}

class CreateMeeting(BaseModel):
    name: str
    anonymous: bool

@app.post("/api/meeting")
def create_meeting(createMeeting: CreateMeeting):
    # TODO: validate name
    meeting = Meeting(
        shortCode=gen_short_code(),
        name=createMeeting.name,
        anonymous=createMeeting.anonymous
    )
    with Session(engine) as session:
        session.add(meeting)
        session.commit()
        session.refresh(meeting)
    return meeting


@app.post("/api/meeting/{shortCode}/join")
def join_meeting(shortCode: str):
    with Session(engine) as session:
        meeting = select(Meeting).where(Meeting.shortCode == shortCode)
        results = session.scalars(select(Meeting).where(Meeting.shortCode == shortCode))
        meeting = results.first()
        if not meeting:
            return {"error": "Unknown meeting"}, 404
    return meeting