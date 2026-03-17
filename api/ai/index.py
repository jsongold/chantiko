import logging


logger = logging.getLogger(__name__)


def _build_app():
    from fastapi import FastAPI
    from api._lib.auth import CurrentUserId
    from api._lib.schemas import AIEditRequest, error_response, success_response
    from api._lib.ai_service import generate_activity_edit, generate_goal_edit

    from api._lib.logging import add_logging_middleware, configure_logging

    configure_logging()
    app = FastAPI()
    add_logging_middleware(app)

    @app.post("/api/ai/activity-edit")
    def ai_activity_edit(
        body: AIEditRequest,
        user_id: CurrentUserId,
    ):
        try:
            result = generate_activity_edit(body.command, body.context, body.model)
            return success_response(result)
        except Exception:
            logger.exception("AI activity edit failed", extra={"user_id": user_id[:8], "endpoint": "/api/ai/activity-edit"})
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
            logger.exception("AI goal edit failed", extra={"user_id": user_id[:8], "endpoint": "/api/ai/goal-edit"})
            return error_response("AI edit failed. Please try again.", status_code=500)

    return app



app = _build_app()
