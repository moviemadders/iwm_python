#!/usr/bin/env bash

# dev_setup.sh - Kill existing dev servers and start backend (FastAPI) and frontend (Bun)

# Exit on any error
set -e

# Save project root
PROJECT_ROOT="$(pwd)"

echo "🔧 Killing existing development server processes..."
# Kill any running Bun processes (frontend)
pkill -f "bun" || true
# Kill any running Python ASGI servers (hypercorn, uvicorn, gunicorn)
pkill -f "hypercorn" || true
pkill -f "uvicorn" || true
pkill -f "gunicorn" || true

# Optional: give a short pause to ensure processes are terminated
sleep 1

echo "🚀 Starting backend server..."
# Navigate to backend directory and start FastAPI with hypercorn in background
cd "$PROJECT_ROOT/backend"
# Use nohup to keep it running after script exits
nohup .venv/bin/hypercorn src.main:app --bind 0.0.0.0:8000 > ../backend.log 2>&1 &

echo "🚀 Starting frontend with Bun..."
# Ensure we are in the frontend directory
cd "$PROJECT_ROOT/frontend"
# Install dependencies if needed (bun install)
if command -v bun >/dev/null 2>&1; then
  bun install
  bun dev &
else
  echo "⚠️ Bun is not installed. Please install Bun (https://bun.sh) and run the frontend manually."
fi

echo "✅ Development environment started. Backend: http://localhost:8000, Frontend: http://localhost:3000"
