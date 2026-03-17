import logging
from datetime import datetime, timezone
from uuid import UUID


logger = logging.getLogger(__name__)


def _build_app():
    from fastapi import Depends, FastAPI, Path, Query
    from sqlmodel import Session, select

<<<<<<< HEAD
    from datetime import datetime as dt_cls

    from api._lib.auth import CurrentUserId
    from api._lib.db import get_session
    from api._lib.models import Task
    from api._lib.schemas import TaskCreate, TaskUpdate, error_response, success_response

    from api._lib.logging import add_logging_middleware, configure_logging

    configure_logging()
    app = FastAPI()
    add_logging_middleware(app)

=======
    from api._lib.auth import CurrentUserId
    from api._lib.db import get_session
    from api._lib.models import Task
    from api._lib.schemas import TaskCreate, TaskUpdate, error_response, success_response

    from api._lib.logging import add_logging_middleware, configure_logging

    configure_logging()
    app = FastAPI()
    add_logging_middleware(app)

>>>>>>> 6c44f9c (feat: add cross-goal tasks page with day grouping and navigation)
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
<<<<<<< HEAD
        goal_id: str = Query(...),
=======
        goal_id: str | None = Query(None),
>>>>>>> 6c44f9c (feat: add cross-goal tasks page with day grouping and navigation)
        session: Session = Depends(get_session),
    ):
        try:
            uid = UUID(user_id)
<<<<<<< HEAD
            gid = UUID(goal_id)
=======
>>>>>>> 6c44f9c (feat: add cross-goal tasks page with day grouping and navigation)

            stmt = (
                select(Task)
                .where(Task.user_id == uid)
<<<<<<< HEAD
                .where(Task.goal_id == gid)
                .where(Task.is_deleted == False)  # noqa: E712
                .order_by(Task.created_at)
            )
=======
                .where(Task.is_deleted == False)  # noqa: E712
            )
            if goal_id:
                stmt = stmt.where(Task.goal_id == UUID(goal_id)).order_by(Task.created_at)
            else:
                stmt = stmt.order_by(Task.due_date.desc().nulls_last(), Task.created_at.desc())

>>>>>>> 6c44f9c (feat: add cross-goal tasks page with day grouping and navigation)
            tasks = session.exec(stmt).all()
            data = [task.model_dump(mode="json") for task in tasks]

            return success_response(data)
        except Exception:
            logger.exception("Failed to fetch tasks", extra={"user_id": user_id[:8], "endpoint": "/api/tasks"})
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
<<<<<<< HEAD
                due_date=dt_cls.fromisoformat(body.due_date) if body.due_date else None,
=======
>>>>>>> 6c44f9c (feat: add cross-goal tasks page with day grouping and navigation)
                status=body.status,
            )
            session.add(task)
            session.commit()
            session.refresh(task)

            logger.info("Task created: %s", task.id, extra={"user_id": user_id[:8], "endpoint": "/api/tasks"})
            return success_response(task.model_dump(mode="json"))
        except Exception:
            session.rollback()
            logger.exception("Failed to create task", extra={"user_id": user_id[:8], "endpoint": "/api/tasks"})
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
<<<<<<< HEAD
                if field == "due_date" and isinstance(value, str):
                    value = dt_cls.fromisoformat(value)
=======
>>>>>>> 6c44f9c (feat: add cross-goal tasks page with day grouping and navigation)
                setattr(task, field, value)
            task.updated_at = datetime.now(timezone.utc)
            session.add(task)
            session.commit()
            session.refresh(task)

            logger.info("Task updated: %s", id, extra={"user_id": user_id[:8], "endpoint": f"/api/tasks/{id}"})
            return success_response(task.model_dump(mode="json"))
        except Exception:
            session.rollback()
            logger.exception("Failed to update task", extra={"user_id": user_id[:8], "endpoint": f"/api/tasks/{id}"})
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

            logger.info("Task deleted: %s", id, extra={"user_id": user_id[:8], "endpoint": f"/api/tasks/{id}"})
            return success_response({"deleted": str(id)})
        except Exception:
            session.rollback()
            logger.exception("Failed to delete task", extra={"user_id": user_id[:8], "endpoint": f"/api/tasks/{id}"})
            return error_response("Failed to delete task", status_code=500)

    return app



app = _build_app()
