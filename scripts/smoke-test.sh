#!/usr/bin/env bash
set -e

BASE_URL="${1:-http://localhost:5000}"
echo "Testing ${BASE_URL}"

check() {
  local url="$1"
  echo "Checking ${url}"
  curl -fsS "${BASE_URL}${url}" > /dev/null
}

check "/"
check "/health"

echo "Smoke tests passed"
