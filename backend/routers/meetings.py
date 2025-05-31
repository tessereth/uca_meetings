from fastapi import APIRouter, HTTPException, WebSocket, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from api_types import CreateMeeting, JoinMeeting, MeetingResponse, UpdateRole
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


@router.get("/api/meetings/{short_code}")
def get_meeting(short_code: str, current_user: CurrentUser, session: DbSession):
    meeting = get_meeting_by_short_code(session, short_code)
    return MeetingResponse(
        meeting=meeting,
        participation=get_participation(session, meeting, current_user),
    )


@router.post("/api/meetings/{short_code}/participants")
async def join_meeting(
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
            user=current_user,
            meeting=meeting,
            name=join_meeting.user_name,
            role=Role.MEMBER,
        )

    current_user.last_used_name = join_meeting.user_name
    session.add(participation)
    session.add(current_user)
    session.commit()
    session.refresh(meeting)
    session.refresh(participation)
    await meeting_channels.get(meeting, session).refresh_participants(session)
    return MeetingResponse(meeting=meeting, participation=participation)


@router.patch("/api/meetings/{short_code}/participants/{participation_id}")
async def update_participant_role(
    short_code: str,
    participation_id: str,
    update_role: UpdateRole,
    current_user: CurrentUser,
    session: DbSession,
):
    meeting = get_meeting_by_short_code(session, short_code)
    # Only allow host to update roles
    participation = get_participation(session, meeting, current_user)
    if participation.role != Role.HOST:
        raise HTTPException(status_code=403, detail="Only hosts can update roles")

    stmt = select(Participation).where(Participation.id == participation_id)
    participant = session.scalars(stmt).first()
    if not participant:
        raise HTTPException(status_code=404, detail="Participant not found")

    participant.role = update_role.role
    session.add(participant)
    session.commit()
    await meeting_channels.get(meeting, session).refresh_participants(session)
    return "", status.HTTP_204_NO_CONTENT


@router.delete("/api/meetings/{short_code}/participants/{participation_id}")
async def remove_participant(
    short_code: str,
    participation_id: str,
    current_user: CurrentUser,
    session: DbSession,
):
    meeting = get_meeting_by_short_code(session, short_code)
    # Only allow host to remove participants
    participation = get_participation(session, meeting, current_user)
    if participation.role != Role.HOST:
        raise HTTPException(status_code=403, detail="Only host can remove participants")

    stmt = select(Participation).where(Participation.id == participation_id)
    participant = session.scalars(stmt).first()
    if not participant:
        raise HTTPException(status_code=404, detail="Participant not found")

    session.delete(participant)
    session.commit()
    await meeting_channels.get(meeting, session).refresh_participants(session)
    return "", status.HTTP_204_NO_CONTENT


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
