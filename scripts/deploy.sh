#!/bin/bash
# KLO Deploy + Quality Gate
# Usage: ./scripts/deploy.sh
set -e

echo "🚀 Deploying to Vercel..."
npx vercel --prod

echo ""
echo "🔍 Running quality gate (security scan + web audit)..."
echo "   Results will be posted to Slack."

# Trigger audit server (runs in background so deploy returns quickly)
curl -s -X POST http://127.0.0.1:9876/run-quality-gate \
  -H "Content-Type: application/json" \
  -d '{}' \
  --max-time 360 | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    passed = data.get('passed', False)
    sec = data.get('securityScore', 0)
    audit = data.get('auditScore', 0)
    icon = '✅' if passed else '⚠️'
    print(f'{icon} Quality Gate: Security {sec}/100, Web Audit {audit}/100 — {\"PASSED\" if passed else \"FAILED\"}')
except:
    print('⚠️  Quality gate results unavailable (check Slack)')
"
