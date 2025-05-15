from typing import Annotated

from fastapi import Depends, FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session
from config import settings
from models import Meeting, Participation, User, gen_short_code
import uuid

engine = create_engine(str(settings.POSTGRES_DSN))

app = FastAPI()

security = HTTPBearer()
async def get_current_user(credentials: Annotated[HTTPAuthorizationCredentials, Depends(security)]):
    with Session(engine) as session:
        try:
            user_uuid = uuid.UUID(credentials.credentials)
        except ValueError:
            raise HTTPException(status_code=401, detail="Invalid authorization header")
        stmt = select(User).where(User.id == user_uuid)
        results = session.scalars(stmt).all()
        if not len(results) == 1:
            raise HTTPException(status_code=401, detail="Unknown user")
        return results[0]
CurrentUser = Annotated[User, Depends(get_current_user)]

origins = [
    "http://localhost:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory="static"), name="static")

@app.post("/api/me")
def create_user():
    user = User()
    with Session(engine) as session:
        session.add(user)
        session.commit()
        session.refresh(user)
    return user

@app.get("/api/me")
def read_current_user(current_user: CurrentUser):
    return current_user

class CreateMeeting(BaseModel):
    meeting_name: str
    user_name: str
    anonymous: bool

@app.post("/api/meetings")
def create_meeting(create_meeting: CreateMeeting, current_user: CurrentUser):
    # TODO: validate name
    meeting = Meeting(
        short_code=gen_short_code(),
        name=create_meeting.meeting_name,
        anonymous=create_meeting.anonymous
    )
    participation = Participation(
        user=current_user,
        meeting=meeting,
        name=create_meeting.user_name
    )
    current_user.last_used_name = create_meeting.user_name
    with Session(engine) as session:
        session.add(meeting)
        session.add(participation)
        session.add(current_user)
        session.commit()
        session.refresh(meeting)
    return meeting


class JoinMeeting(BaseModel):
    user_name: str


@app.post("/api/meetings/{short_code}/participants")
def join_meeting(short_code: str, join_meeting: JoinMeeting, current_user: CurrentUser):
    with Session(engine) as session:
        stmt = select(Meeting).where(Meeting.short_code == short_code)
        results = session.scalars(stmt)
        meeting = results.first()
        if not meeting:
            return {"error": "Unknown meeting"}, 404

        # Check if user is already in the meeting
        stmt = select(Participation).where(
            Participation.meeting_id == meeting.id,
            Participation.user_id == current_user.id
        )
        results = session.scalars(stmt)
        participation = results.first()
        if participation:
            participation.name = join_meeting.user_name
        else:
            participation = Participation(
                user=current_user,
                meeting=meeting,
                name=join_meeting.user_name
            )

        current_user.last_used_name = join_meeting.user_name
        session.add(participation)
        session.add(current_user)
        session.commit()
        session.refresh(meeting)
    return meeting
