import os
from typing import Generator

from sqlmodel import Session, create_engine


def _get_database_url() -> str:
    url = (
        os.environ.get("DATABASE_URL")
        or os.environ.get("POSTGRES_URL")
        or os.environ.get("POSTGRES_URL_NON_POOLING")
        or ""
    )
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql://", 1)
    # Keep only Postgres-compatible query params
    if "?" in url:
        from urllib.parse import urlparse, parse_qs, urlencode, urlunparse
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


def get_session() -> Generator[Session, None, None]:
    if engine is None:
        raise RuntimeError("DATABASE_URL is not configured")

    with Session(engine) as session:
        yield session
