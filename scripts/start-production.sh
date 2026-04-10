#!/bin/bash
set -e

cd /home/runner/workspace

echo "[CuraLive] Production startup — cleaning old build artifacts..."
rm -rf dist

echo "[CuraLive] Building fresh from source..."
pnpm run build 2>&1

echo "[CuraLive] Build complete — starting server..."
NODE_ENV=production exec node dist/index.js
