import os
from typing import Generator

from sqlmodel import Session, create_engine


DATABASE_URL = (
    os.environ.get("DATABASE_URL")
    or os.environ.get("POSTGRES_URL")
    or os.environ.get("POSTGRES_URL_NON_POOLING")
    or ""
)

engine = create_engine(DATABASE_URL, pool_pre_ping=True) if DATABASE_URL else None


def get_session() -> Generator[Session, None, None]:
    if engine is None:
        raise RuntimeError("DATABASE_URL is not configured")

    with Session(engine) as session:
        yield session
