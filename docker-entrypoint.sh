#!/bin/sh
set -e

echo "Starting SkyNest Hotels..."

# Start nginx in background
nginx

# Start backend
cd /app/backend
exec node server.js
