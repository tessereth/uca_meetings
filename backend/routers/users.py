from fastapi import APIRouter

from database import DbSession
from dependencies import CurrentUser
from models import User

router = APIRouter()


@router.post("/api/me")
def create_user(session: DbSession):
    user = User()
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


@router.get("/api/me")
def read_current_user(current_user: CurrentUser):
    return current_user
