import logging

logger = logging.getLogger(__name__)

VALID_AI_MODES = {"auto", "ask", "manual"}


def _build_app():
    from fastapi import Depends, FastAPI
    from sqlmodel import Session, text
    from api._lib.auth import CurrentUserId
    from api._lib.db import get_session
    from api._lib.schemas import error_response, success_response
    from pydantic import BaseModel
    from typing import Optional

    app = FastAPI()

    class SettingsPatch(BaseModel):
        ai_mode: Optional[str] = None
        ai_enabled: Optional[bool] = None

    @app.get("/api/settings")
    def get_settings(
        user_id: CurrentUserId,
        session: Session = Depends(get_session),
    ):
        try:
            row = session.exec(
                text(
                    "SELECT ai_mode, ai_enabled "
                    "FROM user_settings WHERE user_id = :uid"
                ).bindparams(uid=user_id)
            ).mappings().first()

            if row is None:
                return success_response({"ai_mode": "ask", "ai_enabled": True})

            return success_response(dict(row))
        except Exception:
            logger.exception("Failed to fetch settings")
            return error_response("Failed to load settings.", status_code=500)

    @app.patch("/api/settings")
    def patch_settings(
        body: SettingsPatch,
        user_id: CurrentUserId,
        session: Session = Depends(get_session),
    ):
        try:
            if body.ai_mode is not None and body.ai_mode not in VALID_AI_MODES:
                return error_response(f"Invalid ai_mode: {body.ai_mode}")

            updates = {k: v for k, v in body.model_dump().items() if v is not None}
            if not updates:
                return error_response("No fields to update.")

            set_clauses = ", ".join(f"{col} = :{col}" for col in updates)
            session.exec(
                text(
                    "INSERT INTO user_settings (user_id, ai_mode, ai_enabled) "
                    "VALUES (:user_id, 'ask', true) "
                    "ON CONFLICT (user_id) DO UPDATE "
                    f"SET {set_clauses}, updated_at = now()"
                ).bindparams(user_id=user_id, **updates)
            )
            session.commit()

            row = session.exec(
                text(
                    "SELECT ai_mode, ai_enabled "
                    "FROM user_settings WHERE user_id = :uid"
                ).bindparams(uid=user_id)
            ).mappings().first()

            return success_response(dict(row))
        except Exception:
            logger.exception("Failed to update settings")
            return error_response("Failed to save settings.", status_code=500)

    return app


app = _build_app()
