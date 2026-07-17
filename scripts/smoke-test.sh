#!/usr/bin/env bash
set -euo pipefail

# ==============================================================
# SmartFood — Deployment Smoke Test
# Validates that the deployed backend is healthy and ready.
# Usage: ./scripts/smoke-test.sh [base_url]
#   Default: http://localhost:3000
# ==============================================================

BASE_URL="${1:-http://localhost:3000}"
PASS=0
FAIL=0

green() { printf "\033[32m%s\033[0m\n" "$1"; }
red()   { printf "\033[31m%s\033[0m\n" "$1"; }
bold()  { printf "\033[1m%s\033[0m\n" "$1"; }

check() {
  local label="$1" method="$2" path="$3" expected_status="$4" extra="$5"

  local response
  response=$(curl -s -o /dev/null -w "%{http_code}" -X "$method" "$BASE_URL$path" ${extra:+-H "$extra"})

  if [ "$response" = "$expected_status" ]; then
    green "  ✓ $label"
    PASS=$((PASS + 1))
  else
    red "  ✗ $label — expected $expected_status, got $response"
    FAIL=$((FAIL + 1))
  fi
}

bold "========================================"
bold "  SmartFood Smoke Tests"
bold "  Target: $BASE_URL"
bold "========================================"
echo ""

check "Health endpoint"         GET    "/api/v1/health"    200 ""
check "Ready endpoint"          GET    "/api/v1/ready"     200 ""
check "404 on unknown route"    GET    "/api/v1/nonexistent" 404 ""

echo ""
bold "----------------------------------------"
bold "  Results: $PASS passed, $FAIL failed"
bold "----------------------------------------"

if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
