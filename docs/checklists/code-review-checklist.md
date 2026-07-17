# Code Review Checklist

## TypeScript & Type Safety

- [ ] TypeScript strict mode passes — zero errors
- [ ] No `any` types — all unknowns narrowed with type guards
- [ ] No `// @ts-ignore`, `// @ts-expect-error`, `// @ts-nocheck`
- [ ] No unsound type assertions (`as Type`) — only for `unknown` narrowing
- [ ] No non-null assertions (`!`)
- [ ] Discriminated unions used for state with multiple shapes
- [ ] Branded types used for semantically distinct IDs
- [ ] Return types explicitly annotated on exported functions

## Lint & Formatting

- [ ] ESLint produces zero errors, zero warnings
- [ ] No `console.log`, `debugger`, `TODO`, `FIXME`, `HACK`, `XXX`
- [ ] No `var` — only `const` and `let`
- [ ] No magic numbers or strings — extracted to named constants
- [ ] No dead code or commented-out code
- [ ] Code formatted with Prettier

## Architecture & Design

- [ ] Follows single responsibility principle — one file = one concern
- [ ] Functions < 40 lines, files < 400 lines
- [ ] Nesting depth < 4 levels
- [ ] Cyclomatic complexity < 10 per function
- [ ] Function parameters < 3
- [ ] Dependency direction: controllers → services → models (no reverse)
- [ ] No cross-domain imports — domains communicate via events or interfaces
- [ ] No circular dependencies (verified by madge)
- [ ] Controllers are thin (< 20 lines) — no business logic in controllers
- [ ] Services receive dependencies via constructor injection

## Error Handling

- [ ] All inputs validated with Zod at API boundary
- [ ] Standard error hierarchy used (AppError, ValidationError, etc.)
- [ ] Error messages are user-friendly and actionable
- [ ] Correlation ID in all error responses
- [ ] No empty catch blocks — always log and rethrow or handle
- [ ] Async error wrapping (catch → next(error))
- [ ] Global error handler catches all unhandled errors

## Security

- [ ] Authentication required for protected endpoints
- [ ] Authorization enforced at endpoint level
- [ ] Input validation at every system boundary
- [ ] Rate limiting configured
- [ ] No secrets, credentials, or tokens in code
- [ ] No injection vulnerabilities (NoSQL, command, XSS)
- [ ] CORS configuration correct
- [ ] Helmet headers configured
- [ ] No sensitive data in error responses
- [ ] Idempotency keys for all mutation endpoints

## Testing

- [ ] Unit tests cover: happy path, errors, edge cases
- [ ] Test coverage >= 85% lines, >= 75% branches
- [ ] Tests follow Triple-A pattern (Arrange, Act, Assert)
- [ ] Test descriptions follow: `[Method] [action] [expected result]`
- [ ] No network calls in unit tests — all mocks
- [ ] Each test creates its own data (no shared state)
- [ ] Mock verification: called with expected arguments
- [ ] Integration tests for all new endpoints
- [ ] Migration scripts tested (up + down)

## Database

- [ ] Database queries use indexes — verified with `explain()`
- [ ] All queries use `.lean()` for read operations
- [ ] All queries use projections to limit fields
- [ ] All queries filter `isDeleted: false` (soft delete)
- [ ] Write operations use `findOneAndUpdate` with version checking
- [ ] No unbounded queries — always limit or paginate
- [ ] No aggregation without `$match` as first stage
- [ ] Migration scripts are reversible (up + down)

## Performance

- [ ] No N+1 query patterns
- [ ] Pagination implemented for list endpoints
- [ ] No blocking operations in request handlers
- [ ] Response compression appropriate
- [ ] Mobile: FlatList optimized (getItemLayout, windowSize, etc.)
- [ ] Mobile: React.memo on list items
- [ ] Mobile: Bundle imports tree-shaken — no unused imports

## Mobile-Specific

- [ ] Server state in React Query (not Zustand)
- [ ] Client state in Zustand (auth, theme only)
- [ ] Components use NativeWind classes (not StyleSheet.create)
- [ ] Expo Router file-based navigation conventions followed
- [ ] All states handled: loading, empty, error, success
- [ ] Offline support considered
- [ ] Feature works across all 3 apps where applicable
- [ ] Accessibility: labels, roles, focus order

## Documentation

- [ ] OpenAPI spec updated for new/modified endpoints
- [ ] CHANGELOG.md updated (if applicable)
- [ ] Environment variables documented in `.env.example`
- [ ] JSDoc on exported functions explaining what/why (not how)
- [ ] ADR created for architectural decisions
- [ ] Migration scripts documented

## PR Quality

- [ ] PR title follows Conventional Commits format
- [ ] PR description includes: what, why, how, testing evidence
- [ ] Branch is up to date with target branch
- [ ] CI pipeline passes
- [ ] PR size < 500 lines changed
- [ ] Labels applied (feature/fix/refactor, sprint, priority)
- [ ] Ticket linked in PR description

## Reviewer Checklist

- [ ] I have reviewed the code, not just the description
- [ ] I have run the code locally (if significant change)
- [ ] I have checked for edge cases the author might have missed
- [ ] I have verified test coverage is adequate
- [ ] My feedback is specific, actionable, and constructive
- [ ] I have responded within 24 hours
