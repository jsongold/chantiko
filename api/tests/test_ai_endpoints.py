"""Tests for the three new AI endpoints: sessions, chat, suggest-activity."""

from unittest.mock import patch


# ---------------------------------------------------------------------------
# GET /api/ai/sessions
# ---------------------------------------------------------------------------


class TestGetAiSessions:
    def test_returns_empty_list_when_no_sessions(self, client):
        """DB returns no rows -> data should be an empty list."""
        res = client.get("/api/ai/sessions")
        assert res.status_code == 200
        body = res.json()
        assert body["success"] is True
        assert body["data"] == []

    def test_returns_messages_when_sessions_exist(self, client, mock_session):
        """DB returns rows -> data should contain serialised messages."""
        from datetime import datetime, timezone

        fake_ts = datetime(2026, 1, 1, 12, 0, 0, tzinfo=timezone.utc)
        fake_row = {
            "id": "msg-1",
            "role": "user",
            "content": "hello",
            "operations": None,
            "status": None,
            "created_at": fake_ts,
        }
        mock_session.exec.return_value.mappings.return_value.all.return_value = [
            fake_row
        ]

        res = client.get("/api/ai/sessions")
        assert res.status_code == 200
        body = res.json()
        assert body["success"] is True
        assert len(body["data"]) == 1
        assert body["data"][0]["id"] == "msg-1"
        assert body["data"][0]["created_at"] == fake_ts.isoformat()

    def test_returns_500_when_db_fails(self, client, mock_session):
        """DB raises -> should return 500 with error message."""
        mock_session.exec.side_effect = RuntimeError("connection lost")

        res = client.get("/api/ai/sessions")
        assert res.status_code == 500
        body = res.json()
        assert body["success"] is False
        assert "Failed to load chat history" in body["error"]


# ---------------------------------------------------------------------------
# POST /api/ai/chat
# ---------------------------------------------------------------------------


class TestPostAiChat:
    @patch("api._lib.ai_service._call_chat_model")
    def test_returns_200_with_operations_and_summary(
        self, mock_call, client
    ):
        mock_call.return_value = {
            "operations": [{"op": "create", "entity": "activity", "data": {"title": "Run"}}],
            "summary": "Created activity Run",
        }
        res = client.post(
            "/api/ai/chat",
            json={"command": "add running"},
        )
        assert res.status_code == 200
        body = res.json()
        assert body["success"] is True
        assert len(body["data"]["operations"]) == 1
        assert body["data"]["summary"] == "Created activity Run"
        assert "user_message_id" in body["data"]
        assert "assistant_message_id" in body["data"]

    @patch("api._lib.ai_service._call_chat_model")
    def test_persists_user_and_assistant_messages(
        self, mock_call, client, mock_session
    ):
        mock_call.return_value = {"operations": [], "summary": "ok"}
        client.post("/api/ai/chat", json={"command": "do something"})

        # Two exec calls: one INSERT for user msg, one INSERT for assistant msg
        exec_calls = mock_session.exec.call_args_list
        insert_calls = [
            c for c in exec_calls
            if hasattr(c.args[0], "text") and "INSERT" in c.args[0].text
        ]
        assert len(insert_calls) == 2
        mock_session.commit.assert_called_once()

    @patch("api._lib.ai_service._call_chat_model")
    def test_returns_500_when_ai_service_raises(
        self, mock_call, client
    ):
        mock_call.side_effect = RuntimeError("API down")
        res = client.post(
            "/api/ai/chat",
            json={"command": "hello"},
        )
        assert res.status_code == 500
        body = res.json()
        assert body["success"] is False
        assert "AI chat failed" in body["error"]

    def test_validates_command_required(self, client):
        """Missing command field -> 422 validation error."""
        res = client.post("/api/ai/chat", json={})
        assert res.status_code == 422

    def test_validates_command_min_length(self, client):
        """Empty command string -> 422 validation error."""
        res = client.post("/api/ai/chat", json={"command": ""})
        assert res.status_code == 422


# ---------------------------------------------------------------------------
# POST /api/ai/suggest-activity
# ---------------------------------------------------------------------------


class TestPostAiSuggestActivity:
    @patch("api._lib.ai_service._call_chat_model")
    def test_returns_200_with_suggestion_fields(
        self, mock_call, client
    ):
        mock_call.return_value = {
            "title": "Morning jog",
            "value": "30",
            "value_unit": "minutes",
            "category": "Exercise",
            "goal_id": None,
        }
        res = client.post(
            "/api/ai/suggest-activity",
            json={"title_input": "jog 30 min"},
        )
        assert res.status_code == 200
        body = res.json()
        assert body["success"] is True
        data = body["data"]
        assert data["title"] == "Morning jog"
        assert data["value"] == "30"
        assert data["value_unit"] == "minutes"
        assert data["category"] == "Exercise"
        assert data["goal_id"] is None

    @patch("api._lib.ai_service._call_chat_model")
    def test_returns_500_when_ai_service_raises(
        self, mock_call, client
    ):
        mock_call.side_effect = RuntimeError("API down")
        res = client.post(
            "/api/ai/suggest-activity",
            json={"title_input": "run"},
        )
        assert res.status_code == 500
        body = res.json()
        assert body["success"] is False
        assert "Suggestion failed" in body["error"]

    def test_validates_title_input_required(self, client):
        """Missing title_input -> 422."""
        res = client.post("/api/ai/suggest-activity", json={})
        assert res.status_code == 422

    def test_validates_title_input_min_length(self, client):
        """Empty title_input -> 422."""
        res = client.post(
            "/api/ai/suggest-activity", json={"title_input": ""}
        )
        assert res.status_code == 422
