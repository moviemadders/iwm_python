# 🚀 Deployment Strategy: The "Hybrid Power Stack"

For **Movie Madders** (Next.js + FastAPI + Postgres), I strongly recommend the **Hybrid Approach**.

## 🏆 The Recommended Stack
1.  **Frontend**: **Vercel**
2.  **Backend**: **Railway** (or Render)
3.  **Database**: **Railway** (or Supabase/Neon)

---

## 🆚 Comparison: Why this choice?

### Option A: The "Serverless Trap" (Vercel Everything)
*   **Frontend (Vercel)**: ✅ Perfect.
*   **Backend (Vercel)**: ⚠️ **Risky for FastAPI**.
    *   **Problem 1**: Vercel runs Python as "Serverless Functions". This means **Cold Starts** (slow first request).
    *   **Problem 2**: **No Background Tasks**. `BackgroundTasks` in FastAPI *will not work* reliably because the server freezes/dies immediately after returning the response.
    *   **Problem 3**: **Connection Pooling Issues**. Serverless functions open too many DB connections, potentially crashing your database (unless you use a pooler like Supabase Transaction Pooler).
    *   **Problem 4**: **Timeouts**. Hard limit of 10s-60s. No long-running AI/Data jobs.

### Option B: The "All-in-One" (Railway Everything)
*   **Frontend (Railway)**: ⚠️ Good, but not great.
    *   Railway serves Next.js as a Node server. It lacks Vercel's global Edge Network, Image Optimization, and instant rollbacks out-of-the-box.
*   **Backend (Railway)**: ✅ **Perfect**.
    *   Runs as a **Docker Container**.
    *   **Persistent Server**: No cold starts.
    *   **Background Tasks**: Works perfectly.
    *   **WebSockets**: Fully supported (for real-time Pulse features).
*   **Database (Railway)**: ✅ Excellent.
    *   Runs inside the same private network as the backend (super fast).

### Option C: The "Hybrid Power Stack" (Recommended) 🌟
*   **Frontend → Vercel**: Best performance, CDN, and Image Optimization for users.
*   **Backend → Railway**: Best environment for Python/FastAPI (Long-running, Async, Docker).
*   **Database → Railway/Supabase**:
    *   *Railway DB*: Fastest latency to Backend (same network).
    *   *Supabase*: Better UI, Auth, and "Realtime" features if you need them.

---

## 🛠️ Implementation Plan

### 1. Frontend (Vercel)
1.  Connect GitHub Repo to Vercel.
2.  Set Root Directory: `frontend`.
3.  Env Vars: `NEXT_PUBLIC_API_URL` -> Your Railway Backend URL.

### 2. Backend (Railway)
1.  Connect GitHub Repo to Railway.
2.  Set Root Directory: `backend`.
3.  Build Command: `pip install -r requirements.txt`.
4.  Start Command: `uvicorn src.main:app --host 0.0.0.0 --port $PORT`.
5.  **Crucial**: Add a `PostgreSQL` service in Railway and link it.

### 3. Database
*   **Simplest**: Use Railway's built-in Postgres service. It auto-injects `DATABASE_URL` into your backend.
*   **Best UI**: Use Supabase. Get the connection string and paste it into Railway's variables.

---

## 💰 Cost Estimate (Free/Hobby)
*   **Vercel**: Free (Hobby Tier).
*   **Railway**: ~$5/month (Trial available).
*   **Supabase**: Free (Tier).

**Verdict**: Go **Vercel + Railway**. It gives you the best of both worlds without the headaches of serverless Python.

---

## 🏎️ Uvicorn vs Hypercorn (HTTP/2)

You asked: *"Why Uvicorn? Why not Hypercorn with --h2?"*

### The Short Answer
Use **Uvicorn** (`uvicorn src.main:app`). It is faster and battle-tested.

### The Technical Reason
1.  **Edge Proxy Handles HTTP/2**: Railway (and Vercel/AWS) puts a "Load Balancer" or "Reverse Proxy" in front of your app.
    *   **User ↔️ Railway**: Uses **HTTP/2** or **HTTP/3** (Fast, Multiplexed).
    *   **Railway ↔️ Your Container**: Uses **HTTP/1.1** (Simple, Low Latency).
2.  **Redundancy**: Enabling HTTP/2 inside your container (Hypercorn) adds overhead but gives zero benefit because the connection is already terminated at the edge.
3.  **Performance**: Uvicorn uses `uvloop` (C-based event loop), which is significantly faster than Hypercorn's pure Python implementation for raw throughput.

**Recommendation**: Stick to `uvicorn` with `uvloop`. Let Railway handle the HTTP/2 magic for you.
