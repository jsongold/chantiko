import logging
from datetime import datetime, timezone
from uuid import UUID

from fastapi import Depends, FastAPI, Path
from sqlmodel import Session, select

from api._lib.auth import CurrentUserId
from api._lib.db import get_session
from api._lib.models import Layer
from api._lib.schemas import LayerUpdate, error_response, success_response
from mangum import Mangum

logger = logging.getLogger(__name__)


app = FastAPI()


def _get_layer_for_user(
    session: Session, layer_id: UUID, user_id: str
) -> Layer | None:
    stmt = (
        select(Layer)
        .where(Layer.id == layer_id)
        .where(Layer.user_id == UUID(user_id))
        .where(Layer.is_deleted == False)  # noqa: E712
    )
    return session.exec(stmt).first()


def _soft_delete_descendants(session: Session, user_id: UUID, parent_name: str, depth: int = 0) -> None:
    """Recursively soft-delete all layers whose parent chain leads to parent_name."""
    if depth >= 20:
        return
    children = session.exec(
        select(Layer)
        .where(Layer.user_id == user_id)
        .where(Layer.parent == parent_name)
        .where(Layer.is_deleted == False)  # noqa: E712
    ).all()

    now = datetime.now(timezone.utc)
    for child in children:
        child.is_deleted = True
        child.updated_at = now
        session.add(child)
        _soft_delete_descendants(session, user_id, child.name, depth + 1)


@app.patch("/api/layers/{id}")
def update_layer(
    body: LayerUpdate,
    user_id: CurrentUserId,
    id: UUID = Path(...),
    session: Session = Depends(get_session),
):
    try:
        layer = _get_layer_for_user(session, id, user_id)
        if layer is None:
            return error_response("Layer not found", status_code=404)

        update_data = body.model_dump(exclude_none=True)
        if not update_data:
            return error_response("No fields to update")

        old_name = layer.name
        new_name = update_data.get("name")

        for field, value in update_data.items():
            setattr(layer, field, value)
        layer.updated_at = datetime.now(timezone.utc)
        session.add(layer)

        if new_name and new_name != old_name:
            children = session.exec(
                select(Layer)
                .where(Layer.user_id == UUID(user_id))
                .where(Layer.parent == old_name)
                .where(Layer.is_deleted == False)  # noqa: E712
            ).all()
            for child in children:
                child.parent = new_name
                child.updated_at = datetime.now(timezone.utc)
                session.add(child)

        session.commit()
        session.refresh(layer)

        return success_response(layer.model_dump(mode="json"))
    except Exception:
        session.rollback()
        logger.exception("Failed to update layer")
        return error_response("Failed to update layer", status_code=500)


@app.delete("/api/layers/{id}")
def delete_layer(
    user_id: CurrentUserId,
    id: UUID = Path(...),
    session: Session = Depends(get_session),
):
    try:
        layer = _get_layer_for_user(session, id, user_id)
        if layer is None:
            return error_response("Layer not found", status_code=404)

        now = datetime.now(timezone.utc)
        layer.is_deleted = True
        layer.updated_at = now
        session.add(layer)

        _soft_delete_descendants(session, UUID(user_id), layer.name)

        session.commit()

        return success_response({"deleted": str(id)})
    except Exception:
        session.rollback()
        logger.exception("Failed to delete layer")
        return error_response("Failed to delete layer", status_code=500)


handler = Mangum(app, lifespan="off")
