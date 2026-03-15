# Product Requirements Document
## Chantiko — Goal & Activity Management Web App

**Version:** 1.0
**Date:** 2026-03-15
**Status:** Draft

---

## 1. Overview

Chantiko is a lightweight, fast single-page web application for tracking personal activities and managing goals/tasks. It combines freeform data capture with AI-powered editing via natural language.

---

## 2. Tech Stack

### Frontend
- **Framework:** Next.js (App Router) — SSR + fast navigation
- **Styling:** Tailwind CSS — flat design, utility-first
- **UI Components:** shadcn/ui — accessible, unstyled base components
- **State:** Zustand — minimal client state
- **Forms:** React Hook Form + Zod — validation
- **Icons:** Lucide React

### Backend
- **Runtime:** Python (FastAPI)
- **AI:** Anthropic Claude API (claude-haiku-4-5 for AI edit features)
- **ORM:** SQLModel (Pydantic + SQLAlchemy)

### Infrastructure
- **Database + Auth:** Supabase (PostgreSQL + Row Level Security)
- **Frontend Hosting:** Vercel
- **Backend Hosting:** Vercel (Python serverless functions) or Railway

---

## 3. Architecture Principles

- **Small components** — each component < 200 lines, single responsibility
- **Library-first** — no custom code where a library exists
- **DRY** — shared hooks, utils, and API client
- **Easy to update** — feature-folder structure, clear contracts between layers
- **Immutable patterns** — no direct state mutation

### Project Structure

```
chantiko/
├── frontend/                    # Next.js app
│   ├── app/
│   │   ├── layout.tsx           # Root layout with nav
│   │   ├── page.tsx             # Redirects to /activity
│   │   ├── activity/page.tsx
│   │   ├── goals/page.tsx
│   │   ├── progress/page.tsx
│   │   └── profile/page.tsx
│   ├── components/
│   │   ├── activity/            # Activity-specific components
│   │   ├── goals/               # Goal/task-specific components
│   │   ├── shared/              # Reusable across features
│   │   └── layout/              # Nav, footer, header
│   ├── hooks/                   # Custom hooks (useActivities, useGoals, etc.)
│   ├── lib/
│   │   ├── api.ts               # API client (fetch wrapper)
│   │   ├── supabase.ts          # Supabase client
│   │   └── utils.ts
│   └── types/                   # Shared TypeScript types
│
└── backend/                     # FastAPI app
    ├── main.py
    ├── routers/
    │   ├── activities.py
    │   ├── goals.py
    │   ├── tasks.py
    │   └── ai_edit.py
    ├── models/                  # SQLModel models
    ├── services/
    │   ├── activity_service.py
    │   ├── goal_service.py
    │   └── ai_service.py        # LLM integration
    └── schemas/                 # Pydantic request/response schemas
```

---

## 4. Database Schema (Supabase / PostgreSQL)

### `users`
Managed by Supabase Auth.

### `activities`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| user_id | uuid FK | references auth.users |
| title | text | freetext |
| value | text | freetext, any data type |
| category | text | derived or user-set |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### `layers` (Goals)
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| user_id | uuid FK | |
| type | text | `"goal"` \| `"task"` |
| name | text | unique per user scope |
| parent | text | parent layer name, nullable |
| description | text | |
| target_value | text | target metric, nullable |
| current_value | text | current metric, nullable |
| status | text | `"active"` \| `"done"` \| `"archived"` |
| created_at | timestamptz | |
| updated_at | timestamptz | |

All tables use Row Level Security (RLS) — users only see their own data.

---

## 5. UI / UX Design

### Global Layout

```
┌─────────────────────────────────────────┐
│  [App Name]                    [☰ Menu] │  ← Header
├─────────────────────────────────────────┤
│                                         │
│           Page Content                  │  ← Main
│                                         │
│                    [+ Add]              │  ← FAB (bottom center)
├─────────────────────────────────────────┤
│   [Activity]    [Goals/Tasks]  [Progress]│  ← Footer Nav
└─────────────────────────────────────────┘
```

- **Flat design** — no shadows, minimal borders, clean typography
- **Burger menu (top right)** → User profile and settings
- **Footer (3 icons):** Activity | Goals & Tasks | Progress

---

## 6. Feature Requirements

### 6.1 Activity Page (Default / Home)

**Purpose:** Fast capture of any activity with a title and value.

**Components:**
- `ActivityList` — scrollable list of past activities
- `ActivityCard` — individual activity display (title, value, category, time)
- `AddActivityFAB` — floating action button, bottom center
- `ActivityInputSheet` — bottom sheet / modal on FAB tap
  - Freetext `title` field with **autocomplete history** (last 10 entries)
  - "See more" link to expand full history
  - Freetext `value` field
  - Auto-categorization suggestion from AI (optional, non-blocking)
  - Submit button
