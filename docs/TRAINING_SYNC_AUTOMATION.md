# KLO Training Documentation Automation

**Mission:** Keep admin training documentation in perfect sync with the actual admin interface at all times.

Tim's requirement: **"KLO has to be right at all times. We should have autonomous fixes and updates."**

---

## System Overview

Three-layer automation prevents training/code drift:

1. **Validation (CI/CD + Pre-commit)** — catches mismatches immediately
2. **Generation (Dev utility)** — creates training templates from code
3. **Monitoring (GitHub Actions)** — blocks broken PRs before they land

---

## Layer 1: Validation

### Local Pre-Commit Hook
Runs automatically when you commit changes to admin code:

```bash
git add src/app/admin/page.tsx
git commit -m "fix: update admin tab"
# → Pre-commit hook runs validate-training-sync.ts automatically
# → If training is out of sync, commit fails with clear error
```

**Location:** `.githooks/pre-commit`

**Checks:**
- Tab count: training documents all N tabs
- Tab existence: every training section references a real admin tab
- Reverse check: no orphaned training sections

### CI/CD Pipeline
Runs on every commit to main:

```bash
bun run ci
# → validate:training
# → lint
# → type-check
# → build
```

Validation happens **before** linting/building, so drift is caught early.

### GitHub Actions Workflow
Runs on every PR touching admin code:

```bash
.github/workflows/validate-training.yml
```

If training doesn't match, the PR check fails. **No merge until fixed.**

---

## Layer 2: Generation (Developer Tool)

When you add a new admin tab, use the generator to create training templates:

```bash
bun run sync:training
```

**What it does:**
1. Reads the actual admin TABS array from `src/app/admin/page.tsx`
2. Generates blank training sections with proper structure
3. Prints templates for `TRAINING_SECTIONS`, `TAB_MAP`, and `AUDIO_MAP`

**Example output:**
```json
{
  "id": "custom-tab",
  "title": "Custom Tab",
  "description": "Step-by-step guide for managing Custom Tab",
  "adminTab": "customTab",
  "steps": [
    {
      "number": 1,
      "title": "Open the Custom Tab tab",
      "instructions": "Click the Custom Tab tab in the admin dashboard"
    }
  ]
}
```

**Next steps:**
1. Copy the template into training/page.tsx
2. Customize the description, steps, and tips
3. Run `validate:training` to verify
4. Commit — pre-commit hook validates automatically

---

## Layer 3: Monitoring (GitHub Actions)

**Workflow:** `.github/workflows/validate-training.yml`

**Triggers on:**
- Changes to `src/app/admin/page.tsx` (admin tabs)
- Changes to `src/app/admin/training/page.tsx` (training content)
- Changes to `scripts/validate-training-sync.ts` (validation logic itself)

**Behavior:**
- ✅ **Pass** → training is in sync, PR can merge
- ❌ **Fail** → training is out of sync, PR is blocked until fixed

---

## Workflows

### Adding a New Admin Tab

1. **Add the tab** to `src/app/admin/page.tsx`:
   ```tsx
   {
     id: "newTab",
     label: "New Tab",
     icon: FileText,
     component: <NewTabComponent />
   }
   ```

2. **Generate training** from the new tab:
   ```bash
   bun run sync:training
   ```

3. **Copy the template** into training/page.tsx `TRAINING_SECTIONS` array, `TAB_MAP`, and `AUDIO_MAP`

4. **Customize** the training description, steps, and tips

5. **Validate**:
   ```bash
   bun run validate:training
   # Should show: ✅ Training is in sync with admin interface
   ```

6. **Commit** — pre-commit hook validates automatically:
   ```bash
   git add .
   git commit -m "feat: add New Tab with training"
   # Pre-commit validates, then commits
   ```

7. **Push to PR** — GitHub Actions validates again on the PR

### Fixing a Training/Admin Mismatch

The pre-commit hook will block you:

```bash
$ git commit -m "..."
❌ Training SYNC ISSUES:
   Admin has 16 tabs, training documents 15
   Admin tab "newTab" is not documented in training

Commit blocked by Maven pre-commit hook v2.
```

**Fix:**
```bash
# 1. Generate templates for missing tabs
bun run sync:training

# 2. Copy the template into training/page.tsx
# 3. Customize it

# 4. Validate
bun run validate:training

# 5. Try commit again — it will pass
git commit -m "..."
```

### Viewing the Validation Report

**Local validation:**
```bash
bun run validate:training
# Output:
# ✅ Training is in sync with admin interface
#    15 tabs documented
#    27 total sections (including subsections)
```

**CI/CD validation:**
Check the GitHub Actions logs on the PR for the same output.

---

## How It Works (Technical)

### Validation Script: `scripts/validate-training-sync.ts`

Extracts:
- **Admin truth:** TABS array from `src/app/admin/page.tsx`
- **Training claim:** TRAINING_SECTIONS + TAB_MAP from `src/app/admin/training/page.tsx`

Compares:
1. **Tab count:** `TRAINING_SECTIONS.filter(s => s.adminTab).length === TABS.length`
2. **Coverage:** Every admin tab ID in `TRAINING_SECTIONS`
3. **Validity:** Every training.adminTab references a real admin tab

Returns:
- `exit 0` if valid → commit/build proceeds
- `exit 1` if invalid → commit/build fails with details

### Generator Script: `scripts/sync-training-from-admin.ts`

Reads admin/page.tsx TABS array and generates:
- Kebab-case section IDs from camelCase tab IDs
- Section templates with standard structure
- TAB_MAP entries with default metadata

**Note:** Templates are **not** meant to be perfect — they're a starting point. Always customize descriptions and steps based on actual workflows.

---

## Why This Matters

Training is the **second layer of protection** against user confusion:

1. **Code + UI** — the actual interface
2. **Training** — reference guide for using the interface
3. **Request Update** — user feedback channel

If training drifts out of sync:
- Users follow outdated instructions
- They get confused ("where's that button?")
- They hit the Request Update button
- Tim spends time answering questions that would've been prevented by up-to-date training

This automation **prevents the drift in the first place**, so Tim never has to fix it manually.

---

## Summary

| Layer | Tool | Trigger | Failure Mode |
|-------|------|---------|--------------|
| **1. Validate** | `validate:training` | Every commit + PR | Commit blocks / PR check fails |
| **2. Generate** | `sync:training` | Dev runs manually | Developer gets templates to customize |
| **3. Monitor** | GitHub Actions | Every admin/training change | PR blocked until fixed |

**Command Reference:**
```bash
bun run validate:training    # Check if training matches admin code
bun run sync:training        # Generate training templates from admin tabs
bun run ci                   # Full CI pipeline (includes validation)
```

---

**Status:** Live and active as of 2026-06-01
