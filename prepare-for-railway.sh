#!/bin/bash

echo "Preparing for Railway deployment..."

# Use Railway-specific package.json
cp package.railway.json package.json

# Ensure vite is in dependencies instead of devDependencies in frontend package.json
sed -i 's/"devDependencies": {/"dependencies": {\n    "vite": "^4.4.9",\n    "@vitejs\/plugin-react": "^4.0.4",/g' frontend/package.json

echo "Preparation complete! Ready to deploy to Railway."