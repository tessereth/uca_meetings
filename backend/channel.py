import asyncio
import json
import logging
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from enum import Enum
from random import choice

from fastapi import WebSocket, WebSocketException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from models import Meeting, Participation

logger = logging.getLogger("uvicorn.error")


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
class ChannelEvent(object):
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

    def set_participants(self, participants):
        old_participants = self.participants
        self.participants = {p.id: ParticipationState(p) for p in participants}
        for pid in self.participants:
            if pid in old_participants:
                self.participants[pid].card_state = old_participants[pid].card_state

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
                "role": p.participation.role,
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
    SNAPSHOT_COOLDOWN = timedelta(seconds=1)
    SIMULATED_EVENT_INTERVAL = timedelta(seconds=5)

    def __init__(self, meeting: Meeting, init_participants: list[Participation]):
        self.meeting = meeting
        self.websockets = []
        self.state = MeetingState(init_participants)
        self.last_snapshot_sent_at = datetime.min.replace(tzinfo=timezone.utc)
        self.last_snapshot_hash = None
        self.delayed_snapshot_task = None
        self.simulated_event_task = None

    async def add_connection(self, websocket: WebSocket):
        await websocket.accept()
        self.websockets.append(websocket)
        self._maybe_start_simulated_task()

    def remove_connection(self, websocket: WebSocket):
        self.websockets.remove(websocket)
        if len(self.websockets) == 0:
            self.simulated_event_task.cancel()
            self.simulated_event_task = None

    async def refresh_participants(self, session: Session):
        participants = session.scalars(
            select(Participation).where(Participation.meeting == self.meeting)
        )
        self.state.set_participants(participants)
        await self.broadcast_snapshot_with_cooldown()
        self._maybe_start_simulated_task()

    async def handle_event(self, event: ChannelEvent):
        self.state.apply_event(event)
        await self.broadcast_snapshot_with_cooldown()

    async def send_snapshot(self, websocket: WebSocket):
        snapshot = self.state.snapshot()
        await websocket.send_json(snapshot)

    async def _broadcast_snapshot_if_changed(self):
        if len(self.websockets) > 0:
            snapshot = self.state.snapshot()
            snapshot_json = json.dumps(snapshot)
            snapshot_hash = hash(snapshot_json)
            if self.last_snapshot_hash == snapshot_hash:
                logger.debug("Snapshot unchanged, skipping snapshot broadcast")
                return
            tasks = [
                websocket.send_text(snapshot_json) for websocket in self.websockets
            ]
            await asyncio.gather(*tasks)
            self.last_snapshot_hash = snapshot_hash
            self.last_snapshot_sent_at = datetime.now(timezone.utc)

    async def broadcast_snapshot_with_cooldown(self):
        if (
            datetime.now(timezone.utc)
            > self.last_snapshot_sent_at + self.SNAPSHOT_COOLDOWN
        ):
            logger.debug("Handling snapshot immediately")
            await self._broadcast_snapshot_if_changed()
            return
        # Delay sending the snapshot until cooldown expires, don't duplicate sends
        if self.delayed_snapshot_task is None:
            logger.debug("Enqueuing delayed snapshot")

            async def delayed_snapshot():
                await asyncio.sleep(
                    (
                        self.last_snapshot_sent_at
                        + self.SNAPSHOT_COOLDOWN
                        - datetime.now(timezone.utc)
                    ).total_seconds()
                )
                logger.debug("Sending delayed snapshot")
                await self._broadcast_snapshot_if_changed()
                self.delayed_snapshot_task = None

            self.delayed_snapshot_task = asyncio.create_task(delayed_snapshot())
        else:
            logger.debug("Throttling sending snapshot")

    def _maybe_start_simulated_task(self):
        any_simulated = any(
            p.participation.simulated for p in self.state.participants.values()
        )
        if any_simulated and self.simulated_event_task is None:
            logger.debug("Starting simulated task")
            self.simulated_event_task = asyncio.create_task(
                self._simulated_participant_loop()
            )
        elif not any_simulated and self.simulated_event_task is not None:
            logger.debug("Stopping simulated task")
            self.simulated_event_task.cancel()
            self.simulated_event_task = None

    async def _simulated_participant_loop(self):
        while True:
            try:
                for pstate in self.state.participants.values():
                    participation = pstate.participation
                    if participation.simulated:
                        new_state = choice(list(CardState))
                        event = CardChangeEvent(
                            participation=participation, state=new_state
                        )
                        logger.debug(
                            "Simulating event: paricipant=%s, state=%s",
                            event.participation.name,
                            event.state,
                        )
                        self.state.apply_event(event)
                await self.broadcast_snapshot_with_cooldown()
                await asyncio.sleep(self.SIMULATED_EVENT_INTERVAL.seconds)
            except asyncio.CancelledError:
                logger.debug("Cancelled simulated events")
                return
            except Exception:
                logger.exception("Error in simulated participant loop")
                await asyncio.sleep(self.SIMULATED_EVENT_INTERVAL.seconds)

    def __repr__(self):
        return f"MeetingChannel(meeting={self.meeting.short_code})"


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
