#!/usr/bin/env bash
set -e

BASE_URL="${1:-http://localhost:3000}"
PASS=0
FAIL=0

check() {
  local label="$1"
  local url="$2"
  local expect_code="${3:-200}"
  local code
  code=$(curl -s -o /dev/null -w "%{http_code}" "${BASE_URL}${url}" 2>/dev/null || echo "000")
  if [ "$code" = "$expect_code" ]; then
    echo "  ✓ ${label} (${code})"
    PASS=$((PASS + 1))
  else
    echo "  ✗ ${label} — expected ${expect_code}, got ${code}"
    FAIL=$((FAIL + 1))
  fi
}

check_json_field() {
  local label="$1"
  local url="$2"
  local field="$3"
  local expected="$4"
  local actual
  actual=$(curl -s "${BASE_URL}${url}" 2>/dev/null | grep -o "\"${field}\":[^,}]*" | head -1 | cut -d: -f2)
  if [ "$actual" = "$expected" ]; then
    echo "  ✓ ${label} (${field}=${actual})"
    PASS=$((PASS + 1))
  else
    echo "  ✗ ${label} — expected ${field}=${expected}, got ${actual}"
    FAIL=$((FAIL + 1))
  fi
}

echo "=== CuraLive Smoke Tests ==="
echo "Target: ${BASE_URL}"
echo ""

echo "--- Core Endpoints ---"
check "Homepage" "/"
check "Health" "/health"

echo ""
echo "--- Auth Endpoints ---"
check "Auth status" "/api/auth/status"
check_json_field "Auth mode" "/api/auth/status" "oauthConfigured" "false"
check_json_field "Auth unauthenticated" "/api/auth/status" "authenticated" "false"
check "OAuth callback (no OAUTH_SERVER_URL)" "/api/oauth/callback?code=test&state=test" "503"

echo ""
echo "--- Download Endpoints ---"
check "Architecture doc" "/download/architecture" "200"

echo ""
echo "=== Results: ${PASS} passed, ${FAIL} failed ==="
if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
echo "All smoke tests passed"
