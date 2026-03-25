#!/bin/bash
set -e

echo "=== CuraLive Codespace Setup ==="

sudo service postgresql start 2>/dev/null || true
sleep 2

sudo -u postgres createuser -s vscode 2>/dev/null || true
sudo -u postgres createdb curalive 2>/dev/null || true

if [ ! -f .env ]; then
  cp .env.codespace .env
  echo "Created .env from template — edit it with your API keys"
fi

npm install -g pnpm@10
pnpm install

echo ""
echo "=== Setup Complete ==="
echo ""
echo "Next steps:"
echo "  1. Edit .env with your API keys (OPENAI_API_KEY, RECALL_AI_API_KEY)"
echo "  2. Run: pnpm run dev        (development server on port 5000)"
echo "  3. Or:  npm run build && npm run start  (production on port 23636)"
echo ""
