#!/bin/sh
set -e

echo "Starting SkyNest Hotels..."

# Start nginx in background
nginx

# Start backend
exec node /app/backend/server.js
