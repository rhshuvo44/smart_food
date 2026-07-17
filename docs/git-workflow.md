# Git Workflow

## Commits

All commits follow [Conventional Commits 1.0.0](https://www.conventionalcommits.org/):

```
type(scope): description

body (optional, wrap at 72 chars)
```

### Types

| Type | Usage |
|------|-------|
| `feat` | New feature |
| `fix` | Bug fix |
| `refactor` | Code restructuring (no behavior change) |
| `test` | Adding or updating tests |
| `docs` | Documentation changes |
| `chore` | Build, CI, tooling, dependencies |
| `perf` | Performance improvements |
| `style` | Formatting, linting (no logic change) |

### Commit Rules

- Subject line: < 72 characters, lowercase, no period
- Body: wrap at 72 characters, explain what and why (not how)
- One logical change per commit
- No WIP commits — use `git rebase` before push

## Pull Requests

### PR Title

Conventional Commits format (same as commit message):

```
feat(orders): add bulk cancellation endpoint
```

### PR Description Template

```markdown
## What
[Brief description of what changed]

## Why
[Jira/Linear ticket link]
[Business justification]

## How
[Architecture notes, key decisions]

## Testing
- [ ] Unit tests added/passing
- [ ] Integration tests added/passing
- [ ] Manual testing on staging

## Checklist
- [ ] TypeScript strict mode — zero errors
- [ ] ESLint — zero warnings
- [ ] No `any` types
- [ ] All inputs validated with Zod
- [ ] Database queries use indexes
- [ ] Migration scripts (up + down)
- [ ] Test coverage >= 85%
- [ ] OpenAPI spec updated
```

### PR Size Limit

- Maximum 500 lines changed per PR
- Split large features into multiple logical PRs
- No combined refactoring + feature PRs

### PR Labels

- `feature`, `fix`, `refactor`, `test`, `docs`, `chore`
- Sprint number: `sprint-6`
- Priority: `P0`, `P1`, `P2`

### Review Process

1. **Author** opens PR with complete description
2. **CI** runs: lint, typecheck, test, build
3. **Reviewer** assigned (min 1, recommended 2)
4. **Reviewer** reviews within 4 hours (first pass), 24 hours (full)
5. **Author** responds to comments within 24 hours
6. **Reviewer** approves or requests changes
7. **Author** merges after approval (squash merge)

## Merge Strategy

| Branch | Strategy | Commit Message |
|--------|----------|---------------|
| Feature → develop | Squash merge | Conventional commit |
| Develop → release | Merge commit | "Release vX.Y.Z" |
| Release → main | Merge commit | "Release vX.Y.Z" |
| Hotfix → main | Squash merge | Conventional commit |
| Hotfix → develop | Squash merge | Conventional commit |

## PR Checklist (Pre-Merge)

- [ ] CI pipeline passes
- [ ] Code reviewer approved
- [ ] No blocking security or performance issues
- [ ] Branch up to date with target branch
- [ ] All review comments addressed
- [ ] Labels applied
- [ ] Ticket linked

## Prohibited

- No pushing directly to `main` or `develop`
- No merging your own PR without review
- No force-push to shared branches (`develop`, `main`, `release/*`)
- No large binary files in commits
- No commit of secrets, tokens, or credentials
