import logging
from uuid import UUID

from fastapi import Depends, FastAPI, Query
from sqlmodel import Session, select

from api._lib.auth import CurrentUserId
from api._lib.db import get_session
from api._lib.models import Task
from api._lib.schemas import TaskCreate, error_response, success_response
from mangum import Mangum

logger = logging.getLogger(__name__)

app = FastAPI()


@app.get("/api/tasks")
def list_tasks(
    user_id: CurrentUserId,
    goal_id: str = Query(...),
    session: Session = Depends(get_session),
):
    try:
        uid = UUID(user_id)
        gid = UUID(goal_id)

        stmt = (
            select(Task)
            .where(Task.user_id == uid)
            .where(Task.goal_id == gid)
            .where(Task.is_deleted == False)  # noqa: E712
            .order_by(Task.created_at)
        )
        tasks = session.exec(stmt).all()
        data = [task.model_dump(mode="json") for task in tasks]

        return success_response(data)
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


handler = Mangum(app, lifespan="off")
