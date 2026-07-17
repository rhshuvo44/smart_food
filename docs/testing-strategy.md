# Testing Strategy

## Test Pyramid

```
     ╱╲
    ╱ E2E ╲         10% — Critical user journeys
   ╱────────╲
  ╱Integration╲     20% — API endpoints, DB operations
 ╱──────────────╲
╱   Unit Tests    ╲  70% — Services, utilities, models
╱──────────────────╲
```

## Coverage Requirements

| Level | Metric | Target |
|-------|--------|--------|
| Unit | Line coverage | >= 85% |
| Unit | Branch coverage | >= 75% |
| Unit | Function coverage | >= 90% |
| Integration | P0 endpoints | 100% |
| Integration | Error scenarios | >= 90% |
| E2E | P0 user journeys | 100% |

## Unit Tests (70%)

**Scope:** Single function/class in isolation.
**Location:** `backend/tests/unit/` (mirrors `backend/src/`)

### What to Test

- Service methods (happy path, errors, edge cases)
- Validation schemas (valid input, invalid input, boundary values)
- Model hooks and middleware
- Utility functions
- State machine transitions

### What NOT to Test

- Database connectivity (integration test)
- HTTP request/response (integration test)
- Third-party library behavior (mock it)

### Standards

```typescript
describe('OrderService.createOrder', () => {
  // 1. Happy path
  it('creates an order with valid data', async () => { ... });

  // 2. Validation errors
  it('rejects order with empty items array', async () => { ... });

  // 3. Business logic errors
  it('rejects order for closed restaurant', async () => { ... });

  // 4. Auth errors
  it('rejects order without authentication', async () => { ... });

  // 5. Edge cases
  it('handles order with maximum items (50)', async () => { ... });

  // 6. Idempotency
  it('returns same result for duplicate idempotent requests', async () => { ... });

  // 7. Concurrency
  it('throws conflict on stale version update', async () => { ... });
});
```

## Integration Tests (20%)

**Scope:** API endpoint + database + middleware.
**Location:** `backend/tests/integration/`
**Setup:** In-memory MongoDB (`mongodb-memory-server`) + supertest.

### What to Test

- Full request lifecycle (middleware → route → controller → service → DB)
- HTTP status codes and response envelopes
- Database read/write operations
- Middleware chains (auth, validation, rate limiting)

### Standards

```typescript
describe('POST /api/v1/orders', () => {
  it('returns 201 with created order', async () => { ... });
  it('returns 422 with field-level validation errors', async () => { ... });
  it('returns 401 without auth token', async () => { ... });
  it('returns 409 on version conflict', async () => { ... });
  it('returns 201 for duplicate idempotent request', async () => { ... });
});
```

## E2E Tests (10%)

**Scope:** Full user journey across backend + mobile.
**Setup:** Staging environment.
**Tools:** Detox (mobile), Playwright (admin web).

### Critical Journeys (P0)

- Customer places order → receives confirmation
- Restaurant receives order → accepts → prepares → marks ready
- Delivery driver assigned → picks up → delivers
- Customer pays via credit card → receives receipt
- Admin manages restaurants → approves new restaurant

## Test Data

### Factories (faker.js)

```typescript
import { faker } from '@faker-js/faker';

export const buildCreateOrderDTO = (overrides = {}) => ({
  restaurantId: new Types.ObjectId().toString(),
  items: [{ menuItemId: new Types.ObjectId().toString(), quantity: 2 }],
  deliveryAddress: {
    street: faker.location.streetAddress(),
    city: faker.location.city(),
    zipCode: faker.location.zipCode(),
  },
  ...overrides,
});
```

- Use factories, not static fixtures
- Call `faker.seed()` for deterministic tests
- Each test creates its own data (no shared state)

## CI Testing

Every PR triggers:

```yaml
# CI pipeline steps
1. lint          # ESLint strict — zero warnings
2. typecheck     # TypeScript strict — zero errors
3. unit-tests    # Jest — 85%+ coverage
4. integration   # Jest — in-memory MongoDB
5. build         # All apps compile
```

## Testing Standards

- **Triple-A Pattern:** Arrange, Act, Assert
- **Test Descriptions:** `[Method] [action] [expected result]`
- **No shared state:** Each test creates its own data
- **No network calls:** All external services mocked
- **Mock verification:** Assert mocks called with expected args
- **Test file location:** Mirrors source structure

## Tools

| Tool | Purpose |
|------|---------|
| Jest | Test runner |
| `mongodb-memory-server` | In-memory MongoDB for integration tests |
| supertest | HTTP assertion for integration tests |
| faker.js | Test data generation |
| Sinon / Jest mocks | Mocking external dependencies |
| Detox | Mobile E2E tests |
| Supertest | API integration tests |
