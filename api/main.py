"""Unified FastAPI app for local development.

Run: uv run uvicorn api.main:app --reload --port 8000
"""

import importlib

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.activities.index import app as activities_app
from api.activities.history import app as activities_history_app
from api.layers.index import app as layers_app
from api.ai.activity_edit import app as ai_activity_app
from api.ai.goal_edit import app as ai_goal_app

activities_id_mod = importlib.import_module("api.activities.[id]")
layers_id_mod = importlib.import_module("api.layers.[id]")

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
    activities_history_app,
    activities_id_mod.app,
    layers_app,
    layers_id_mod.app,
    ai_activity_app,
    ai_goal_app,
]

for sub_app in sub_apps:
    for route in sub_app.routes:
        if hasattr(route, "methods") and hasattr(route, "endpoint"):
            app.router.routes.append(route)
