# Vercel Deployment (Hobby Plan)

## Serverless Function Limit: 12

Total count includes:
- Each `.py` file in `api/` (excluding `_lib/`, `__pycache__/`)
- Next.js dynamic routes (ƒ in build output)
- Next.js middleware

## Python API File Structure

**MUST use `_build_app()` factory pattern:**

```python
import logging
from mangum import Mangum  # NOT needed on Vercel

logger = logging.getLogger(__name__)

def _build_app():
    from fastapi import Depends, FastAPI
    from sqlmodel import Session, select
    from api._lib.auth import CurrentUserId
    from api._lib.db import get_session
    from api._lib.models import MyModel
    from api._lib.schemas import MySchema, error_response, success_response

    app = FastAPI()

    @app.get("/api/my-route")
    def my_handler(...):
        ...

    return app

app = _build_app()
```

**Why this pattern:**
- Vercel's `vc_init.py` scans module-level objects and calls `issubclass()` on their bases
- SQLModel/Pydantic classes at module level cause `TypeError: issubclass() arg 1 must be a class`
- Hiding imports inside `_build_app()` keeps module namespace clean
- `app` MUST be at module level (Vercel detects FastAPI apps by name)
- No Mangum needed — Vercel handles FastAPI/ASGI natively

## Rules

1. **Keep `api/_lib/main.py` in `_lib/`** — if placed at `api/main.py`, Vercel counts it as a function
2. **Consolidate routes** — one `index.py` per domain (activities, goals, tasks, ai)
3. **Use `vercel.json` rewrites** for sub-routes that don't have their own file:

```json
{
  "framework": "nextjs",
  "rewrites": [
    { "source": "/api/activities/history", "destination": "/api/activities" },
    { "source": "/api/activities/:id", "destination": "/api/activities" },
    { "source": "/api/goals/:id", "destination": "/api/goals" },
    { "source": "/api/tasks/:id", "destination": "/api/tasks" },
    { "source": "/api/ai/:path*", "destination": "/api/ai" }
  ]
}
```

4. **Before adding new API files**, count current functions to ensure total stays under 12
5. **Local dev** uses `api/_lib/main.py` with `uv run uvicorn api._lib.main:app`
