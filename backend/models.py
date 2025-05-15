import random
import string
from typing import Optional
import uuid
import datetime
import sqlalchemy as sa
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

class Base(DeclarativeBase):
     pass


class Meeting(Base):
    __tablename__ = "meeting"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, server_default=sa.text('gen_random_uuid()'))
    shortCode: Mapped[str] = mapped_column(name="short_code")
    name: Mapped[str]
    anonymous: Mapped[bool]
    createdAt: Mapped[Optional[datetime.datetime]] = mapped_column(name="created_at", server_default=sa.func.now())


def gen_short_code():
    return ''.join(random.choices(string.ascii_letters, k=6))
