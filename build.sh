#!/bin/bash
set -e

echo "Starting build process..."

# Install frontend dependencies
echo "Installing frontend dependencies..."
cd frontend
npm ci

# Build frontend
echo "Building frontend..."
npm run build

# Install backend dependencies
echo "Installing backend dependencies..."
cd ../backend
npm ci

echo "Build completed successfully!"