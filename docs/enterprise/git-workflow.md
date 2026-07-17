# Git Workflow

## Commit Conventions

All commits must follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
type(scope): description

[optional body]

[optional footer]
```

### Types

| Type | Usage | Example |
|------|-------|---------|
| `feat` | New feature | `feat(orders): add bulk cancellation endpoint` |
| `fix` | Bug fix | `fix(payment): handle webhook timeout with retry` |
| `refactor` | Code restructuring | `refactor(auth): extract token validation to service` |
| `test` | Test additions/changes | `test(restaurant): add menu update integration tests` |
| `docs` | Documentation | `docs(api): update OpenAPI spec for v2 endpoints` |
| `chore` | Build/tooling/deps | `chore(deps): upgrade mongoose to 8.4.0` |
| `perf` | Performance | `perf(queries): add compound index for orders list` |
| `style` | Formatting only | `style: apply prettier formatting to services` |
| `ci` | CI/CD changes | `ci: add dependency caching to workflow` |

### Rules

- Subject line: maximum 72 characters, lowercase, no period
- Body: wrap at 72 characters, explain **what** and **why**, not **how**
- Footer: reference issues (`Closes #123`), breaking changes (`BREAKING CHANGE:`)
- One logical change per commit — no WIP commits
- Use imperative mood: "add" not "added" or "adds"

### Examples

```
feat(orders): add bulk cancellation endpoint

Implement POST /api/v1/orders/bulk-cancel that accepts an
array of order IDs and cancels them in a single transaction.
Uses optimistic locking to handle concurrent cancellation
attempts.

Closes #456
```

```
fix(payment): handle webhook timeout with retry logic

Payment gateway webhooks sometimes timeout after 30s.
Added exponential backoff retry with max 3 attempts.
Webhook processing is now idempotent.

Fixes #789
```

## Pull Request Standards

### PR Title

Follows the same Conventional Commits format as commits:

```
type(scope): description
```

### PR Description Template

```markdown
## What
Brief description of the changes in this PR.

## Why
Why these changes are needed — business context, user impact, 
or technical reason.

## How
Technical approach, architecture decisions, design patterns used.

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing performed

## Screenshots (if UI change)

## Checklist
- [ ] TypeScript strict mode passes
- [ ] ESLint — zero warnings
- [ ] Test coverage >= 85%
- [ ] Documentation updated
- [ ] Migration scripts included (if needed)

Closes #123
```

### PR Checklist

Before requesting review:
- [ ] TypeScript strict mode passes with zero errors
- [ ] ESLint produces zero warnings
- [ ] All new code has unit tests (85%+ coverage)
- [ ] No `any` types, no `@ts-ignore`, no `as` assertions
- [ ] No `console.log`, `debugger`, `TODO`, `FIXME`
- [ ] All API inputs validated with Zod schemas
- [ ] Error messages are user-friendly and actionable
- [ ] No hardcoded strings, URLs, or secrets
- [ ] Functions < 40 lines, files < 400 lines
- [ ] No circular dependencies
- [ ] Database queries use indexes and `.lean()`
- [ ] Migration scripts are reversible
- [ ] Documentation updated in same PR
- [ ] Branch is up to date with target branch

## Merge Strategy

| Scenario | Strategy | Reason |
|----------|----------|--------|
| Feature → Develop | Squash merge | Clean history, one commit per feature |
| Develop → Release | Merge commit | Preserve feature grouping |
| Release → Main | Merge commit | Preserve release boundary |
| Hotfix → Main + Develop | Squash merge | Quick fix, then propagate |

## Git Configuration

```ini
# .gitconfig recommended settings
[core]
    autocrlf = input
    editor = code --wait
[commit]
    gpgSign = true
[push]
    autoSetupRemote = true
    followTags = true
[merge]
    conflictstyle = diff3
[rebase]
    autoSquash = true
    autoStash = true
```

## Workflow Commands

```bash
# Starting a new feature
git checkout develop
git pull origin develop
git checkout -b feat/orders/my-feature

# During development
git add <files>
git commit -m "feat(orders): add my feature"
git push -u origin feat/orders/my-feature

# Keeping branch updated
git fetch origin develop
git rebase origin/develop
# or: git merge origin/develop

# Squashing commits before PR
git rebase -i HEAD~3  # squash last 3 commits

# After PR merge
git checkout develop
git pull origin develop
git branch -d feat/orders/my-feature
```
