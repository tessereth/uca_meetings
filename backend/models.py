import random
import string
from typing import List, Optional
import uuid
import datetime
import sqlalchemy as sa
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy.orm import relationship

class Base(DeclarativeBase):
     pass


class Meeting(Base):
    __tablename__ = "meeting"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, server_default=sa.text('gen_random_uuid()'))
    short_code: Mapped[sa.Text] = mapped_column(sa.Text, nullable=False)
    name: Mapped[sa.Text] = mapped_column(sa.Text, nullable=False)
    anonymous: Mapped[bool] = mapped_column(nullable=False, server_default=sa.text('false'))
    created_at: Mapped[Optional[datetime.datetime]] = mapped_column(server_default=sa.func.now(), nullable=False)
    participants: Mapped[List["User"]] = relationship("Participation", back_populates="meeting", cascade="all, delete-orphan")


class User(Base):
    __tablename__ = "user"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, server_default=sa.text('gen_random_uuid()'))
    last_used_name: Mapped[Optional[sa.Text]] = mapped_column(sa.Text)
    created_at: Mapped[Optional[datetime.datetime]] = mapped_column(server_default=sa.func.now(), nullable=False)
    meetings: Mapped[List["Meeting"]] = relationship("Participation", back_populates="user", cascade="all, delete-orphan")


class Participation(Base):
    __tablename__ = "participation"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, server_default=sa.text('gen_random_uuid()'))
    meeting_id: Mapped[uuid.UUID] = mapped_column(sa.ForeignKey("meeting.id"), nullable=False)
    user_id: Mapped[uuid.UUID] = mapped_column(sa.ForeignKey("user.id"), nullable=False)
    name: Mapped[sa.Text] = mapped_column(sa.Text, nullable=False)
    created_at: Mapped[Optional[datetime.datetime]] = mapped_column(server_default=sa.func.now(), nullable=False)

    meeting = relationship("Meeting", back_populates="participants")
    user = relationship("User", back_populates="meetings")


def gen_short_code():
    return ''.join(random.choices(string.ascii_letters, k=6))
