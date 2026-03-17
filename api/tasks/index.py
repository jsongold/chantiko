import logging
from datetime import datetime, timezone
from typing import Optional
from uuid import UUID


logger = logging.getLogger(__name__)


def _build_app():
    from fastapi import Depends, FastAPI, Path, Query
    from sqlmodel import Session, col, select

    from api._lib.auth import CurrentUserId
    from api._lib.db import get_session
    from api._lib.models import Task
    from api._lib.schemas import TaskCreate, TaskUpdate, error_response, success_response

    app = FastAPI()

    def _get_task_for_user(
        session: Session, task_id: UUID, user_id: str
    ) -> Task | None:
        stmt = (
            select(Task)
            .where(Task.id == task_id)
            .where(Task.user_id == UUID(user_id))
            .where(Task.is_deleted == False)  # noqa: E712
        )
        return session.exec(stmt).first()

    @app.get("/api/tasks")
    def list_tasks(
        user_id: CurrentUserId,
        goal_id: str | None = Query(None),
        session: Session = Depends(get_session),
        limit: int = Query(default=10, ge=1, le=50),
        cursor_created_at: Optional[str] = Query(default=None),
        cursor_id: Optional[str] = Query(default=None),
    ):
        try:
            uid = UUID(user_id)

            stmt = (
                select(Task)
                .where(Task.user_id == uid)
                .where(Task.is_deleted == False)  # noqa: E712
            )
            if goal_id:
                stmt = (
                    stmt.where(Task.goal_id == UUID(goal_id))
                    .order_by(col(Task.created_at).asc(), col(Task.id).asc())
                    .limit(limit)
                )

                if cursor_created_at and cursor_id:
                    cursor_ts = datetime.fromisoformat(cursor_created_at)
                    stmt = stmt.where(
                        (col(Task.created_at) > cursor_ts)
                        | (
                            (col(Task.created_at) == cursor_ts)
                            & (col(Task.id) > UUID(cursor_id))
                        )
                    )
            else:
                stmt = stmt.order_by(Task.due_date.desc().nulls_last(), Task.created_at.desc())

            tasks = session.exec(stmt).all()
            data = [task.model_dump(mode="json") for task in tasks]

            next_cursor = None
            if goal_id and len(tasks) == limit:
                last = tasks[-1]
                next_cursor = {
                    "cursor_created_at": last.created_at.isoformat(),
                    "cursor_id": str(last.id),
                }

            return success_response(data, meta={"limit": limit, "next_cursor": next_cursor})
        except Exception:
            logger.exception("Failed to fetch tasks")
            return error_response("Failed to fetch tasks", status_code=500)

    @app.post("/api/tasks")
    def create_task(
        body: TaskCreate,
        user_id: CurrentUserId,
        session: Session = Depends(get_session),
    ):
        try:
            uid = UUID(user_id)
            gid = UUID(body.goal_id)

            task = Task(
                user_id=uid,
                goal_id=gid,
                name=body.name,
                label=body.label,
                description=body.description,
                target_value=body.target_value,
                current_value=body.current_value,
                due_date=datetime.fromisoformat(body.due_date) if body.due_date else None,
                status=body.status,
            )
            session.add(task)
            session.commit()
            session.refresh(task)

            return success_response(task.model_dump(mode="json"))
        except Exception:
            session.rollback()
            logger.exception("Failed to create task")
            return error_response("Failed to create task", status_code=500)

    @app.patch("/api/tasks/{id}")
    def update_task(
        body: TaskUpdate,
        user_id: CurrentUserId,
        id: UUID = Path(...),
        session: Session = Depends(get_session),
    ):
        try:
            task = _get_task_for_user(session, id, user_id)
            if task is None:
                return error_response("Task not found", status_code=404)

            update_data = body.model_dump(exclude_none=True)
            if not update_data:
                return error_response("No fields to update")

            for field, value in update_data.items():
                if field == "due_date" and isinstance(value, str):
                    value = datetime.fromisoformat(value)
                setattr(task, field, value)
            task.updated_at = datetime.now(timezone.utc)
            session.add(task)
            session.commit()
            session.refresh(task)

            return success_response(task.model_dump(mode="json"))
        except Exception:
            session.rollback()
            logger.exception("Failed to update task")
            return error_response("Failed to update task", status_code=500)

    @app.delete("/api/tasks/{id}")
    def delete_task(
        user_id: CurrentUserId,
        id: UUID = Path(...),
        session: Session = Depends(get_session),
    ):
        try:
            task = _get_task_for_user(session, id, user_id)
            if task is None:
                return error_response("Task not found", status_code=404)

            now = datetime.now(timezone.utc)
            task.is_deleted = True
            task.updated_at = now
            session.add(task)
            session.commit()

            return success_response({"deleted": str(id)})
        except Exception:
            session.rollback()
            logger.exception("Failed to delete task")
            return error_response("Failed to delete task", status_code=500)

    return app


app = _build_app()
