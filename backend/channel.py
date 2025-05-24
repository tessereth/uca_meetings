from collections import defaultdict
from dataclasses import dataclass
from enum import Enum

from fastapi import WebSocket, WebSocketException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from models import Meeting, Participation


class CardState(str, Enum):
    NONE = "none"
    WARM = "warm"
    COOL = "cool"
    QUESTION = "question"
    QUESTION_WARM = "question_warm"
    QUESTION_COOL = "question_cool"
    MOVE_ON = "move_on"

    def is_question(self) -> bool:
        return self in (
            CardState.QUESTION,
            CardState.QUESTION_WARM,
            CardState.QUESTION_COOL,
        )


class EventType(Enum):
    CARD_CHANGE = "card_change"
    LOWER_ALL_CARDS = "lower_all_cards"


@dataclass
class ChannelEvent:
    participation: Participation

    @staticmethod
    def from_payload(session: Session, payload: dict):
        if "event" not in payload:
            raise WebSocketException(
                code=status.WS_1008_POLICY_VIOLATION, reason="Missing event type"
            )
        event_type = payload.get("event")
        if "pid" not in payload:
            raise WebSocketException(
                code=status.WS_1008_POLICY_VIOLATION, reason="Missing pid"
            )
        participation = session.scalars(
            select(Participation).where(Participation.id == payload.get("pid"))
        ).first()
        if not participation:
            raise WebSocketException(
                code=status.WS_1008_POLICY_VIOLATION, reason="Unknown user"
            )
        if event_type == EventType.CARD_CHANGE.value:
            return CardChangeEvent(
                participation=participation, state=CardState(payload["state"])
            )
        raise WebSocketException(
            code=status.WS_1008_POLICY_VIOLATION,
            reason=f"Unknown event type: {event_type}",
        )


@dataclass
class CardChangeEvent(ChannelEvent):
    state: CardState


class Question(Enum):
    UNCHANGED = "unchanged"
    RAISED = "raised"
    LOWERED = "lowered"


class ParticipationState:
    def __init__(self, participation: Participation):
        self.participation = participation
        self.card_state = CardState.NONE

    def apply_event(self, event: ChannelEvent):
        old_state = self.card_state
        if isinstance(event, CardChangeEvent):
            self.card_state = event.state
        if not old_state.is_question() and self.card_state.is_question():
            return Question.RAISED
        elif old_state.is_question() and not self.card_state.is_question():
            return Question.LOWERED
        else:
            return Question.UNCHANGED


class MeetingState:
    def __init__(self, init_participants: list[Participation]):
        self.participants = {p.id: ParticipationState(p) for p in init_participants}
        self.questions = []

    def apply_event(self, event: ChannelEvent):
        if event.participation.id not in self.participants:
            self.participants[event.participation.id] = ParticipationState(
                event.participation
            )
        participation_state = self.participants[event.participation.id]
        question_change = participation_state.apply_event(event)
        if (
            question_change == Question.RAISED
            and event.participation.id not in self.questions
        ):
            self.questions.append(event.participation.id)
        elif (
            question_change == Question.LOWERED
            and event.participation.id in self.questions
        ):
            self.questions.remove(event.participation.id)

    def snapshot(self):
        participants = [
            {
                "id": str(p.participation.id),
                "name": p.participation.name,
                "card_state": p.card_state,
            }
            for p in self.participants.values()
        ]
        participants.sort(key=lambda x: x["name"].lower())
        return {
            "participants": participants,
            "questions": [str(p) for p in self.questions],
        }


class MeetingChannel:
    def __init__(self, meeting: Meeting, init_participants: list[Participation]):
        self.meeting = meeting
        self.websockets = []
        self.state = MeetingState(init_participants)

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.websockets.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.websockets.remove(websocket)

    async def handle_event(self, event: ChannelEvent):
        self.state.apply_event(event)
        snapshot = self.state.snapshot()
        for websocket in self.websockets:
            # TODO: parallel?
            await websocket.send_json(snapshot)

    async def send_snapshot(self, websocket: WebSocket):
        snapshot = self.state.snapshot()
        await websocket.send_json(snapshot)

    def __repr__(self):
        return f"MeetingChannel(meeting={self.meeting.short_code})"


meeting_channels = defaultdict(MeetingChannel)


class MeetingChannels:
    def __init__(self):
        self.channels = {}

    def get(self, meeting: Meeting, session: Session):
        if meeting.short_code not in self.channels:
            participants = session.scalars(
                select(Participation).where(Participation.meeting == meeting)
            )
            self.channels[meeting.short_code] = MeetingChannel(meeting, participants)
        return self.channels[meeting.short_code]

    def remove(self, meeting: Meeting):
        if meeting.short_code in self.channels:
            del self.channels[meeting.short_code]
