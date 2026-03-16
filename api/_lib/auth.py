import os
from typing import Annotated

from fastapi import Depends, HTTPException, Request
from jose import JWTError, jwt


SUPABASE_JWT_SECRET = os.environ.get("SUPABASE_JWT_SECRET", "")
ALGORITHM = "HS256"
AUDIENCE = "authenticated"


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
    token = _extract_token(request)
    payload = _decode_token(token)

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Token missing subject claim")

    return user_id


CurrentUserId = Annotated[str, Depends(get_current_user_id)]
