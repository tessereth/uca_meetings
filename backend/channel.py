import threading
from fastapi import WebSocket
from dataclasses import dataclass

from sqlalchemy import select
from models import Meeting, Participation
from collections import defaultdict
from enum import Enum
from sqlalchemy.orm import Session


class CardType(str, Enum):
    WARM = "warm"
    COOL = "cool"
    QUESTION = "question"


@dataclass
class CardEvent:
    participation: Participation
    card_type: CardType
    raised: bool


class ParticipationState:
    def __init__(self, participation: Participation):
        self.participation = participation
        self.cards = {
            CardType.WARM: False,
            CardType.COOL: False,
            CardType.QUESTION: False
        }

    def apply_event(self, event: CardEvent):
        if event.card_type not in self.cards:
            raise ValueError(f"Unknown card type: {event.card_type}")
        self.cards[event.card_type] = event.raised


class MeetingState:
    def __init__(self, init_participants: list[Participation]):
      self.participants = { p.id: ParticipationState(p) for p in init_participants }
      self.questions = []

    def apply_event(self, event: CardEvent):
        if event.participation.id not in self.participants:
            self.participants[event.participation.id] = ParticipationState(event.participation)
        participation_state = self.participants[event.participation.id]
        participation_state.apply_event(event)
        if event.card_type == CardType.QUESTION:
            if event.raised and event.participation.id not in self.questions:
                self.questions.append(event.participation.id)
            elif not event.raised and event.participation.id in self.questions:
                self.questions.remove(event.participation.id)

    def snapshot(self):
        participants = [ {
            "id": str(p.participation.id),
            "name": p.participation.name,
            "cards": p.cards
            } for p in self.participants.values() ]
        participants.sort(key=lambda x: x["name"].lower())
        return {
            "participants": participants,
            "questions": [str(p) for p in self.questions]
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

    async def handle_event(self, event: CardEvent):
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


