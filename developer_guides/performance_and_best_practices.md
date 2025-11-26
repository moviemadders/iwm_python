# 🚀 Performance & Best Practices Guide
**Source**: Synthesized from "Movie Madders" Knowledge Base (FastAPI + Postgres Expert Scripts)

---

## ⚡ FastAPI Performance Rules

### 1. The Async/Sync Rule (Critical)
*   **Blocking I/O** (DB, File, Network): MUST use `async def` and `await`.
*   **Blocking CPU** (Heavy Math, Image Processing): MUST use `def` (runs in threadpool) or offload to Celery/BackgroundTasks.
*   **Strict Ban**: NEVER call a blocking function (like `time.sleep` or `requests.get`) inside an `async def`. It freezes the entire server.

### 2. Dependency Injection
*   **DB Connections**: Never create a new connection per request. Use a connection pool initialized in `lifespan` and injected via `Depends()`.
*   **Validation**: If validation needs the DB (e.g., "does user own this?"), use a Dependency, not route logic.

### 3. Pydantic & Validation
*   **Validation Location**: Put ALL validation in Pydantic models. Keep routes clean.
*   **Response Models**: Always set `response_model`. Let FastAPI handle the serialization.
*   **Config**: Use a global `BaseSettings` class for `.env` variables.

### 4. Background Tasks
*   **Lightweight**: Use `BackgroundTasks` for emails, logging, or simple updates.
*   **Heavyweight**: Use a message queue (Celery/RabbitMQ) for anything that requires retries or takes >5 seconds.

---

## 🐘 PostgreSQL Power User Tips

### 1. Schema Design
*   **JSONB**: Use `JSONB` for flexible/unstructured data (e.g., `Pulse.hashtags`, `Movie.metadata`). It's faster and queryable compared to `JSON`.
*   **UUIDs**: Use `external_id` (UUID/Slug) for public URLs, keep `int` IDs for internal joins.

### 2. Performance Tuning
*   **Indexing**: Always index Foreign Keys and fields used in `WHERE` clauses.
*   **Full Text Search**: Use `pg_trgm` or `tsvector` for search instead of `LIKE %...%`.
*   **Bulk Inserts**: Use `COPY` command or `bulk_insert_mappings` for large data loads (seed scripts).

### 3. Advanced Features (Consider for Future)
*   **pg_cron**: For scheduled database tasks (cleanup, materialized view refreshes).
*   **Unlogged Tables**: For temporary data/cache (faster writes, lost on crash).

---

## 🛡️ Production Readiness

### 1. Logging
*   **No Prints**: `print()` is banned.
*   **Structured Logging**: Use `structlog` or `loguru`.
*   **Context**: Include `request_id` in every log for tracing.

### 2. Deployment
*   **Server**: Run `gunicorn` with `uvicorn.workers.UvicornWorker`.
*   **Loop**: Install `uvloop` for 2x performance boost.
*   **Workers**: Set workers = `(CPU_Cores * 2) + 1`.
*   **Docs**: Disable Swagger/ReDoc in production (`docs_url=None`).

---

## 🧹 Code Quality Checklist
- [ ] No `time.sleep()` in async code.
- [ ] No hardcoded secrets (use `.env`).
- [ ] All DB calls are `await`ed.
- [ ] Pydantic models have `ConfigDict(from_attributes=True)`.
- [ ] API endpoints return Pydantic models, not dicts.
