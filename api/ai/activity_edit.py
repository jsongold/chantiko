import logging

from fastapi import FastAPI
from api._lib.auth import CurrentUserId
from api._lib.schemas import AIEditRequest, error_response, success_response
from api._lib.ai_service import generate_activity_edit
from mangum import Mangum

logger = logging.getLogger(__name__)

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


handler = Mangum(app, lifespan="off")
