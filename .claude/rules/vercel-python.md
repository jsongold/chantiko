# Vercel Python Functions

## Status
Python Runtime is Beta as of 2026-01-30. More change risk than Node/TS — design with flexibility.

## 1. Each Function is Fully Independent
No shared state between functions. Auth, DB connection, logger must be initialized per-function, per-invocation.

## 2. Cold Start — Don't Underestimate Init Cost
Each function pays its own import + framework startup cost. Splitting too many functions that share heavy deps makes cold starts worse across the board.

Split by **dependency weight**, not REST resource name:
- Light (auth, CRUD) → low deps, fast init
- Heavy (AI, image, PDF) → isolate to separate function group

## 3. Bundle Size — No Tree-Shaking (500 MB max uncompressed)
Python bundles everything reachable. Always use `excludeFiles` in `vercel.json`:

```json
{
  "functions": {
    "api/**/*.py": {
      "excludeFiles": "{tests/**,fixtures/**,sample-data/**,assets/**}"
    }
  }
}
```

- Minimize `pyproject.toml` dependencies
- Audit heavy libs (pandas, numpy, torch) — are they truly needed in every function?

## 4. Set maxDuration Explicitly Per Function

Fluid Compute defaults: Hobby max 300s, Pro/Enterprise max 800s.
Set explicitly — don't leave it to default:

| Use Case | maxDuration |
|----------|------------|
| Auth / light CRUD | 5–15s |
| LLM / external API | 30–120s |
| Heavy image/PDF | Avoid on Vercel |

## 5. Don't Put Long Sync Jobs in Vercel Functions
Heavy ETL, PDF processing, retry-heavy jobs → Cloud Run / GCP / queue.
`waitUntil` exists for background work but it's not a job queue replacement.

## 6. Match Vercel Region to DB Region
Multiple functions in different regions = inconsistent latency. DB in Tokyo → set Vercel region accordingly. Multi-region is Enterprise-only.

## 7. No WebSocket Support
Vercel Functions cannot act as WebSocket servers. Realtime → separate service.

## 8. `functions` and `builds` are Incompatible in vercel.json
Use `functions` only. With Next.js, `functions` can only set `memory` and `maxDuration`.

## 9. Recommended Structure

```
api/
  _lib/          # shared code (NOT counted as functions)
  light/         # auth, CRUD — low deps, short maxDuration
    index.py
  heavy/         # AI, image — isolated heavy deps, longer maxDuration
    index.py
```

## 10. Cache Per Endpoint
Use `Cache-Control`, `CDN-Cache-Control`, `Vercel-CDN-Cache-Control`.
Decide per endpoint: no-cache / short TTL / Vary by region or language.

## Avoid
- 1 endpoint = 1 file mass splitting
- All functions sharing one giant common import
- Long sync processing in Functions
- DB in distant region
- Unset `maxDuration` (very short without Fluid Compute)
- Mixing `functions` + `builds` in vercel.json
