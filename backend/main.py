from typing import Annotated

from fastapi import Depends, FastAPI, HTTPException, WebSocket, WebSocketException, status
from fastapi.staticfiles import StaticFiles
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session
from api_types import CreateMeeting, JoinMeeting, MeetingResponse
from channel import CardEvent, MeetingChannels
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

meeting_channels = MeetingChannels()
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
        session.refresh(participation)
    return MeetingResponse(meeting=meeting, participation=participation)


@app.post("/api/meetings/{short_code}/participants")
def join_meeting(short_code: str, join_meeting: JoinMeeting, current_user: CurrentUser):
    with Session(engine) as session:
        meeting = get_meeting_by_short_code(session, short_code)

        # Check if user is already in the meeting
        participation = get_participation(session, meeting, current_user, allow_missing=True)
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
        session.refresh(participation)
    return MeetingResponse(meeting=meeting, participation=participation)


@app.get("/api/meetings/{short_code}")
def get_meeting(short_code: str, current_user: CurrentUser):
    with Session(engine) as session:
        meeting = get_meeting_by_short_code(session, short_code)
        return MeetingResponse(meeting=meeting, participation=get_participation(session, meeting, current_user))

@app.websocket("/api/meetings/{short_code}/ws")
async def meeting_websocket(websocket: WebSocket, short_code: str):
    with Session(engine) as session:
        meeting = get_meeting_by_short_code(session, short_code)
        channel = meeting_channels.get(meeting, session)
    await channel.connect(websocket)
    #await channel.send_snapshot(websocket)
    try:
        while True:
            data = await websocket.receive_json()
            with Session(engine) as session:
                participation = session.scalars(select(Participation).where(Participation.id == data["pid"])).first()
                if not participation:
                    raise WebSocketException(code=status.WS_1008_POLICY_VIOLATION, reason="Unknown user")
            event = CardEvent(
                participation=participation,
                card_type=data["card"],
                raised=data["raised"]
            )
            await channel.handle_event(event)
    except Exception as e:
        print(f"Error in websocket: {e}")
        channel.disconnect(websocket)
        raise


@app.post("/api/meetings/{short_code}/flush")
def flush_meeting(short_code: str):
    with Session(engine) as session:
        meeting = get_meeting_by_short_code(session, short_code)
        meeting_channels.remove(meeting)



def get_meeting_by_short_code(session: Session, short_code: str):
    stmt = select(Meeting).where(Meeting.short_code == short_code)
    results = session.scalars(stmt)
    meeting = results.first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Unknown meeting")
    return meeting

def get_participation(session: Session, meeting: Meeting, user: User, allow_missing: bool = False):
    stmt = select(Participation).where(
        Participation.meeting_id == meeting.id,
        Participation.user_id == user.id
    )
    results = session.scalars(stmt)
    participation = results.first()
    if not participation and not allow_missing:
        raise HTTPException(status_code=403, detail="You have not joined this meeting")
    return participation