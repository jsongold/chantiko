import logging
from datetime import datetime, timezone
from uuid import UUID

from fastapi import Depends, FastAPI, Path
from sqlmodel import Session, select

from api._lib.auth import CurrentUserId
from api._lib.db import get_session
from api._lib.models import Activity
from api._lib.schemas import ActivityUpdate, error_response, success_response
from mangum import Mangum

logger = logging.getLogger(__name__)


app = FastAPI()


def _get_activity_for_user(
    session: Session, activity_id: UUID, user_id: str
) -> Activity | None:
    stmt = (
        select(Activity)
        .where(Activity.id == activity_id)
        .where(Activity.user_id == UUID(user_id))
        .where(Activity.is_deleted == False)  # noqa: E712
    )
    return session.exec(stmt).first()


@app.patch("/api/activities/{id}")
def update_activity(
    body: ActivityUpdate,
    user_id: CurrentUserId,
    id: UUID = Path(...),
    session: Session = Depends(get_session),
):
    try:
        activity = _get_activity_for_user(session, id, user_id)
        if activity is None:
            return error_response("Activity not found", status_code=404)

        update_data = body.model_dump(exclude_none=True)
        if not update_data:
            return error_response("No fields to update")

        for field, value in update_data.items():
            if field in ("goal_id", "task_id") and value is not None:
                value = UUID(value)
            setattr(activity, field, value)
        activity.updated_at = datetime.now(timezone.utc)

        session.add(activity)
        session.commit()
        session.refresh(activity)

        return success_response(activity.model_dump(mode="json"))
    except Exception:
        session.rollback()
        logger.exception("Failed to update activity")
        return error_response("Failed to update activity", status_code=500)


@app.delete("/api/activities/{id}")
def delete_activity(
    user_id: CurrentUserId,
    id: UUID = Path(...),
    session: Session = Depends(get_session),
):
    try:
        activity = _get_activity_for_user(session, id, user_id)
        if activity is None:
            return error_response("Activity not found", status_code=404)

        activity.is_deleted = True
        activity.updated_at = datetime.now(timezone.utc)

        session.add(activity)
        session.commit()

        return success_response({"deleted": str(id)})
    except Exception:
        session.rollback()
        logger.exception("Failed to delete activity")
        return error_response("Failed to delete activity", status_code=500)


handler = Mangum(app, lifespan="off")
