#!/bin/bash
set -e

# Print versions
echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"

# Check if Vite is available globally, if not install it
echo "Checking for vite..."
if ! command -v vite &> /dev/null; then
    echo "Vite not found, installing globally..."
    npm install -g vite
fi

# Install and build frontend
echo "Setting up frontend..."
cd frontend
npm ci
echo "Building frontend..."
NODE_ENV=production npm run build

# Return to root and install backend
echo "Setting up backend..."
cd ../backend
npm ci

echo "Build process complete!"