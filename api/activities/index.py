import logging
from datetime import datetime, timezone
from typing import Optional
from uuid import UUID

from fastapi import Depends, FastAPI, Path, Query
from sqlalchemy import func
from sqlmodel import Session, col, select

from api._lib.auth import CurrentUserId
from api._lib.db import get_session
from api._lib.models import Activity
from api._lib.schemas import ActivityCreate, ActivityUpdate, error_response, success_response
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


@app.get("/api/activities")
def list_activities(
    user_id: CurrentUserId,
    session: Session = Depends(get_session),
    limit: int = Query(default=20, ge=1, le=100),
    cursor_created_at: Optional[str] = Query(default=None),
    cursor_id: Optional[str] = Query(default=None),
):
    try:
        stmt = (
            select(Activity)
            .where(Activity.user_id == UUID(user_id))
            .where(Activity.is_deleted == False)  # noqa: E712
            .order_by(col(Activity.created_at).desc(), col(Activity.id).desc())
            .limit(limit)
        )

        if cursor_created_at and cursor_id:
            cursor_ts = datetime.fromisoformat(cursor_created_at)
            stmt = stmt.where(
                (col(Activity.created_at) < cursor_ts)
                | (
                    (col(Activity.created_at) == cursor_ts)
                    & (col(Activity.id) < UUID(cursor_id))
                )
            )

        activities = session.exec(stmt).all()

        data = [act.model_dump(mode="json") for act in activities]

        next_cursor = None
        if len(activities) == limit:
            last = activities[-1]
            next_cursor = {
                "cursor_created_at": last.created_at.isoformat(),
                "cursor_id": str(last.id),
            }

        return success_response(data, meta={"limit": limit, "next_cursor": next_cursor})
    except Exception:
        logger.exception("Failed to fetch activities")
        return error_response("Failed to fetch activities", status_code=500)


@app.post("/api/activities")
def create_activity(
    body: ActivityCreate,
    user_id: CurrentUserId,
    session: Session = Depends(get_session),
):
    try:
        activity = Activity(
            user_id=UUID(user_id),
            title=body.title,
            value=body.value,
            value_unit=body.value_unit,
            category=body.category,
            goal_id=UUID(body.goal_id) if body.goal_id else None,
            task_id=UUID(body.task_id) if body.task_id else None,
        )
        session.add(activity)
        session.commit()
        session.refresh(activity)

        return success_response(activity.model_dump(mode="json"))
    except Exception:
        session.rollback()
        logger.exception("Failed to create activity")
        return error_response("Failed to create activity", status_code=500)


@app.get("/api/activities/history")
def activity_history(
    user_id: CurrentUserId,
    session: Session = Depends(get_session),
):
    try:
        last_used = func.max(Activity.created_at).label("last_used")
        stmt = (
            select(Activity.title, last_used)
            .where(Activity.user_id == UUID(user_id))
            .where(Activity.is_deleted == False)  # noqa: E712
            .group_by(Activity.title)
            .order_by(last_used.desc())
            .limit(10)
        )

        rows = session.exec(stmt).all()
        titles = [row[0] for row in rows]

        return success_response(titles)
    except Exception:
        logger.exception("Failed to fetch activity history")
        return error_response("Failed to fetch history", status_code=500)


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
