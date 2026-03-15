from uuid import UUID

from fastapi import Depends, FastAPI
from sqlalchemy import func
from sqlmodel import Session, col, select

from api._lib.auth import CurrentUserId
from api._lib.db import get_session
from api._lib.models import Activity
from api._lib.schemas import error_response, success_response
from mangum import Mangum


app = FastAPI()


@app.get("/api/activities/history")
def activity_history(
    user_id: CurrentUserId,
    session: Session = Depends(get_session),
):
    try:
        stmt = (
            select(Activity.title, func.max(Activity.created_at).label("last_used"))
            .where(Activity.user_id == UUID(user_id))
            .where(Activity.is_deleted == False)  # noqa: E712
            .group_by(Activity.title)
            .order_by(col("last_used").desc())
            .limit(10)
        )

        rows = session.exec(stmt).all()
        titles = [row[0] for row in rows]

        return success_response(titles)
    except Exception as exc:
        return error_response(f"Failed to fetch history: {exc}", status_code=500)


handler = Mangum(app, lifespan="off")
