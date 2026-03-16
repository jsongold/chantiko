import json
import os

import anthropic
from openai import OpenAI

ALLOWED_MODELS = {
    "claude-haiku-4-5-20251001",
    "claude-sonnet-4-5-20250514",
    "gpt-4o-mini",
    "gpt-4o",
}

ANTHROPIC_MODELS = {
    "claude-haiku-4-5-20251001",
    "claude-sonnet-4-5-20250514",
}

DEFAULT_MODEL = "gpt-4o-mini"

ACTIVITY_SYSTEM_PROMPT = """You are an assistant that converts natural language commands into structured JSON operations on a user's activity list.

You MUST respond with ONLY valid JSON — no markdown, no explanation, no code fences.

Output format:
{
  "operations": [
    {"op": "create", "data": {"title": "...", "value": "...", "value_unit": null, "category": "Other"}},
    {"op": "update", "id": "<uuid>", "data": {"title": "...", "value": "..."}},
    {"op": "delete", "id": "<uuid>"}
  ],
  "summary": "Human-readable description of what will happen"
}

Rules:
- "op" must be one of: "create", "update", "delete"
- "id" is required for "update" and "delete" — use the id from context
- "data" is required for "create" and "update" — include only changed fields
- If the command is unclear or impossible, return {"operations": [], "summary": "Could not understand the command."}
"""

GOAL_SYSTEM_PROMPT = """You are an assistant that converts natural language commands into structured JSON operations on a user's goal/task tree.

You MUST respond with ONLY valid JSON — no markdown, no explanation, no code fences.

Output format:
{
  "operations": [
    {"op": "create", "data": {"type": "goal"|"task", "name": "...", "parent": null, "description": "", "target_value": null, "current_value": null, "status": "active"}},
    {"op": "update", "id": "<uuid>", "data": {"name": "...", "status": "done"}},
    {"op": "delete", "id": "<uuid>"}
  ],
  "summary": "Human-readable description of what will happen"
}

Rules:
- "op" must be one of: "create", "update", "delete"
- "id" is required for "update" and "delete" — use the id from context
- "data" is required for "create" and "update" — include only changed fields
- "type" must be "goal" or "task" for create operations
- If the command is unclear or impossible, return {"operations": [], "summary": "Could not understand the command."}
"""


def _call_model(
    system_prompt: str,
    command: str,
    context: list[dict],
    model: str | None = None,
) -> dict:
    model = model or os.environ.get("LLM_MODEL", DEFAULT_MODEL)
    if model not in ALLOWED_MODELS:
        model = DEFAULT_MODEL

    user_message = (
        f"Current data:\n{json.dumps(context, default=str)}\n\n"
        f"Command: {command}"
    )

    if model in ANTHROPIC_MODELS:
        api_key = os.environ.get("ANTHROPIC_API_KEY")
        if not api_key:
            raise ValueError("ANTHROPIC_API_KEY not configured")
        client = anthropic.Anthropic(
            api_key=api_key,
        )
        response = client.messages.create(
            model=model,
            max_tokens=1024,
            system=system_prompt,
            messages=[{"role": "user", "content": user_message}],
        )
        raw_text = response.content[0].text.strip()
    else:
        api_key = os.environ.get("OPENAI_API_KEY")
        if not api_key:
            raise ValueError("OPENAI_API_KEY not configured")
        client = OpenAI(
            api_key=api_key,
        )
        response = client.chat.completions.create(
            model=model,
            max_tokens=1024,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message},
            ],
        )
        raw_text = response.choices[0].message.content.strip()

    try:
        return json.loads(raw_text)
    except json.JSONDecodeError:
        return {
            "operations": [],
            "summary": "Failed to parse AI response as JSON.",
        }


def generate_activity_edit(
    command: str, context: list[dict], model: str | None = None
) -> dict:
    return _call_model(ACTIVITY_SYSTEM_PROMPT, command, context, model)


def generate_goal_edit(
    command: str, context: list[dict], model: str | None = None
) -> dict:
    return _call_model(GOAL_SYSTEM_PROMPT, command, context, model)
