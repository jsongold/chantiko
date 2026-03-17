"""Unified FastAPI app for local development.

Run: uv run uvicorn api.main:app --reload --port 8000
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.activities.index import app as activities_app
from api.goals.index import app as goals_app
from api.tasks.index import app as tasks_app
from api.ai.index import app as ai_app

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)

sub_apps = [
    activities_app,
    goals_app,
    tasks_app,
    ai_app,
]

for sub_app in sub_apps:
    for route in sub_app.routes:
        if hasattr(route, "methods") and hasattr(route, "endpoint"):
            app.router.routes.append(route)
