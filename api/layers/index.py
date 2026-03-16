import logging
from uuid import UUID

from fastapi import Depends, FastAPI
from sqlmodel import Session, select

from api._lib.auth import CurrentUserId
from api._lib.db import get_session
from api._lib.models import Layer
from api._lib.schemas import LayerCreate, error_response, success_response
from mangum import Mangum

logger = logging.getLogger(__name__)


app = FastAPI()


@app.get("/api/layers")
def list_layers(
    user_id: CurrentUserId,
    session: Session = Depends(get_session),
):
    try:
        stmt = (
            select(Layer)
            .where(Layer.user_id == UUID(user_id))
            .where(Layer.is_deleted == False)  # noqa: E712
        )
        layers = session.exec(stmt).all()
        data = [layer.model_dump(mode="json") for layer in layers]

        return success_response(data)
    except Exception:
        logger.exception("Failed to fetch layers")
        return error_response("Failed to fetch layers", status_code=500)


@app.post("/api/layers")
def create_layer(
    body: LayerCreate,
    user_id: CurrentUserId,
    session: Session = Depends(get_session),
):
    try:
        uid = UUID(user_id)

        existing = session.exec(
            select(Layer)
            .where(Layer.user_id == uid)
            .where(Layer.name == body.name)
            .where(Layer.is_deleted == False)  # noqa: E712
        ).first()

        if existing is not None:
            return error_response(
                "A layer with that name already exists",
                status_code=409,
            )

        layer = Layer(
            user_id=uid,
            type=body.type,
            name=body.name,
            parent=body.parent,
            description=body.description,
            target_value=body.target_value,
            current_value=body.current_value,
            status=body.status,
        )
        session.add(layer)
        session.commit()
        session.refresh(layer)

        return success_response(layer.model_dump(mode="json"))
    except Exception:
        session.rollback()
        logger.exception("Failed to create layer")
        return error_response("Failed to create layer", status_code=500)


handler = Mangum(app, lifespan="off")