- `AIEditBar` — natural language command input at top of list
  - Powered by LLM (Claude Haiku)
  - Commands: "delete last entry", "rename all 'run' to 'running'", "add 10 pushups"

**API Endpoints:**
```
GET    /api/activities          → list (paginated)
POST   /api/activities          → create
PATCH  /api/activities/{id}     → update
DELETE /api/activities/{id}     → delete
GET    /api/activities/history  → recent titles (top 10)
POST   /api/ai/activity-edit    → natural language edit
```

---

### 6.2 Goals & Tasks Page

**Purpose:** Hierarchical goal tree with linked tasks.

**Data model (Layer pattern):**
```
layer.type  = "goal" | "task"
layer.name  = "exercise-daily"
layer.parent = "health-2026"     ← parent goal's name, nullable for root
```

**Components:**
- `GoalTree` — recursive tree view of goals
- `GoalNode` — renders one goal with children collapsed/expanded
- `TaskList` — tasks under a goal
- `TaskItem` — individual task with status toggle
- `AddLayerFAB` — floating action button
- `AddLayerSheet` — bottom sheet to add goal or task
  - Select type: Goal / Task
  - Name, description, target value
  - Parent selector (searchable dropdown)
- `AIEditBar` — same pattern as Activity page
  - Commands: "add a task 'read 30 min' under 'learning'", "mark sleep goal done", "remove old tasks"

**API Endpoints:**
```
GET    /api/layers              → tree (nested or flat with parent refs)
POST   /api/layers              → create
PATCH  /api/layers/{id}         → update
DELETE /api/layers/{id}         → delete
POST   /api/ai/goal-edit        → natural language edit
```

---

### 6.3 Progress Page

**Purpose:** Visual summary of activity streaks and goal completion.

**Components:**
- `ActivityChart` — bar or line chart (use `recharts`)
- `GoalProgressBar` — per-goal progress toward target value
- `StreakBadge` — days-in-a-row for recurring activities

---

### 6.4 Profile & Settings (Burger Menu)

- Display name, avatar (via Supabase Auth)
- Default category preferences
- LLM edit preferences (on/off, model)
- Log out

---

## 7. AI Edit Feature

### Design

Both Activity and Goal pages include an `AIEditBar` component.

User types a natural language command → sent to backend → LLM interprets → generates structured diff (list of create/update/delete operations) → preview shown → user confirms → operations applied.

### Backend Flow

```
POST /api/ai/activity-edit
{
  "command": "delete all entries from yesterday",
  "context": [ ...current user activities... ]
}

Response:
{
  "operations": [
    { "op": "delete", "id": "uuid-1" },
    { "op": "delete", "id": "uuid-2" }
  ],
  "summary": "Will delete 2 activities from yesterday"
}
```

### LLM Prompt Strategy
- System prompt defines output format (JSON operations array)
- Context includes only the user's relevant recent data (< 20 items)
- Model: `claude-haiku-4-5` (fast, cost-effective for structured output)

---

## 8. API Response Format

All endpoints return:

```typescript
interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  meta?: {
    total: number
    page: number
    limit: number
  }
}
```

---

## 9. Authentication

- Supabase Auth (email/password + optionally Google OAuth)
- JWT tokens passed as `Authorization: Bearer <token>` header
- Backend validates via Supabase JWT verification
- All routes protected; no anonymous data access

---

## 10. Non-Functional Requirements

| Requirement | Target |
|-------------|--------|
| Initial page load | < 1.5s (LCP) |
| API response time | < 200ms (p95, excl. AI endpoints) |
| AI edit response | < 3s |
| Mobile-first | Responsive down to 375px |
| Accessibility | WCAG 2.1 AA |
| Test coverage | 80%+ (unit + integration) |

---

## 11. Out of Scope (v1)

- Team / sharing features
- Notifications / reminders
- Native mobile app
- Offline mode
- Recurring task scheduling
- Rich media attachments

---

## 12. Implementation Phases

### Phase 1 — Foundation
- [ ] Supabase project setup + schema migration
- [ ] Next.js app scaffold with layout, routing, auth
- [ ] FastAPI scaffold with Supabase JWT middleware

### Phase 2 — Activity Page
- [ ] Activity CRUD API
- [ ] ActivityList + ActivityCard components
- [ ] AddActivityFAB + input sheet with history autocomplete

### Phase 3 — Goals & Tasks Page
- [ ] Layer CRUD API
- [ ] GoalTree recursive component
- [ ] AddLayerSheet with parent selector

### Phase 4 — AI Edit
- [ ] Claude integration service
- [ ] AI edit endpoints for activities and goals
- [ ] AIEditBar component with preview + confirm flow

### Phase 5 — Progress + Polish
- [ ] Progress page with charts
- [ ] Profile/settings page
- [ ] E2E tests (Playwright)
- [ ] Performance audit
