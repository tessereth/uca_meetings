from fastapi import APIRouter, HTTPException, WebSocket
from sqlalchemy import select
from sqlalchemy.orm import Session

from api_types import CreateMeeting, JoinMeeting, MeetingResponse
from channel import ChannelEvent, MeetingChannels
from database import DbSession
from dependencies import CurrentUser
from models import Meeting, Participation, Role, User, gen_short_code

router = APIRouter()
meeting_channels = MeetingChannels()


@router.post("/api/meetings")
def create_meeting(
    create_meeting: CreateMeeting, current_user: CurrentUser, session: DbSession
):
    # TODO: validate name
    meeting = Meeting(
        short_code=gen_short_code(),
        name=create_meeting.meeting_name,
        anonymous=create_meeting.anonymous,
    )
    participation = Participation(
        user=current_user,
        meeting=meeting,
        name=create_meeting.user_name,
        role=Role.HOST,
    )
    current_user.last_used_name = create_meeting.user_name
    session.add(meeting)
    session.add(participation)
    session.add(current_user)
    session.commit()
    session.refresh(meeting)
    session.refresh(participation)
    return MeetingResponse(meeting=meeting, participation=participation)


@router.post("/api/meetings/{short_code}/participants")
def join_meeting(
    short_code: str,
    join_meeting: JoinMeeting,
    current_user: CurrentUser,
    session: DbSession,
):
    meeting = get_meeting_by_short_code(session, short_code)

    # Check if user is already in the meeting
    participation = get_participation(
        session, meeting, current_user, allow_missing=True
    )
    if participation:
        participation.name = join_meeting.user_name
    else:
        participation = Participation(
            user=current_user, meeting=meeting, name=join_meeting.user_name
        )

    current_user.last_used_name = join_meeting.user_name
    session.add(participation)
    session.add(current_user)
    session.commit()
    session.refresh(meeting)
    session.refresh(participation)
    return MeetingResponse(meeting=meeting, participation=participation)


@router.get("/api/meetings/{short_code}")
def get_meeting(short_code: str, current_user: CurrentUser, session: DbSession):
    meeting = get_meeting_by_short_code(session, short_code)
    return MeetingResponse(
        meeting=meeting,
        participation=get_participation(session, meeting, current_user),
    )


@router.websocket("/api/meetings/{short_code}/ws")
async def meeting_websocket(websocket: WebSocket, short_code: str, session: DbSession):
    meeting = get_meeting_by_short_code(session, short_code)
    channel = meeting_channels.get(meeting, session)
    await channel.add_connection(websocket)
    await channel.send_snapshot(websocket)
    try:
        while True:
            data = await websocket.receive_json()
            event = ChannelEvent.from_payload(session, data)
            await channel.handle_event(event)
    except Exception as e:
        print(f"Error in websocket: {e}")
        channel.remove_connection(websocket)
        raise


@router.post("/api/meetings/{short_code}/flush")
def flush_meeting(short_code: str, session: DbSession):
    meeting = get_meeting_by_short_code(session, short_code)
    meeting_channels.remove(meeting)


def get_meeting_by_short_code(session: Session, short_code: str):
    stmt = select(Meeting).where(Meeting.short_code == short_code)
    results = session.scalars(stmt)
    meeting = results.first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Unknown meeting")
    return meeting


def get_participation(
    session: Session, meeting: Meeting, user: User, allow_missing: bool = False
):
    stmt = select(Participation).where(
        Participation.meeting_id == meeting.id, Participation.user_id == user.id
    )
    results = session.scalars(stmt)
    participation = results.first()
    if not participation and not allow_missing:
        raise HTTPException(status_code=403, detail="You have not joined this meeting")
    return participation
