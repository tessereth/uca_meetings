import uuid

from pydantic import BaseModel


class CreateMeeting(BaseModel):
    meeting_name: str
    user_name: str
    anonymous: bool


class JoinMeeting(BaseModel):
    user_name: str


class Meeting(BaseModel):
    short_code: str
    name: str
    anonymous: bool

    class Config:
        from_attributes = True


class Participation(BaseModel):
    id: uuid.UUID
    name: str

    class Config:
        from_attributes = True


class MeetingResponse(BaseModel):
    meeting: Meeting
    participation: Participation
