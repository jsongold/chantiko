"""MCP server exposing Chantiko CRUD operations as tools.

Run with: python -m api._lib.mcp_server
Connects via stdio transport for use with Claude Desktop or other MCP clients.
"""

import json
import os
import uuid
from datetime import datetime, timezone

from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import TextContent, Tool
from sqlmodel import Session, col, create_engine, func, select

from api._lib.models import Activity, Goal, Layer, Task

# ---------------------------------------------------------------------------
# Database setup (reuses same env vars as the FastAPI app)
# ---------------------------------------------------------------------------


def _get_database_url() -> str:
    url = (
        os.environ.get("DATABASE_URL")
        or os.environ.get("POSTGRES_URL")
        or os.environ.get("POSTGRES_URL_NON_POOLING")
        or ""
    )
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql://", 1)
    if "?" in url:
        from urllib.parse import parse_qs, urlencode, urlparse, urlunparse

        parsed = urlparse(url)
        params = parse_qs(parsed.query)
        pg_params = {}
        for k, v in params.items():
            if k in ("sslmode", "options", "connect_timeout", "application_name"):
                pg_params[k] = v[0]
        url = urlunparse(parsed._replace(query=urlencode(pg_params)))
    return url


DATABASE_URL = _get_database_url()
engine = create_engine(DATABASE_URL, pool_pre_ping=True) if DATABASE_URL else None


def _get_session() -> Session:
    if engine is None:
        raise RuntimeError("DATABASE_URL is not configured")
    return Session(engine)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

USER_ID_ENV = "MCP_USER_ID"


def _get_user_id() -> uuid.UUID:
    """Get user ID from environment. Must be set before running the server."""
    raw = os.environ.get(USER_ID_ENV, "")
    if not raw:
        raise RuntimeError(f"{USER_ID_ENV} environment variable is required")
    return uuid.UUID(raw)


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _serialize(obj: object) -> str:
    return json.dumps(
        obj if isinstance(obj, (dict, list)) else {},
        default=str,
        indent=2,
    )


# ---------------------------------------------------------------------------
# MCP Server
# ---------------------------------------------------------------------------

server = Server("chantiko")


@server.list_tools()
async def list_tools() -> list[Tool]:
    return [
        Tool(
            name="list_activities",
            description="List recent activities for the user (up to 50)",
            inputSchema={
                "type": "object",
                "properties": {
                    "limit": {
                        "type": "integer",
                        "description": "Max activities to return",
                        "default": 20,
                    }
                },
            },
        ),
        Tool(
            name="create_activity",
            description="Create a new activity entry",
            inputSchema={
                "type": "object",
                "properties": {
                    "title": {"type": "string", "description": "Activity title"},
                    "value": {"type": "string", "description": "Activity value"},
                    "value_unit": {
                        "type": "string",
                        "description": "Unit (minutes, hours, reps, etc.)",
                    },
                    "category": {
                        "type": "string",
                        "description": "Category (Exercise, Study, Work, Other)",
                        "default": "Other",
                    },
                },
                "required": ["title", "value"],
            },
        ),
        Tool(
            name="update_activity",
            description="Update an existing activity",
            inputSchema={
                "type": "object",
                "properties": {
                    "id": {"type": "string", "description": "Activity UUID"},
                    "title": {"type": "string"},
                    "value": {"type": "string"},
                    "value_unit": {"type": "string"},
                    "category": {"type": "string"},
                },
                "required": ["id"],
            },
        ),
        Tool(
            name="delete_activity",
            description="Soft-delete an activity",
            inputSchema={
                "type": "object",
                "properties": {
                    "id": {"type": "string", "description": "Activity UUID"},
                },
                "required": ["id"],
            },
        ),
        Tool(
            name="list_goals",
            description="List all goals with task counts",
            inputSchema={"type": "object", "properties": {}},
        ),
        Tool(
            name="create_goal",
            description="Create a new goal",
            inputSchema={
                "type": "object",
                "properties": {
                    "name": {"type": "string", "description": "Goal name"},
                    "description": {"type": "string", "default": ""},
                    "due_date": {
                        "type": "string",
                        "description": "ISO date string",
                    },
                    "target_value": {"type": "string"},
                },
                "required": ["name"],
            },
        ),
        Tool(
            name="update_goal",
            description="Update an existing goal",
            inputSchema={
                "type": "object",
                "properties": {
                    "id": {"type": "string", "description": "Goal UUID"},
                    "name": {"type": "string"},
                    "description": {"type": "string"},
                    "due_date": {"type": "string"},
                    "target_value": {"type": "string"},
                    "status": {
                        "type": "string",
                        "enum": ["active", "done", "archived"],
                    },
                },
                "required": ["id"],
            },
        ),
        Tool(
            name="delete_goal",
            description="Soft-delete a goal",
            inputSchema={
                "type": "object",
                "properties": {
                    "id": {"type": "string", "description": "Goal UUID"},
                },
                "required": ["id"],
            },
        ),
        Tool(
            name="list_tasks",
            description="List tasks for a specific goal",
            inputSchema={
                "type": "object",
                "properties": {
                    "goal_id": {
                        "type": "string",
                        "description": "Parent goal UUID",
                    },
                },
                "required": ["goal_id"],
            },
        ),
        Tool(
            name="create_task",
            description="Create a new task under a goal",
            inputSchema={
                "type": "object",
                "properties": {
                    "goal_id": {
                        "type": "string",
                        "description": "Parent goal UUID",
                    },
                    "name": {"type": "string", "description": "Task name"},
                    "description": {"type": "string", "default": ""},
                    "label": {
                        "type": "string",
                        "description": "Optional label for grouping",
                    },
                },
                "required": ["goal_id", "name"],
            },
        ),
        Tool(
            name="update_task",
            description="Update an existing task",
            inputSchema={
                "type": "object",
                "properties": {
                    "id": {"type": "string", "description": "Task UUID"},
                    "name": {"type": "string"},
                    "description": {"type": "string"},
                    "label": {"type": "string"},
                    "status": {
                        "type": "string",
                        "enum": ["active", "done", "archived"],
                    },
                },
                "required": ["id"],
            },
        ),
        Tool(
            name="delete_task",
            description="Soft-delete a task",
            inputSchema={
                "type": "object",
                "properties": {
                    "id": {"type": "string", "description": "Task UUID"},
                },
                "required": ["id"],
            },
        ),
    ]


