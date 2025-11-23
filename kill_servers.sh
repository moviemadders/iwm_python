#!/usr/bin/env bash

# kill_servers.sh - Stop any running development servers (frontend and FastAPI backend)

# Exit on any error
set -e

echo "🔪 Killing any running development server processes..."

# Kill Bun (frontend) processes
pkill -f "bun" || true

# Kill FastAPI servers (hypercorn, uvicorn, gunicorn) if any are running
pkill -f "hypercorn" || true
pkill -f "uvicorn" || true
pkill -f "gunicorn" || true

# Optionally, kill any node processes that might be serving the frontend
pkill -f "npm run dev" || true
pkill -f "pnpm dev" || true
pkill -f "yarn dev" || true

# Give a short pause to ensure processes have terminated
sleep 1

echo "✅ All development server processes have been terminated."
