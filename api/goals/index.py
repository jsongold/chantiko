import logging
from datetime import datetime, timezone
from uuid import UUID

from mangum import Mangum

logger = logging.getLogger(__name__)


def _build_app():
    from fastapi import Depends, FastAPI, Path
    from sqlmodel import Session, col, func, select

    from api._lib.auth import CurrentUserId
    from api._lib.db import get_session
    from api._lib.models import Goal, Task
    from api._lib.schemas import GoalCreate, GoalUpdate, error_response, success_response

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

    return app


handler = Mangum(_build_app(), lifespan="off")
