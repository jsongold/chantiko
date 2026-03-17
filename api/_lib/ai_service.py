import json
import logging
import os

import anthropic

logger = logging.getLogger(__name__)
from openai import OpenAI

ALLOWED_MODELS = {
    "claude-haiku-4-5-20251001",
    "claude-sonnet-4-5-20250514",
    "gpt-4.1-nano",
    "gpt-4o",
}

ANTHROPIC_MODELS = {
    "claude-haiku-4-5-20251001",
    "claude-sonnet-4-5-20250514",
}

DEFAULT_MODEL = "gpt-4.1-nano"

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

GOAL_SYSTEM_PROMPT = """You are an assistant that converts natural language commands into structured JSON operations on a user's goals and tasks.

You MUST respond with ONLY valid JSON — no markdown, no explanation, no code fences.

Output format:
{
  "operations": [
    {"op": "create", "entity": "goal", "data": {"name": "...", "description": "", "target_value": null, "current_value": null, "due_date": null, "status": "active"}},
    {"op": "create", "entity": "task", "data": {"goal_id": "<uuid>", "name": "...", "description": "", "status": "active"}},
    {"op": "update", "entity": "goal"|"task", "id": "<uuid>", "data": {"name": "...", "status": "done"}},
    {"op": "delete", "entity": "goal"|"task", "id": "<uuid>"}
  ],
  "summary": "Human-readable description of what will happen"
}

Rules:
- "op" must be one of: "create", "update", "delete"
- "entity" must be "goal" or "task"
- "id" is required for "update" and "delete" — use the id from context
- "data" is required for "create" and "update" — include only changed fields
- For task create, "goal_id" is required and must reference an existing goal
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

    if raw_text.startswith("```"):
        lines = raw_text.splitlines()
        raw_text = "\n".join(
            line for line in lines if not line.strip().startswith("```")
        ).strip()

    try:
        return json.loads(raw_text)
    except json.JSONDecodeError:
        return {
            "operations": [],
            "summary": "Could not understand the command.",
        }


CHAT_SYSTEM_PROMPT = """You are an assistant that converts natural language commands into structured JSON operations on a user's activities, goals, and tasks.

You MUST respond with ONLY valid JSON — no markdown, no explanation, no code fences.

Output format:
{
  "operations": [
    {"op": "create", "entity": "activity", "data": {"title": "...", "value": "...", "value_unit": null, "category": "Other", "goal_id": null}},
    {"op": "create", "entity": "goal", "data": {"name": "...", "description": "", "target_value": null, "due_date": null, "status": "active"}},
    {"op": "create", "entity": "task", "data": {"goal_id": "<uuid>", "name": "...", "description": "", "status": "active"}},
    {"op": "update", "entity": "activity"|"goal"|"task", "id": "<uuid>", "data": {"title": "..."}},
    {"op": "delete", "entity": "activity"|"goal"|"task", "id": "<uuid>"}
  ],
  "summary": "Human-readable description of what will happen"
}

Rules:
- "op" must be one of: "create", "update", "delete"
- "entity" must be "activity", "goal", or "task"
- "id" is required for "update" and "delete" — use the id from context
- "data" is required for "create" and "update" — include only changed fields
- For activity "category", use only: "Exercise", "Study", "Work", "Other"
- For activity "value_unit", use only: "minutes", "hours", "reps", "sets", "times", "km", "miles", "steps", "kg", "lbs", "pages", "calories", or null
- For goals: ALWAYS extract "target_value" (e.g. "1 mil" → "1000000", "10 books" → "10") and "due_date" (ISO format YYYY-MM-DD, e.g. "in 1 year" → one year from today) when mentioned. Give the goal a clean short "name" (e.g. "Save 1 million", "Read 10 books").
- Context may include a "page" field ("activities", "goals", or "tasks"). Use it to infer the default entity when ambiguous. For example, on the "goals" page, "make 1 mil in 2 years" means create a goal.
- Always try to create an operation. Only return empty operations if the command is truly nonsensical.
- Today's date is provided in context as "today" if available. Use it to compute relative dates.
"""

SUGGEST_ACTIVITY_SYSTEM_PROMPT = """You are an assistant that parses a plain-language activity title and extracts structured fields.

