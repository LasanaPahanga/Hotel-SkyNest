#!/bin/sh
set -e

echo "Running Railway prebuild script..."

# Backup the original package.json
if [ -f frontend/package.json ]; then
  cp frontend/package.json frontend/package.json.original
fi

# Use Railway-specific package.json if it exists
if [ -f frontend/package.json.railway ]; then
  echo "Using Railway-specific package.json..."
  cp frontend/package.json.railway frontend/package.json
fi

echo "Prebuild script completed successfully!"