@server.call_tool()
async def call_tool(name: str, arguments: dict) -> list[TextContent]:
    uid = _get_user_id()

    try:
        result = _handle_tool(name, arguments, uid)
        return [TextContent(type="text", text=result)]
    except Exception as e:
        return [TextContent(type="text", text=f"Error: {e}")]


def _handle_tool(name: str, args: dict, uid: uuid.UUID) -> str:
    with _get_session() as session:
        if name == "list_activities":
            return _list_activities(session, uid, args.get("limit", 20))
        elif name == "create_activity":
            return _create_activity(session, uid, args)
        elif name == "update_activity":
            return _update_activity(session, uid, args)
        elif name == "delete_activity":
            return _delete_activity(session, uid, args["id"])
        elif name == "list_goals":
            return _list_goals(session, uid)
        elif name == "create_goal":
            return _create_goal(session, uid, args)
        elif name == "update_goal":
            return _update_goal(session, uid, args)
        elif name == "delete_goal":
            return _delete_goal(session, uid, args["id"])
        elif name == "list_tasks":
            return _list_tasks(session, uid, args["goal_id"])
        elif name == "create_task":
            return _create_task(session, uid, args)
        elif name == "update_task":
            return _update_task(session, uid, args)
        elif name == "delete_task":
            return _delete_task(session, uid, args["id"])
        else:
            return f"Unknown tool: {name}"


# ---------------------------------------------------------------------------
# Tool implementations
# ---------------------------------------------------------------------------


def _list_activities(session: Session, uid: uuid.UUID, limit: int) -> str:
    limit = min(limit, 50)
    stmt = (
        select(Activity)
        .where(Activity.user_id == uid)
        .where(Activity.is_deleted == False)  # noqa: E712
        .order_by(Activity.created_at.desc())
        .limit(limit)
    )
    rows = session.exec(stmt).all()
    data = [r.model_dump(mode="json") for r in rows]
    return _serialize(data)


def _create_activity(session: Session, uid: uuid.UUID, args: dict) -> str:
    activity = Activity(
        user_id=uid,
        title=args["title"],
        value=args.get("value", ""),
        value_unit=args.get("value_unit"),
        category=args.get("category", "Other"),
    )
    session.add(activity)
    session.commit()
    session.refresh(activity)
    return _serialize(activity.model_dump(mode="json"))


def _update_activity(session: Session, uid: uuid.UUID, args: dict) -> str:
    activity = session.exec(
        select(Activity)
        .where(Activity.id == uuid.UUID(args["id"]))
        .where(Activity.user_id == uid)
        .where(Activity.is_deleted == False)  # noqa: E712
    ).first()
    if not activity:
        return "Activity not found"

    for field in ("title", "value", "value_unit", "category"):
        if field in args and args[field] is not None:
            setattr(activity, field, args[field])
    activity.updated_at = _utcnow()

    session.add(activity)
    session.commit()
    session.refresh(activity)
    return _serialize(activity.model_dump(mode="json"))


