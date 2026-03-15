from typing import Any, Literal, Optional

from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Activity schemas
# ---------------------------------------------------------------------------

class ActivityCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    value: str = Field(..., min_length=1, max_length=100)
    value_unit: Optional[str] = Field(None, max_length=50)
    category: str = Field("Other", min_length=1, max_length=100)


class ActivityUpdate(BaseModel):
    title: Optional[str] = None
    value: Optional[str] = None
    value_unit: Optional[str] = None
    category: Optional[str] = None


# ---------------------------------------------------------------------------
# Layer schemas
# ---------------------------------------------------------------------------

class LayerCreate(BaseModel):
    type: Literal["goal", "task"]
    name: str = Field(..., min_length=1, max_length=200)
    parent: Optional[str] = None
    description: str = Field("", max_length=500)
    target_value: Optional[str] = Field(None, max_length=100)
    current_value: Optional[str] = Field(None, max_length=100)
    status: Literal["active", "done"] = "active"


class LayerUpdate(BaseModel):
    name: Optional[str] = None
    parent: Optional[str] = None
    description: Optional[str] = None
    target_value: Optional[str] = None
    current_value: Optional[str] = None
    status: Optional[str] = None


# ---------------------------------------------------------------------------
# AI schemas
# ---------------------------------------------------------------------------

class AIEditRequest(BaseModel):
    command: str = Field(..., min_length=1, max_length=2000)
    context: list[dict] = Field(..., max_length=50)
    model: Optional[str] = None


# ---------------------------------------------------------------------------
# Response helpers
# ---------------------------------------------------------------------------

def success_response(data: Any, meta: Optional[dict] = None) -> dict:
    payload: dict[str, Any] = {"success": True, "data": data}
    if meta is not None:
        payload["meta"] = meta
    return payload


def error_response(message: str, status_code: int = 400) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content={"success": False, "error": message},
    )
