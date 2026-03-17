import pytest
from fastapi.testclient import TestClient
from unittest.mock import MagicMock


@pytest.fixture
def mock_user_id():
    return "test-user-123"


@pytest.fixture
def mock_session():
    """A mock SQLModel Session that records calls but does nothing real."""
    session = MagicMock()
    session.exec.return_value.mappings.return_value.all.return_value = []
    return session


@pytest.fixture
def client(mock_user_id, mock_session):
    """TestClient with auth and DB dependencies overridden.

    Uses the module-level ``app`` so that ``@patch`` decorators on
    ``api._lib.ai_service`` functions work correctly (the closure
    references are already bound).
    """
    from api.ai.index import app
    from api._lib.auth import get_current_user_id
    from api._lib.db import get_session

    app.dependency_overrides[get_current_user_id] = lambda: mock_user_id
    app.dependency_overrides[get_session] = lambda: mock_session

    with TestClient(app) as c:
        yield c

    app.dependency_overrides.clear()


@pytest.fixture
def auth_headers():
    return {"Authorization": "Bearer test-token"}
