import uuid

import pytest
from fastapi.testclient import TestClient

from database import get_session
from main import app


class DummySession:
    def __init__(self):
        self.added = []
        self.committed = False

    def add(self, obj):
        self.added.append(obj)

    def commit(self):
        self.committed = True

    def refresh(self, obj):
        if getattr(obj, "id", None) is None:
            setattr(obj, "id", uuid.uuid4())
        return None

    def close(self):
        return None


@pytest.fixture
def client():
    def override_get_session():
        session = DummySession()
        try:
            yield session
        finally:
            session.close()

    app.dependency_overrides[get_session] = override_get_session
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


def test_create_user_returns_created_user(client):
    response = client.post("/api/me")

    assert response.status_code == 200
    body = response.json()
    assert "id" in body
    assert body["id"]


def test_unknown_api_route_returns_not_found(client):
    response = client.get("/api/does-not-exist")

    assert response.status_code == 404
