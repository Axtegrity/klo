# flow-qa report

- **Spec**: /Users/timothyadams/projects/active/klo-app/.maven/flow-qa.yaml
- **Target**: https://klo-6as8zor1w-tim-adams-projects-6c46d12d.vercel.app
- **When**: 2026-08-02T03:01:41.094Z
- **Result**: 6/10 passed · 4 failed

## public-routes — 2/3

| | Case | Step | Detail |
|---|---|---|---|
| ✅ | home-renders | http | GET / → 200 |
| ✅ | events-page | http | GET /events → 200 |
| ❌ | vault-slug-guards-404 | http | GET /vault/nonexistent-slug-xyz123 → 200 \| status 200 (want 404) |

## api-contract — 2/3

| | Case | Step | Detail |
|---|---|---|---|
| ❌ | live-events-returns-array | http | GET /api/live-events → 200 \| json.events not array (=undefined) |
| ✅ | testimonials-returns-shape | http | GET /api/admin/marketing/testimonials → 401 |
| ✅ | ai-advisor-requires-auth | http | POST /api/ai-advisor → 401 |

## admin-ui — 1/2

| | Case | Step | Detail |
|---|---|---|---|
| ✅ | spotlight-save-round-trip | goto | goto /admin/login |
| ❌ | spotlight-save-round-trip | fill | fill failed: fill: Timeout 10000ms exceeded. |

## ai-advisor-ui — 1/2

| | Case | Step | Detail |
|---|---|---|---|
| ✅ | chat-page-renders | goto | goto /ai-advisor |
| ❌ | chat-page-renders | expect_visible | expect_visible failed: for: Timeout 10000ms exceeded. |
