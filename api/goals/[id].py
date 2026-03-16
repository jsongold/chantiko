import logging
from datetime import datetime, timezone
from uuid import UUID

from fastapi import Depends, FastAPI, Path
from sqlmodel import Session, select

from api._lib.auth import CurrentUserId
from api._lib.db import get_session
from api._lib.models import Goal, Task
from api._lib.schemas import GoalUpdate, error_response, success_response
from mangum import Mangum

logger = logging.getLogger(__name__)

app = FastAPI()


def _get_goal_for_user(
    session: Session, goal_id: UUID, user_id: str
) -> Goal | None:
    stmt = (
        select(Goal)
        .where(Goal.id == goal_id)
        .where(Goal.user_id == UUID(user_id))
        .where(Goal.is_deleted == False)  # noqa: E712
    )
    return session.exec(stmt).first()


@app.get("/api/goals/{id}")
def get_goal(
    user_id: CurrentUserId,
    id: UUID = Path(...),
    session: Session = Depends(get_session),
):
    try:
        goal = _get_goal_for_user(session, id, user_id)
        if goal is None:
            return error_response("Goal not found", status_code=404)

        return success_response(goal.model_dump(mode="json"))
    except Exception:
        logger.exception("Failed to fetch goal")
        return error_response("Failed to fetch goal", status_code=500)


@app.patch("/api/goals/{id}")
def update_goal(
    body: GoalUpdate,
    user_id: CurrentUserId,
    id: UUID = Path(...),
    session: Session = Depends(get_session),
):
    try:
        goal = _get_goal_for_user(session, id, user_id)
        if goal is None:
            return error_response("Goal not found", status_code=404)

        update_data = body.model_dump(exclude_none=True)
        if not update_data:
            return error_response("No fields to update")

        for field, value in update_data.items():
            setattr(goal, field, value)
        goal.updated_at = datetime.now(timezone.utc)
        session.add(goal)
        session.commit()
        session.refresh(goal)

        return success_response(goal.model_dump(mode="json"))
    except Exception:
        session.rollback()
        logger.exception("Failed to update goal")
        return error_response("Failed to update goal", status_code=500)


@app.delete("/api/goals/{id}")
def delete_goal(
    user_id: CurrentUserId,
    id: UUID = Path(...),
    session: Session = Depends(get_session),
):
    try:
        goal = _get_goal_for_user(session, id, user_id)
        if goal is None:
            return error_response("Goal not found", status_code=404)

        now = datetime.now(timezone.utc)
        goal.is_deleted = True
        goal.updated_at = now
        session.add(goal)

        tasks = session.exec(
            select(Task)
            .where(Task.goal_id == id)
            .where(Task.user_id == UUID(user_id))
            .where(Task.is_deleted == False)  # noqa: E712
        ).all()
        for task in tasks:
            task.is_deleted = True
            task.updated_at = now
            session.add(task)

        session.commit()

        return success_response({"deleted": str(id)})
    except Exception:
        session.rollback()
        logger.exception("Failed to delete goal")
        return error_response("Failed to delete goal", status_code=500)


handler = Mangum(app, lifespan="off")
