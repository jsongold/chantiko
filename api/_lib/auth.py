import os
from typing import Annotated

from fastapi import Depends, HTTPException, Request
from jwt import PyJWKClient, decode, PyJWTError


SUPABASE_URL = os.environ.get(
    "NEXT_PUBLIC_SUPABASE_URL", os.environ.get("SUPABASE_URL", "")
)
AUDIENCE = "authenticated"

_jwk_client: PyJWKClient | None = None


def _get_jwk_client() -> PyJWKClient:
    global _jwk_client
    if _jwk_client is not None:
        return _jwk_client

    if not SUPABASE_URL:
        raise HTTPException(status_code=500, detail="Supabase URL not configured")

    _jwk_client = PyJWKClient(f"{SUPABASE_URL}/auth/v1/.well-known/jwks.json")
    return _jwk_client


def _extract_token(request: Request) -> str:
    auth_header = request.headers.get("Authorization")
    if not auth_header:
        raise HTTPException(status_code=401, detail="Missing Authorization header")

    parts = auth_header.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(status_code=401, detail="Invalid Authorization header format")

    return parts[1]


def _decode_token(token: str) -> dict:
    try:
        client = _get_jwk_client()
        signing_key = client.get_signing_key_from_jwt(token)
        payload = decode(
            token,
            signing_key.key,
            algorithms=["ES256"],
            audience=AUDIENCE,
        )
    except PyJWTError:
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
