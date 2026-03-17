"""Unified FastAPI app for local development.

Run: uv run uvicorn api._lib.main:app --reload --port 8000
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.activities.index import _build_app as build_activities
from api.goals.index import _build_app as build_goals
from api.tasks.index import _build_app as build_tasks
from api.ai.index import _build_app as build_ai
from api.settings.index import _build_app as build_settings

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)

sub_apps = [
    build_activities(),
    build_goals(),
    build_tasks(),
    build_ai(),
    build_settings(),
]

for sub_app in sub_apps:
    for route in sub_app.routes:
        if hasattr(route, "methods") and hasattr(route, "endpoint"):
            app.router.routes.append(route)
