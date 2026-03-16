import logging
from datetime import datetime, timezone
from uuid import UUID

from fastapi import Depends, FastAPI, Path
from sqlmodel import Session, select

from api._lib.auth import CurrentUserId
from api._lib.db import get_session
from api._lib.models import Task
from api._lib.schemas import TaskUpdate, error_response, success_response
from mangum import Mangum

logger = logging.getLogger(__name__)

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


handler = Mangum(app, lifespan="off")
