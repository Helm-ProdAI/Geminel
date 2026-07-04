#!/bin/bash
# Babuu Platform smoke test
# Usage: ./scripts/smoke-test.sh [base_url]
# Default base: http://localhost:3000
#
# Verifies every page and API endpoint responds. Run after any change,
# after setup, and after deploy.

BASE="${1:-http://localhost:3000}"
PASS=0
FAIL=0

check() {
  local path="$1"
  local expect="${2:-200}"
  local code
  code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE$path")
  if [ "$code" = "$expect" ]; then
    echo "  PASS  $path ($code)"
    PASS=$((PASS+1))
  else
    echo "  FAIL  $path (got $code, expected $expect)"
    FAIL=$((FAIL+1))
  fi
}

echo "Babuu smoke test against $BASE"
echo ""
echo "Pages:"
check "/"
check "/dashboard"
check "/login"
check "/brands/new"
check "/settings"

echo ""
echo "APIs (demo-safe):"
check "/api/health"
check "/api/brands"
check "/api/news"
check "/api/tasks?brand_id=test"
check "/api/swipes?brand_id=test"
check "/api/knowledge"
check "/api/sequences?brand_id=test"
check "/api/content?brand_id=test"
check "/api/content-lab?brand_id=test"
check "/api/video?brand_id=test"
check "/api/campaigns?brand_id=test"

echo ""
echo "Graphics generation:"
check "/api/graphics?type=quote&text=Smoke%20test"

echo ""
echo "Crons (should reject without secret):"
check "/api/cron/weekly-report" 401
check "/api/cron/daily-engagement" 401
check "/api/cron/seo-rank-check" 401
check "/api/cron/ads-pacing" 401
check "/api/cron/monthly-refresh" 401
check "/api/cron/ai-news" 401
check "/api/cron/auto-scheduler" 401

echo ""
echo "Result: $PASS passed, $FAIL failed"
[ "$FAIL" -eq 0 ] && echo "Machine is healthy." || echo "Investigate failures above."
exit $FAIL
