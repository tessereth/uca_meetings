import uuid
from typing import Annotated

from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select

from database import DbSession
from models import User

security = HTTPBearer()


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(security)],
    session: DbSession,
):
    try:
        user_uuid = uuid.UUID(credentials.credentials)
    except ValueError as e:
        raise HTTPException(
            status_code=401, detail="Invalid authorization header"
        ) from e
    stmt = select(User).where(User.id == user_uuid)
    results = session.scalars(stmt).all()
    if not len(results) == 1:
        raise HTTPException(status_code=401, detail="Unknown user")
    return results[0]


CurrentUser = Annotated[User, Depends(get_current_user)]
