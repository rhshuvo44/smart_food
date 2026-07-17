# Testing Strategy

## Testing Pyramid

```
        ╱╲
       ╱  ╲         E2E Tests (10%)
      ╱    ╲        Critical user journeys
     ╱──────╲
    ╱        ╲      Integration Tests (20%)
   ╱          ╲    API endpoints, database, middleware
  ╱────────────╲
 ╱              ╲  Unit Tests (70%)
╱                ╲ Service logic, utilities, models
```

## Coverage Requirements

### Unit Tests

| Metric | Minimum Target |
|--------|---------------|
| Line coverage | 85% |
| Branch coverage | 75% |
| Function coverage | 90% |
| Statement coverage | 85% |

### Integration Tests

| Metric | Target |
|--------|--------|
| P0 endpoints | 100% coverage |
| P1 endpoints | 100% coverage |
| Error scenarios | 90% coverage |
| Happy path | 100% coverage |

### E2E Tests

| Metric | Target |
|--------|--------|
| P0 user journeys | 100% automated |
| Critical paths | Order placement, payment, delivery tracking |

## Test Types

### Unit Tests

**Scope**: Single function, class, or module in isolation.

**Characteristics**:
- All external dependencies mocked
- No network calls
- No database (use factories for data)
- Fast execution (milliseconds)
- Test one behavior per test

```typescript
import { OrderService } from '@/domains/orders/order.service';
import { buildCreateOrderDTO } from '@tests/fixtures/orders.fixture';

describe('OrderService.createOrder', () => {
  it('creates an order with valid data', async () => {
    const dto = buildCreateOrderDTO();
    const order = await orderService.createOrder(dto, customerId, correlationId);
    expect(order).toBeDefined();
    expect(order.status).toBe('PENDING');
    expect(order.total).toBe(dto.subtotal + dto.tax + dto.deliveryFee);
  });

  it('rejects order with empty items array', async () => {
    const dto = buildCreateOrderDTO({ items: [] });
    await expect(orderService.createOrder(dto, customerId, correlationId))
      .rejects.toThrow(ValidationError);
  });

  it('rejects order for unauthenticated user', async () => {
    const dto = buildCreateOrderDTO();
    await expect(orderService.createOrder(dto, undefined, correlationId))
      .rejects.toThrow(AuthError);
  });

  it('handles order with maximum items (50)', async () => {
    const dto = buildCreateOrderDTO({ items: Array(50).fill(buildOrderItem()) });
    const order = await orderService.createOrder(dto, customerId, correlationId);
    expect(order.items).toHaveLength(50);
  });

  it('rejects order with more than 50 items', async () => {
    const dto = buildCreateOrderDTO({ items: Array(51).fill(buildOrderItem()) });
    await expect(orderService.createOrder(dto, customerId, correlationId))
      .rejects.toThrow(ValidationError);
  });

  it('returns same order for duplicate idempotent requests', async () => {
    const dto = buildCreateOrderDTO();
    const first = await orderService.createOrder(dto, customerId, correlationId, 'key-1');
    const second = await orderService.createOrder(dto, customerId, correlationId, 'key-1');
    expect(second._id).toEqual(first._id);
  });
});
```

### Integration Tests

**Scope**: API endpoint + database interaction.

**Characteristics**:
- In-memory MongoDB (`mongodb-memory-server`)
- Supertest for HTTP requests
- Tests the full request lifecycle
- Slower than unit tests (seconds)

```typescript
import request from 'supertest';
import app from '@/app';
import { setupTestDB, teardownTestDB } from '@tests/setup';

describe('POST /api/v1/orders', () => {
  beforeAll(async () => {
    await setupTestDB();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  it('returns 201 for valid order creation', async () => {
    const token = await generateTestToken();
    const orderData = buildCreateOrderDTO();

    const res = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${token}`)
      .send(orderData);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('PENDING');
  });

  it('returns 422 for invalid input', async () => {
    const token = await generateTestToken();

    const res = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 401 without auth token', async () => {
    const res = await request(app)
      .post('/api/v1/orders')
      .send(buildCreateOrderDTO());

    expect(res.status).toBe(401);
  });
});
```

### E2E Tests

**Scope**: Full user journey across all system components.

**Characteristics**:
- Runs against staging environment
- Tests real integrations (database, payment gateway, notifications)
- Covers critical P0 journeys
- Slowest test type (minutes)

**Critical Journeys:**
1. Customer browses restaurants → places order → pays → receives confirmation
2. Restaurant receives order → accepts → prepares → marks ready → delivers
3. Customer tracks delivery → receives order → rates restaurant
4. Admin creates restaurant → sets menu → manages orders → views analytics

## Test Structure

### File Organization

Tests mirror the source structure:

```
backend/
├── src/
│   └── domains/
│       └── orders/
│           ├── order.service.ts
│           └── order.controller.ts
└── tests/
    ├── unit/
    │   └── domains/
    │       └── orders/
    │           ├── order.service.test.ts
    │           └── order.controller.test.ts
    ├── integration/
    │   └── routes/
    │       └── orders.test.ts
    ├── e2e/
    │   └── place-order.test.ts
    └── fixtures/
        └── orders.fixture.ts
```

### Test Naming

```
src/services/order.service.ts
  → tests/unit/services/order.service.test.ts
  → tests/integration/routes/orders.test.ts
  → tests/fixtures/orders.fixture.ts
```

## Test Data Factories

Use `@faker-js/faker` for realistic test data:

```typescript
import { faker } from '@faker-js/faker';
import { Types } from 'mongoose';
import type { ICreateOrderDTO } from '@/domains/orders/order.types';

export const buildCreateOrderDTO = (overrides: Partial<ICreateOrderDTO> = {}): ICreateOrderDTO => ({
  restaurantId: new Types.ObjectId().toString(),
  items: [
    {
      menuItemId: new Types.ObjectId().toString(),
      name: faker.commerce.productName(),
      quantity: faker.number.int({ min: 1, max: 5 }),
      unitPrice: faker.number.int({ min: 500, max: 5000 }),
    },
  ],
  deliveryAddress: {
    street: faker.location.streetAddress(),
    city: faker.location.city(),
    zipCode: faker.location.zipCode(),
    coordinates: [faker.location.longitude(), faker.location.latitude()],
  },
  ...overrides,
});
```

## Test Command Reference

```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:integration

# Run e2e tests only
npm run test:e2e

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch

# Run specific test file
npm test -- --testPathPattern="order.service"

# Run tests matching a name
npm test -- --testNamePattern="creates an order"
```

## Testing Rules

1. **No shared state**: Each test creates its own data. Tests are independent.
2. **No network calls**: All external services mocked in unit tests.
3. **Triple-A Pattern**: Arrange (set up data), Act (execute), Assert (verify).
4. **Meaningful descriptions**: `it('creates an order with valid data')` not `it('works')`.
5. **Mock verification**: Every mock must assert expected arguments.
6. **No test interdependence**: Tests run in any order, parallel by default.
7. **Factory over fixtures**: Use faker.js for data generation, not static JSON files.
8. **Cleanup**: Tests clean up after themselves (truncate collections, reset mocks).
