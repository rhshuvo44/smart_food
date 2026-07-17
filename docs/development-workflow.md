# Development Workflow

## Daily Engineering Cadence

| Time | Activity | Duration |
|------|----------|----------|
| 09:00 - 09:15 | Standup (async check-in) | 15 min |
| 09:15 - 12:00 | Focused development | 2h 45min |
| 12:00 - 13:00 | Lunch | 1h |
| 13:00 - 14:00 | Code review block | 1h |
| 14:00 - 16:30 | Focused development | 2h 30min |
| 16:30 - 17:00 | Wrap-up, status update | 30 min |

## Feature Development Lifecycle

### Phase 1: Ticket Pickup

1. Assign yourself to the ticket (move to "In Progress")
2. Read acceptance criteria and attached design docs
3. Review the Architecture Decision Record (ADR) if applicable
4. Ask clarifying questions within 24 hours
5. Identify all files that need changes

### Phase 2: Implementation

1. Create a feature branch from `develop`
2. Implement the solution following the layer architecture:
   - **Routes** — Define endpoints and middleware chain
   - **Validators** — Zod schemas for input validation
   - **Controllers** — Thin HTTP handlers (delegate to services)
   - **Services** — Business logic (pure, testable)
   - **Models** — Mongoose schemas and indexes
3. Write unit tests alongside implementation (TDD preferred)
4. Run lint and typecheck before each commit

### Phase 3: Code Review

1. Open a PR against `develop`
2. PR title: Conventional Commits format
3. PR description: what, why, how, testing evidence
4. Assign at least 1 reviewer (recommended: 2)
5. Respond to review comments within 24 hours
6. Address all blocking issues before re-requesting review

### Phase 4: Quality Verification

1. CI pipeline must pass (lint, typecheck, tests, build)
2. QA executes manual test plan on staging
3. Performance benchmark — no regression > 10%
4. Security scan — zero critical/high findings

### Phase 5: Merge

1. Squash merge to `develop` (clean history)
2. Delete the feature branch
3. Verify CI passes on `develop`

## Commit Conventions

```
type(scope): description

body (wrapped at 72 chars, explain what and why)
```

**Types:** `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `perf`, `style`

**Examples:**
```
feat(orders): add bulk cancellation endpoint
fix(payment): handle webhook timeout with retry
refactor(auth): extract token validation to service
test(restaurant): add menu update integration tests
```

## Code Review Etiquette

- **Reviewers:** Respond within 4 hours for first pass, 24 hours for full review
- **Authors:** Respond to all comments within 24 hours
- **PR Size:** Maximum 500 lines changed. Split large features into multiple PRs
- **Labels:** Add appropriate labels (feature/fix/refactor, sprint number, priority)

## Definition of Done

- [ ] Feature implemented per acceptance criteria
- [ ] Unit tests written & passing (>= 85% coverage)
- [ ] Integration tests written & passing
- [ ] Lint & typecheck — zero errors
- [ ] Code reviewed & approved (min 1 reviewer)
- [ ] PR merged to develop
- [ ] No regression in test coverage
- [ ] No new security vulnerabilities
- [ ] Documentation updated (if applicable)
- [ ] CHANGELOG.md updated (if applicable)
