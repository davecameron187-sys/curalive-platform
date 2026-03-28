#!/bin/bash
# GitHub Sync Script - Pushes all commits from local to GitHub ManusChatgpt branch
# This script is called automatically after every webdev_save_checkpoint
# Purpose: Ensure ChatGPT always sees the latest work on GitHub

set -e

REPO_DIR="/home/ubuntu/chorus-ai"
GITHUB_REMOTE="github"
BRANCH="ManusChatgpt"

echo "=========================================="
echo "GitHub Sync Script - Pushing to ManusChatgpt"
echo "=========================================="
echo ""

cd "$REPO_DIR" || exit 1

echo "[1/4] Checking current branch..."
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
echo "Current branch: $CURRENT_BRANCH"
echo ""

echo "[2/4] Checking git status..."
git status --short || true
echo ""

echo "[3/4] Fetching from GitHub remote..."
git fetch "$GITHUB_REMOTE" "$BRANCH" 2>/dev/null || echo "Note: GitHub remote may not be available"
echo ""

echo "[4/4] Pushing to GitHub ManusChatgpt branch..."
if git push "$GITHUB_REMOTE" "$BRANCH" --force 2>&1; then
    echo ""
    echo "✅ SUCCESS: All commits pushed to GitHub ManusChatgpt"
    echo "   URL: https://github.com/davecameron187-sys/curalive-platform/tree/ManusChatgpt"
    echo ""
    
    # Show latest commits
    echo "Latest commits on GitHub:"
    git log --oneline -5
    echo ""
else
    echo ""
    echo "⚠️  WARNING: Push to GitHub may have failed"
    echo "   This is expected if GitHub remote is not configured"
    echo "   Manual push required: git push github $BRANCH --force"
    echo ""
fi

echo "=========================================="
echo "Sync complete"
echo "=========================================="
