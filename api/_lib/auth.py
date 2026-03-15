import logging
import os
from typing import Annotated

from fastapi import Depends, HTTPException, Request
from jose import JWTError, jwt

logger = logging.getLogger(__name__)

SUPABASE_JWT_SECRET = os.environ.get("SUPABASE_JWT_SECRET", "")
ALGORITHM = "HS256"
AUDIENCE = "authenticated"

AUTH_DISABLED = os.environ.get("AUTH_DISABLED", "").lower() == "true"
VERCEL_ENV = os.environ.get("VERCEL_ENV", "")
MOCK_USER_ID = "00000000-0000-0000-0000-000000000000"

if AUTH_DISABLED and VERCEL_ENV == "production":
    raise RuntimeError(
        "AUTH_DISABLED must not be enabled in production. "
        "Remove AUTH_DISABLED or set it to 'false'."
    )

if AUTH_DISABLED:
    logger.warning("Authentication is disabled. Do not use this setting in production.")


def _extract_token(request: Request) -> str:
    auth_header = request.headers.get("Authorization")
    if not auth_header:
        raise HTTPException(status_code=401, detail="Missing Authorization header")

    parts = auth_header.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(status_code=401, detail="Invalid Authorization header format")

    return parts[1]


def _decode_token(token: str) -> dict:
    if not SUPABASE_JWT_SECRET:
        raise HTTPException(status_code=500, detail="JWT secret not configured")

    try:
        payload = jwt.decode(
            token,
            SUPABASE_JWT_SECRET,
            algorithms=[ALGORITHM],
            audience=AUDIENCE,
        )
    except JWTError as exc:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    return payload


def get_current_user_id(request: Request) -> str:
    if AUTH_DISABLED:
        return MOCK_USER_ID

    token = _extract_token(request)
    payload = _decode_token(token)

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Token missing subject claim")

    return user_id


CurrentUserId = Annotated[str, Depends(get_current_user_id)]