def _delete_activity(session: Session, uid: uuid.UUID, aid: str) -> str:
    activity = session.exec(
        select(Activity)
        .where(Activity.id == uuid.UUID(aid))
        .where(Activity.user_id == uid)
        .where(Activity.is_deleted == False)  # noqa: E712
    ).first()
    if not activity:
        return "Activity not found"

    activity.is_deleted = True
    activity.updated_at = _utcnow()
    session.add(activity)
    session.commit()
    return f"Deleted activity {aid}"


def _list_goals(session: Session, uid: uuid.UUID) -> str:
    stmt = (
        select(
            Goal,
            func.count(Task.id).label("task_count"),
            func.count(Task.id)
            .filter(col(Task.status) == "done")
            .label("done_count"),
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
    return _serialize(data)


def _create_goal(session: Session, uid: uuid.UUID, args: dict) -> str:
    goal = Goal(
        user_id=uid,
        name=args["name"],
        description=args.get("description", ""),
        target_value=args.get("target_value"),
        due_date=args.get("due_date"),
        status="active",
    )
    session.add(goal)
    session.commit()
    session.refresh(goal)
    return _serialize(goal.model_dump(mode="json"))


def _update_goal(session: Session, uid: uuid.UUID, args: dict) -> str:
    goal = session.exec(
        select(Goal)
        .where(Goal.id == uuid.UUID(args["id"]))
        .where(Goal.user_id == uid)
        .where(Goal.is_deleted == False)  # noqa: E712
    ).first()
    if not goal:
        return "Goal not found"

    for field in ("name", "description", "target_value", "due_date", "status"):
        if field in args and args[field] is not None:
            setattr(goal, field, args[field])
    goal.updated_at = _utcnow()

    session.add(goal)
    session.commit()
    session.refresh(goal)
    return _serialize(goal.model_dump(mode="json"))


def _delete_goal(session: Session, uid: uuid.UUID, gid: str) -> str:
    goal = session.exec(
        select(Goal)
        .where(Goal.id == uuid.UUID(gid))
        .where(Goal.user_id == uid)
        .where(Goal.is_deleted == False)  # noqa: E712
    ).first()
    if not goal:
        return "Goal not found"

    goal.is_deleted = True
    goal.updated_at = _utcnow()
    session.add(goal)
    session.commit()
    return f"Deleted goal {gid}"


def _list_tasks(session: Session, uid: uuid.UUID, goal_id: str) -> str:
    stmt = (
        select(Task)
        .where(Task.user_id == uid)
        .where(Task.goal_id == uuid.UUID(goal_id))
        .where(Task.is_deleted == False)  # noqa: E712
        .order_by(Task.created_at)
    )
    rows = session.exec(stmt).all()
    data = [r.model_dump(mode="json") for r in rows]
    return _serialize(data)


def _create_task(session: Session, uid: uuid.UUID, args: dict) -> str:
    task = Task(
        user_id=uid,
        goal_id=uuid.UUID(args["goal_id"]),
        name=args["name"],
        description=args.get("description", ""),
        label=args.get("label"),
        status="active",
    )
    session.add(task)
    session.commit()
    session.refresh(task)
    return _serialize(task.model_dump(mode="json"))


def _update_task(session: Session, uid: uuid.UUID, args: dict) -> str:
    task = session.exec(
        select(Task)
        .where(Task.id == uuid.UUID(args["id"]))
        .where(Task.user_id == uid)
        .where(Task.is_deleted == False)  # noqa: E712
    ).first()
    if not task:
        return "Task not found"

    for field in ("name", "description", "label", "status"):
        if field in args and args[field] is not None:
            setattr(task, field, args[field])
    task.updated_at = _utcnow()

    session.add(task)
    session.commit()
    session.refresh(task)
    return _serialize(task.model_dump(mode="json"))


def _delete_task(session: Session, uid: uuid.UUID, tid: str) -> str:
    task = session.exec(
        select(Task)
        .where(Task.id == uuid.UUID(tid))
        .where(Task.user_id == uid)
        .where(Task.is_deleted == False)  # noqa: E712
    ).first()
    if not task:
        return "Task not found"

    task.is_deleted = True
    task.updated_at = _utcnow()
    session.add(task)
    session.commit()
    return f"Deleted task {tid}"


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------


async def main():
    async with stdio_server() as (read_stream, write_stream):
        await server.run(read_stream, write_stream, server.create_initialization_options())


if __name__ == "__main__":
    import asyncio

    asyncio.run(main())
