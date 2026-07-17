# Coding Standards

## TypeScript Strict Mode

All code must compile with TypeScript strict mode enabled. These are non-negotiable:

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "exactOptionalPropertyTypes": true,
    "noUnusedLocals": "error",
    "noUnusedParameters": "error",
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "noPropertyAccessFromIndexSignature": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

## Code Organization

| Rule | Limit | Enforcement |
|------|-------|-------------|
| File size | 400 lines max | ESLint |
| Function size | 40 lines max | ESLint |
| Nesting depth | 4 levels max | ESLint |
| Cyclomatic complexity | 10 max per function | ESLint |
| Function parameters | 3 max | ESLint |
| Exports per file | 5 max (named only) | Code review |

## Core Patterns

### Use `unknown`, Never `any`

```typescript
// ✅ Correct
function process(input: unknown): string {
  if (typeof input === 'string') return input.trim();
  if (input instanceof Error) return input.message;
  throw new Error(`Unexpected type: ${typeof input}`);
}

// ❌ Wrong
function process(input: any): string { ... }
```

### Branded Types for IDs

```typescript
type Brand<K, T> = K & { __brand: T };
type OrderId = Brand<string, 'OrderId'>;
type CustomerId = Brand<string, 'CustomerId'>;
```

### Discriminated Unions for State

```typescript
type OrderState =
  | { status: 'pending' }
  | { status: 'confirmed'; confirmedAt: Date }
  | { status: 'cancelled'; reason: string; cancelledAt: Date };
```

### Exhaustive Switch

```typescript
function handleState(state: OrderState): string {
  switch (state.status) {
    case 'pending': return 'Pending';
    case 'confirmed': return 'Confirmed';
    case 'cancelled': return `Cancelled: ${state.reason}`;
    default: {
      const _exhaustive: never = state;
      throw new Error(`Unhandled state: ${_exhaustive}`);
    }
  }
}
```

## Error Handling

Use the custom error hierarchy:

```typescript
class AppError extends Error { /* statusCode, code, message, details */ }
class ValidationError extends AppError { /* 422 */ }
class AuthError extends AppError { /* 401 */ }
class ForbiddenError extends AppError { /* 403 */ }
class NotFoundError extends AppError { /* 404 */ }
class ConflictError extends AppError { /* 409 */ }
```

- Never swallow errors — every catch must log, rethrow, or return a response
- Global error handler catches all unhandled errors
- Correlation ID in every log entry and error response

## Import Order

```typescript
// 1. Node built-ins
import { readFile } from 'node:fs/promises';

// 2. Third-party
import express, { Router } from 'express';
import { z } from 'zod';

// 3. Internal absolute
import { authMiddleware } from '@/middleware/auth.middleware';

// 4. Relative (rare)
import { formatCurrency } from './utils';
```

## Naming

| Element | Convention | Example |
|---------|-----------|---------|
| Variables/function | camelCase | `createOrder()` |
| Classes | PascalCase | `OrderService` |
| Constants | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT` |
| Interfaces | IPascalCase | `IOrderService` |
| Types | PascalCase | `OrderStatus` |
| Enums | PascalCase | `OrderStatus` |
| Enum values | UPPER_SNAKE_CASE | `PENDING` |
| Booleans | is/has/should prefix | `isDeleted`, `hasPermission` |
| Private methods | _prefix | `_validateTransition` |
| Files | kebab-case | `order.service.ts` |

## Prohibited Patterns

- No `any` — use `unknown` with type guards
- No `@ts-ignore`, `@ts-expect-error`, `@ts-nocheck`
- No non-null assertions (`!`)
- No `var` — only `const` (preferred) and `let`
- No `console.log` in production — use structured logger
- No empty catch blocks
- No nested ternaries — extract to helper functions
- No `moment.js` — use `date-fns` or native `Intl`
- No deprecated APIs without migration plan
- No dead code — delete it

## Testing

- Tests mirror source structure
- Triple-A pattern: Arrange, Act, Assert
- Test descriptions: `[Method] [action] [expected result]`
- Minimum 85% line coverage, 75% branch coverage
- All external services mocked in unit tests
- In-memory MongoDB for integration tests
- No shared test state — each test creates its own data