You MUST respond with ONLY valid JSON — no markdown, no explanation, no code fences.

Output format:
{
  "title": "Clean title of the activity",
  "value": "numeric or text value (e.g. '30')",
  "value_unit": "one of the allowed units or null",
  "category": "one of the allowed categories",
  "goal_id": null
}

Rules:
- "value_unit" must be one of: "minutes", "hours", "reps", "sets", "times", "km", "miles", "steps", "kg", "lbs", "pages", "calories" — or null
- "category" must be one of: "Exercise", "Study", "Work", "Other"
- If "goal_id" can be inferred from context goals, set it; otherwise null
- "value" must be a non-empty string
- If you cannot parse a value, use "1"
"""


def _call_chat_model(
    system_prompt: str,
    command: str,
    history: list[dict],
    context: dict,
    model: str | None = None,
) -> dict:
    model = model or os.environ.get("LLM_MODEL", DEFAULT_MODEL)
    if model not in ALLOWED_MODELS:
        model = DEFAULT_MODEL

    messages: list[dict] = []
    for turn in history[-10:]:
        role = turn.get("role") if isinstance(turn, dict) else getattr(turn, "role", None)
        content = turn.get("content") if isinstance(turn, dict) else getattr(turn, "content", None)
        if role in ("user", "assistant") and content:
            messages.append({"role": role, "content": str(content)[:2000]})

    context_str = json.dumps(context, default=str) if context else "{}"
    user_message = f"Context:\n{context_str}\n\nCommand: {command}"
    messages.append({"role": "user", "content": user_message})

    if model in ANTHROPIC_MODELS:
        api_key = os.environ.get("ANTHROPIC_API_KEY")
        if not api_key:
            raise ValueError("ANTHROPIC_API_KEY not configured")
        client = anthropic.Anthropic(api_key=api_key)
        response = client.messages.create(
            model=model,
            max_tokens=1024,
            system=system_prompt,
            messages=messages,
        )
        raw_text = response.content[0].text.strip()
    else:
        api_key = os.environ.get("OPENAI_API_KEY")
        if not api_key:
            raise ValueError("OPENAI_API_KEY not configured")
        client = OpenAI(api_key=api_key)
        response = client.chat.completions.create(
            model=model,
            max_tokens=1024,
            messages=[{"role": "system", "content": system_prompt}] + messages,
        )
        raw_text = response.choices[0].message.content.strip()

    # Strip markdown code fences if present (e.g. ```json ... ```)
    if raw_text.startswith("```"):
        lines = raw_text.splitlines()
        raw_text = "\n".join(
            line for line in lines if not line.strip().startswith("```")
        ).strip()

    try:
        return json.loads(raw_text)
    except json.JSONDecodeError:
        logger.warning("Failed to parse AI response as JSON: %s", raw_text[:200])
        return {
            "operations": [],
            "summary": "I couldn't understand that request. Try something like 'log 30 min run' or 'add a goal to read 10 books'.",
        }


def generate_chat_response(
    command: str,
    history: list[dict],
    context: dict,
    model: str | None = None,
) -> dict:
    return _call_chat_model(CHAT_SYSTEM_PROMPT, command, history, context, model)


def generate_activity_suggestion(
    title_input: str,
    context: dict,
    model: str | None = None,
) -> dict:
    return _call_chat_model(
        SUGGEST_ACTIVITY_SYSTEM_PROMPT,
        title_input,
        [],
        context,
        model,
    )


def generate_activity_edit(
    command: str, context: list[dict], model: str | None = None
) -> dict:
    return _call_model(ACTIVITY_SYSTEM_PROMPT, command, context, model)


def generate_goal_edit(
    command: str, context: list[dict], model: str | None = None
) -> dict:
    return _call_model(GOAL_SYSTEM_PROMPT, command, context, model)
