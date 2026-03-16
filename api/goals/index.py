import logging
from uuid import UUID

from fastapi import Depends, FastAPI
from sqlmodel import Session, col, func, select

from api._lib.auth import CurrentUserId
from api._lib.db import get_session
from api._lib.models import Goal, Task
from api._lib.schemas import GoalCreate, error_response, success_response
from mangum import Mangum

logger = logging.getLogger(__name__)

app = FastAPI()


@app.get("/api/goals")
def list_goals(
    user_id: CurrentUserId,
    session: Session = Depends(get_session),
):
    try:
        uid = UUID(user_id)

        stmt = (
            select(
                Goal,
                func.count(Task.id).label("task_count"),
                func.count(Task.id).filter(
                    col(Task.status) == "done"
                ).label("done_count"),
            )
            .outerjoin(
                Task,
                (Task.goal_id == Goal.id) & (Task.is_deleted == False),  # noqa: E712
            )
            .where(Goal.user_id == uid)
            .where(Goal.is_deleted == False)  # noqa: E712
            .group_by(Goal.id)
            .order_by(Goal.created_at)
        )

        rows = session.exec(stmt).all()
        data = []
        for goal, task_count, done_count in rows:
            d = goal.model_dump(mode="json")
            d["task_count"] = task_count
            d["done_count"] = done_count
            data.append(d)

        return success_response(data)
    except Exception:
        logger.exception("Failed to fetch goals")
        return error_response("Failed to fetch goals", status_code=500)


@app.post("/api/goals")
def create_goal(
    body: GoalCreate,
    user_id: CurrentUserId,
    session: Session = Depends(get_session),
):
    try:
        uid = UUID(user_id)

        existing = session.exec(
            select(Goal)
            .where(Goal.user_id == uid)
            .where(Goal.name == body.name)
            .where(Goal.is_deleted == False)  # noqa: E712
        ).first()

        if existing is not None:
            return error_response(
                "A goal with that name already exists",
                status_code=409,
            )

        goal = Goal(
            user_id=uid,
            name=body.name,
            description=body.description,
            target_value=body.target_value,
            current_value=body.current_value,
            due_date=body.due_date,
            status=body.status,
        )
        session.add(goal)
        session.commit()
        session.refresh(goal)

        d = goal.model_dump(mode="json")
        d["task_count"] = 0
        d["done_count"] = 0

        return success_response(d)
    except Exception:
        session.rollback()
        logger.exception("Failed to create goal")
        return error_response("Failed to create goal", status_code=500)


handler = Mangum(app, lifespan="off")
