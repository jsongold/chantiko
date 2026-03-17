"""Tests for ai_service.py — generate_chat_response and generate_activity_suggestion."""

import json
from unittest.mock import MagicMock, patch


# ---------------------------------------------------------------------------
# generate_chat_response
# ---------------------------------------------------------------------------


class TestGenerateChatResponse:
    @patch("api._lib.ai_service.anthropic.Anthropic")
    def test_calls_anthropic_for_claude_model(self, mock_cls, monkeypatch):
        monkeypatch.setenv("ANTHROPIC_API_KEY", "test-key")

        mock_client = MagicMock()
        mock_cls.return_value = mock_client
        mock_client.messages.create.return_value.content = [
            MagicMock(text='{"operations": [], "summary": "done"}')
        ]

        from api._lib.ai_service import generate_chat_response

        result = generate_chat_response(
            command="hello",
            history=[],
            context={},
            model="claude-haiku-4-5-20251001",
        )

        mock_client.messages.create.assert_called_once()
        call_kwargs = mock_client.messages.create.call_args
        assert call_kwargs.kwargs["model"] == "claude-haiku-4-5-20251001"
        assert result == {"operations": [], "summary": "done"}

    @patch("api._lib.ai_service.OpenAI")
    def test_calls_openai_for_gpt_model(self, mock_cls, monkeypatch):
        monkeypatch.setenv("OPENAI_API_KEY", "test-key")

        mock_client = MagicMock()
        mock_cls.return_value = mock_client
        mock_msg = MagicMock()
        mock_msg.content = '{"operations": [{"op": "create"}], "summary": "ok"}'
        mock_client.chat.completions.create.return_value.choices = [
            MagicMock(message=mock_msg)
        ]

        from api._lib.ai_service import generate_chat_response

        result = generate_chat_response(
            command="add task",
            history=[],
            context={},
            model="gpt-4o-mini",
        )

        mock_client.chat.completions.create.assert_called_once()
        call_kwargs = mock_client.chat.completions.create.call_args
        # System message should be first in messages list for OpenAI
        msgs = call_kwargs.kwargs["messages"]
        assert msgs[0]["role"] == "system"
        assert result["summary"] == "ok"

    @patch("api._lib.ai_service.OpenAI")
    def test_returns_fallback_on_json_parse_failure(
        self, mock_cls, monkeypatch
    ):
        monkeypatch.setenv("OPENAI_API_KEY", "test-key")

        mock_client = MagicMock()
        mock_cls.return_value = mock_client
        mock_msg = MagicMock()
        mock_msg.content = "This is not JSON at all"
        mock_client.chat.completions.create.return_value.choices = [
            MagicMock(message=mock_msg)
        ]

        from api._lib.ai_service import generate_chat_response

        result = generate_chat_response(
            command="hi", history=[], context={}, model="gpt-4o-mini"
        )

        assert result["operations"] == []
        assert "Failed to parse" in result["summary"]

    @patch("api._lib.ai_service.anthropic.Anthropic")
    def test_includes_history_messages(self, mock_cls, monkeypatch):
        monkeypatch.setenv("ANTHROPIC_API_KEY", "test-key")

        mock_client = MagicMock()
        mock_cls.return_value = mock_client
        mock_client.messages.create.return_value.content = [
            MagicMock(text='{"operations": [], "summary": "ok"}')
        ]

        from api._lib.ai_service import generate_chat_response

        history = [
            {"role": "user", "content": "first msg"},
            {"role": "assistant", "content": "reply"},
        ]
        generate_chat_response(
            command="second msg",
            history=history,
            context={},
            model="claude-haiku-4-5-20251001",
        )

        call_kwargs = mock_client.messages.create.call_args.kwargs
        messages = call_kwargs["messages"]
        # history (2) + current user message (1) = 3
        assert len(messages) == 3
        assert messages[0]["role"] == "user"
        assert messages[0]["content"] == "first msg"
        assert messages[1]["role"] == "assistant"

    @patch("api._lib.ai_service.OpenAI")
    def test_falls_back_to_default_model_for_unknown(
        self, mock_cls, monkeypatch
    ):
        monkeypatch.setenv("OPENAI_API_KEY", "test-key")

        mock_client = MagicMock()
        mock_cls.return_value = mock_client
        mock_msg = MagicMock()
        mock_msg.content = '{"operations": [], "summary": "ok"}'
        mock_client.chat.completions.create.return_value.choices = [
            MagicMock(message=mock_msg)
        ]

        from api._lib.ai_service import generate_chat_response

        generate_chat_response(
            command="hi",
            history=[],
            context={},
            model="unknown-model-xyz",
        )

        call_kwargs = mock_client.chat.completions.create.call_args.kwargs
        # Should fall back to DEFAULT_MODEL (gpt-4o-mini) which uses OpenAI
        assert call_kwargs["model"] == "gpt-4o-mini"


# ---------------------------------------------------------------------------
# generate_activity_suggestion
# ---------------------------------------------------------------------------


class TestGenerateActivitySuggestion:
    @patch("api._lib.ai_service.OpenAI")
    def test_returns_parsed_suggestion(self, mock_cls, monkeypatch):
        monkeypatch.setenv("OPENAI_API_KEY", "test-key")

        suggestion = {
            "title": "Morning run",
            "value": "5",
            "value_unit": "km",
            "category": "Exercise",
            "goal_id": None,
        }
        mock_client = MagicMock()
        mock_cls.return_value = mock_client
        mock_msg = MagicMock()
        mock_msg.content = json.dumps(suggestion)
        mock_client.chat.completions.create.return_value.choices = [
            MagicMock(message=mock_msg)
        ]

        from api._lib.ai_service import generate_activity_suggestion

        result = generate_activity_suggestion(
            title_input="run 5km", context={}, model="gpt-4o-mini"
        )

        assert result["title"] == "Morning run"
        assert result["value"] == "5"
        assert result["value_unit"] == "km"
        assert result["category"] == "Exercise"

    @patch("api._lib.ai_service.OpenAI")
    def test_returns_fallback_on_json_parse_failure(
        self, mock_cls, monkeypatch
    ):
        monkeypatch.setenv("OPENAI_API_KEY", "test-key")

        mock_client = MagicMock()
        mock_cls.return_value = mock_client
        mock_msg = MagicMock()
        mock_msg.content = "not json!"
        mock_client.chat.completions.create.return_value.choices = [
            MagicMock(message=mock_msg)
        ]

        from api._lib.ai_service import generate_activity_suggestion

        result = generate_activity_suggestion(
            title_input="something", context={}, model="gpt-4o-mini"
        )

        assert result["operations"] == []
        assert "Failed to parse" in result["summary"]
