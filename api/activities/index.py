from datetime import datetime
from typing import Optional
from uuid import UUID

from fastapi import Depends, FastAPI, Query
from sqlmodel import Session, col, select

from api._lib.auth import CurrentUserId
from api._lib.db import get_session
from api._lib.models import Activity
from api._lib.schemas import ActivityCreate, error_response, success_response
from mangum import Mangum


app = FastAPI()


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
    except Exception as exc:
        return error_response(f"Failed to fetch activities: {exc}", status_code=500)


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
        )
        session.add(activity)
        session.commit()
        session.refresh(activity)

        return success_response(activity.model_dump(mode="json"))
    except Exception as exc:
        session.rollback()
        return error_response(f"Failed to create activity: {exc}", status_code=500)


handler = Mangum(app, lifespan="off")
