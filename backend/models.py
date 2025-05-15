import uuid
import datetime
from sqlmodel import Field, SQLModel


class Meeting(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    shortCode: str = Field(sa_column_kwargs={"name": "short_code"})
    name: str
    anonymous: bool
    createdAt: datetime.datetime = Field(sa_column_kwargs={"name": "created_at"})

