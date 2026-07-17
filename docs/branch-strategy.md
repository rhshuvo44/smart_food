# Branch Strategy

## Overview

```
main ──► release/v2.1.0 ──► main (tag: v2.1.0)
  │                            │
  └── develop ────────────────┘
       │
       ├── feat/orders/bulk-cancel
       ├── fix/payment/webhook-timeout
       ├── refactor/auth/extract-service
       ├── chore/deps/upgrade-mongoose
       └── test/restaurant/coverage
```

## Branch Lifecycle

### `main`

- Production-ready code
- Protected — no direct pushes
- Only merge commits from `release/*` or `hotfix/*`
- Every commit is a deployable release
- Git tag on every merge: `v{major}.{minor}.{patch}`

### `develop`

- Integration branch for ongoing work
- Feature branches merge here via squash merge
- Must be stable — CI passing at all times
- Protected — no direct pushes

### `feat/*` (Feature Branches)

```
feat/{scope}/{description}
```

- Branch from: `develop`
- Merge to: `develop` (squash merge)
- Lifetime: < 5 days
- Delete after merge

### `fix/*` (Bug Fix Branches)

```
fix/{scope}/{description}
```

- Branch from: `develop`
- Merge to: `develop` (squash merge)
- For non-critical bugs found during development

### `hotfix/*` (Emergency Fixes)

```
hotfix/{scope}/{description}
```

- Branch from: `main` (the production tag)
- Merge to: `main` (squash merge) AND `develop` (squash merge)
- For production-critical bugs only
- Requires architect approval
- Post-fix review required within 24 hours

### `release/*` (Release Branches)

```
release/v{major}.{minor}.{patch}
```

- Branch from: `develop`
- Merge to: `main` (merge commit) AND back to `develop`
- No feature work — only bug fixes and release prep
- Lifetime: < 3 days

## Branch Naming

| Branch Type | Format | Example |
|------------|--------|---------|
| Feature | `feat/{scope}/{description}` | `feat/orders/bulk-cancel` |
| Bug fix | `fix/{scope}/{description}` | `fix/payment/timeout` |
| Refactor | `refactor/{scope}/{description}` | `refactor/auth/extract-service` |
| Test | `test/{scope}/{description}` | `test/restaurant/coverage` |
| Docs | `docs/{scope}/{description}` | `docs/api/openapi-v2` |
| Chore | `chore/{scope}/{description}` | `chore/deps/upgrade-mongoose` |
| Performance | `perf/{scope}/{description}` | `perf/orders/query-optimization` |
| Hotfix | `hotfix/{scope}/{description}` | `hotfix/payment/crash-fix` |
| Release | `release/v{major}.{minor}.{patch}` | `release/v2.1.0` |

## Branch Protection Rules

### `main`
- Require pull request reviews (2 approvals)
- Require CI passing
- Require up-to-date branch
- Require signed commits
- No delete allowed

### `develop`
- Require pull request reviews (1 approval)
- Require CI passing
- Require up-to-date branch
- No delete allowed

## Branch Cleanup

- Delete feature branches after merge (automatic via GitHub)
- Delete release branches after merge
- Hotfix branches deleted after both merges complete
- Stale branches (> 30 days without activity) flagged for cleanup

## Commit History Guidelines

- `develop`: Linear history (squash merges)
- `main`: Merge commits with release boundaries
- Feature branches: Can have multiple commits, rebased before merge
- Never rewrite history on `main` or `develop`
