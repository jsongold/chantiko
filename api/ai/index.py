import json as _json
import logging
import uuid
from datetime import datetime, timezone

logger = logging.getLogger(__name__)


def _build_app():
    from fastapi import FastAPI
    from api._lib.auth import CurrentUserId
    from api._lib.db import get_session
    from api._lib.schemas import (
        AIEditRequest,
        AIChatRequest,
        ActivitySuggestRequest,
        error_response,
        success_response,
    )
    from api._lib.ai_service import (
        generate_activity_edit,
        generate_goal_edit,
        generate_chat_response,
        generate_activity_suggestion,
    )
    from fastapi import Depends
    from sqlmodel import Session, text

    app = FastAPI()

    @app.post("/api/ai/activity-edit")
    def ai_activity_edit(
        body: AIEditRequest,
        user_id: CurrentUserId,
    ):
        try:
            result = generate_activity_edit(body.command, body.context, body.model)
            return success_response(result)
        except Exception:
            logger.exception("AI activity edit failed")
            return error_response("AI edit failed. Please try again.", status_code=500)

    @app.post("/api/ai/goal-edit")
    def ai_goal_edit(
        body: AIEditRequest,
        user_id: CurrentUserId,
    ):
        try:
            result = generate_goal_edit(body.command, body.context, body.model)
            return success_response(result)
        except Exception:
            logger.exception("AI goal edit failed")
            return error_response("AI edit failed. Please try again.", status_code=500)

    @app.get("/api/ai/sessions")
    def get_ai_sessions(
        user_id: CurrentUserId,
        session: Session = Depends(get_session),
    ):
        try:
            rows = session.exec(
                text(
                    "SELECT id, role, content, operations, status, created_at "
                    "FROM ai_sessions "
                    "WHERE user_id = :uid "
                    "ORDER BY created_at ASC "
                    "LIMIT 50"
                ).bindparams(uid=user_id)
            ).mappings().all()
            messages = [dict(row) for row in rows]
            for m in messages:
                if m.get("created_at"):
                    m["created_at"] = m["created_at"].isoformat()
            return success_response(messages)
        except Exception:
            logger.exception("Failed to fetch AI sessions")
            return error_response("Failed to load chat history.", status_code=500)

    @app.post("/api/ai/chat")
    def ai_chat(
        body: AIChatRequest,
        user_id: CurrentUserId,
        session: Session = Depends(get_session),
    ):
        try:
            result = generate_chat_response(
                body.command, body.history, body.context, body.model
            )

            now = datetime.now(timezone.utc)
            user_msg_id = str(uuid.uuid4())
            assistant_msg_id = str(uuid.uuid4())

            session.exec(
                text(
                    "INSERT INTO ai_sessions (id, user_id, role, content, created_at) "
                    "VALUES (:id, :uid, 'user', :content, :ts)"
                ).bindparams(
                    id=user_msg_id,
                    uid=user_id,
                    content=body.command,
                    ts=now,
                )
            )

            ops_json = _json.dumps(result.get("operations", []))
            session.exec(
                text(
                    "INSERT INTO ai_sessions (id, user_id, role, content, operations, created_at) "
                    "VALUES (:id, :uid, 'assistant', :content, CAST(:ops AS jsonb), :ts)"
                ).bindparams(
                    id=assistant_msg_id,
                    uid=user_id,
                    content=result.get("summary", ""),
                    ops=ops_json,
                    ts=now,
                )
            )
            session.commit()

            return success_response({
                "user_message_id": user_msg_id,
                "assistant_message_id": assistant_msg_id,
                "operations": result.get("operations", []),
                "summary": result.get("summary", ""),
            })
        except Exception:
            logger.exception("AI chat failed")
            return error_response("AI chat failed. Please try again.", status_code=500)

    @app.post("/api/ai/suggest-activity")
    def ai_suggest_activity(
        body: ActivitySuggestRequest,
        user_id: CurrentUserId,
    ):
        try:
            result = generate_activity_suggestion(
                body.title_input, body.context, body.model
            )
            return success_response(result)
        except Exception:
            logger.exception("AI suggest activity failed")
            return error_response("Suggestion failed. Please try again.", status_code=500)

    return app



app = _build_app()
