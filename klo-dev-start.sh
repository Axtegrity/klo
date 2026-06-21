#!/bin/bash
set -e

echo "🔄 Pulling development env vars..."
vercel env pull .env.local

echo "🔍 Verifying required vars..."
MISSING=()

check_var() {
  val=$(grep "^$1=" .env.local | cut -d'=' -f2- | tr -d '"')
  if [ -z "$val" ]; then
    MISSING+=("$1")
  fi
}

check_var "NEXTAUTH_SECRET"
check_var "NEXTAUTH_URL"
check_var "NEXT_PUBLIC_SUPABASE_URL"
check_var "SUPABASE_SERVICE_ROLE_KEY"

if [ ${#MISSING[@]} -gt 0 ]; then
  echo "⚠️  Missing or empty vars: ${MISSING[*]}"
  echo "Patching NEXTAUTH_URL to localhost..."
fi

# Always patch NEXTAUTH_URL to localhost for local dev
sed -i '' 's|NEXTAUTH_URL=.*|NEXTAUTH_URL="http://localhost:3000"|' .env.local

# Generate NEXTAUTH_SECRET if missing
if grep -q '^NEXTAUTH_SECRET=""' .env.local || ! grep -q '^NEXTAUTH_SECRET=' .env.local; then
  SECRET=$(openssl rand -base64 32)
  sed -i '' "s|NEXTAUTH_SECRET=.*|NEXTAUTH_SECRET=\"$SECRET\"|" .env.local
  echo "✅ Generated NEXTAUTH_SECRET"
fi

echo "✅ Env ready. Starting dev server..."
npm run dev
