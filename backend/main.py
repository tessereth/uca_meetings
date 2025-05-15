from typing import Union

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

app = FastAPI()

app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/")
def read_root():
    return {"Hello": "World"}


@app.post("/api/meeting/{meeting_id}/join")
def join_meeting(meeting_id: int):
    return {"meeting_id": meeting_id}