#!/bin/bash
set -e

cd /home/runner/workspace

echo "[CuraLive] Starting production server..."
NODE_ENV=production exec node dist/index.js
