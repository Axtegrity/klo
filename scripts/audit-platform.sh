#!/bin/bash
# KLO Platform Audit Script
# Checks that UI actions connect to real working API endpoints
# Run: bash scripts/audit-platform.sh

BASE="http://localhost:3000"
PASS=0
FAIL=0

check() {
  local label="$1"
  local url="$2"
  local method="${3:-GET}"
  local status
  status=$(curl -s -o /dev/null -w "%{http_code}" -X "$method" "$url" 2>/dev/null)
  if [[ "$status" == "200" || "$status" == "201" || "$status" == "401" || "$status" == "400" ]]; then
    echo "✅ PASS: $label ($status)"
    ((PASS++))
  else
    echo "❌ FAIL: $label — got $status for $url"
    ((FAIL++))
  fi
}

echo "🔍 KLO Platform API Audit"
echo "=========================="

# Events
check "GET /api/admin/events" "$BASE/api/admin/events"
check "GET /api/live-events" "$BASE/api/live-events"
check "GET /api/featured-keynote" "$BASE/api/featured-keynote"
check "GET /api/spotlight" "$BASE/api/spotlight"

# Conference
check "GET /api/conference/polls" "$BASE/api/conference/polls"
check "GET /api/conference/sessions" "$BASE/api/conference/sessions"
check "GET /api/conference/announcements" "$BASE/api/conference/announcements"
check "GET /api/conference/snapshots" "$BASE/api/conference/snapshots?event_id=test"

# File upload endpoint exists
check "POST /api/admin/events/[id]/files (auth check)" "$BASE/api/admin/events/test-id/files" "POST"

# Poll endpoints
check "POST /api/conference/polls/upload (auth check)" "$BASE/api/conference/polls/upload" "POST"
check "POST /api/conference/polls/deploy-all (auth check)" "$BASE/api/conference/polls/deploy-all" "POST"
check "POST /api/conference/polls/reset (auth check)" "$BASE/api/conference/polls/reset" "POST"

# Auth
check "GET /api/auth/session" "$BASE/api/auth/session"
check "GET /api/auth/csrf" "$BASE/api/auth/csrf"

echo ""
echo "=========================="
echo "Results: $PASS passed, $FAIL failed"

if [[ $FAIL -gt 0 ]]; then
  echo "⚠️  $FAIL endpoint(s) not responding correctly — investigate before deploy"
  exit 1
else
  echo "✅ All endpoints responding"
fi
