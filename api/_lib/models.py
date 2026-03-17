import uuid
from datetime import datetime, timezone
from typing import Optional

from sqlmodel import Field, SQLModel


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _new_uuid() -> uuid.UUID:
    return uuid.uuid4()


class Activity(SQLModel, table=True):
    __tablename__ = "activities"

    id: uuid.UUID = Field(default_factory=_new_uuid, primary_key=True)
    user_id: uuid.UUID = Field(index=True)
    title: str
    value: str = Field(default="")
    value_unit: Optional[str] = Field(default=None)
    category: str = Field(default="Other")
    goal_id: Optional[uuid.UUID] = Field(default=None, index=True)
    task_id: Optional[uuid.UUID] = Field(default=None, index=True)
    is_deleted: bool = Field(default=False)
    created_at: datetime = Field(default_factory=_utcnow)
    updated_at: datetime = Field(default_factory=_utcnow)


class Layer(SQLModel, table=True):
    __tablename__ = "layers"

    id: uuid.UUID = Field(default_factory=_new_uuid, primary_key=True)
    user_id: uuid.UUID = Field(index=True)
    type: str
    name: str
    parent: Optional[str] = Field(default=None)
    description: str = Field(default="")
    target_value: Optional[str] = Field(default=None)
    current_value: Optional[str] = Field(default=None)
    due_date: Optional[datetime] = Field(default=None)
    status: str = Field(default="active")
    is_deleted: bool = Field(default=False)
    created_at: datetime = Field(default_factory=_utcnow)
    updated_at: datetime = Field(default_factory=_utcnow)


class Goal(SQLModel, table=True):
    __tablename__ = "goals"

    id: uuid.UUID = Field(default_factory=_new_uuid, primary_key=True)
    user_id: uuid.UUID = Field(index=True)
    name: str
    description: str = Field(default="")
    target_value: Optional[str] = Field(default=None)
    current_value: Optional[str] = Field(default=None)
    due_date: Optional[datetime] = Field(default=None)
    status: str = Field(default="active")
    is_deleted: bool = Field(default=False)
    created_at: datetime = Field(default_factory=_utcnow)
    updated_at: datetime = Field(default_factory=_utcnow)


class Task(SQLModel, table=True):
    __tablename__ = "tasks"

    id: uuid.UUID = Field(default_factory=_new_uuid, primary_key=True)
    user_id: uuid.UUID = Field(index=True)
    goal_id: uuid.UUID = Field(index=True)
    name: str
    label: Optional[str] = Field(default=None)
    description: str = Field(default="")
    target_value: Optional[str] = Field(default=None)
    current_value: Optional[str] = Field(default=None)
    due_date: Optional[datetime] = Field(default=None)
    status: str = Field(default="active")
    is_deleted: bool = Field(default=False)
    created_at: datetime = Field(default_factory=_utcnow)
    updated_at: datetime = Field(default_factory=_utcnow)
