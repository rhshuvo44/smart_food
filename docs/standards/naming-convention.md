# Naming Convention

## Code Naming

| Category | Convention | Example |
|----------|-----------|---------|
| Files (TypeScript) | `kebab-case` | `order.service.ts` |
| Files (React) | `PascalCase` | `OrderCard.tsx` |
| Pages (expo-router) | `kebab-case` | `order-detail.tsx` |
| Layouts (expo-router) | `_layout.tsx` | `_layout.tsx` |
| Classes | `PascalCase` | `OrderService` |
| Functions | `camelCase` | `createOrder()` |
| Methods | `camelCase` | `orderService.createOrder()` |
| Variables | `camelCase` | `const activeOrders` |
| Constants | `UPPER_SNAKE_CASE` | `MAX_RETRY_COUNT` |
| Types | `PascalCase` | `OrderStatus` |
| Interfaces | `IPascalCase` | `IOrderService` |
| Enums | `PascalCase` | `OrderStatus` |
| Enum values | `UPPER_SNAKE_CASE` | `OrderStatus.PENDING` |
| Boolean variables | `is/has/should` prefix | `isDeleted`, `hasPermission` |
| Private methods | `_` prefix | `_validateStatusTransition()` |

## File Naming by Layer

| Layer | Pattern | Example |
|-------|---------|---------|
| Routes | `*.routes.ts` | `order.routes.ts` |
| Controllers | `*.controller.ts` | `order.controller.ts` |
| Services | `*.service.ts` | `order.service.ts` |
| Models | `*.model.ts` | `order.model.ts` |
| Validators | `*.validator.ts` | `order.validator.ts` |
| Middleware | `*.middleware.ts` | `auth.middleware.ts` |
| Types | `*.types.ts` | `order.types.ts` |
| Events | `*.events.ts` | `order.events.ts` |
| Tests | `*.test.ts` | `order.service.test.ts` |
| Factories | `*.factory.ts` | `order.factory.ts` |
| Fixtures | `*.fixture.ts` | `orders.fixture.ts` |
| Migrations | `YYYYMMDDHHMMSS_desc.ts` | `20260713000001_create_orders.ts` |

## Database Naming

| Category | Convention | Example |
|----------|-----------|---------|
| Collections | `plural_lowercase` | `orders`, `restaurants` |
| Fields | `camelCase` | `restaurantId`, `createdAt` |
| Indexes | `idx_{field1}_{field2}` | `idx_restaurant_status_created` |
| References | `{entity}Id` | `customerId`, `restaurantId` |
| Boolean fields | `is/has` prefix | `isDeleted`, `hasDelivery` |
| Timestamps | `createdAt`, `updatedAt` | Mongoose timestamps: true |
| Soft delete | `isDeleted`, `deletedAt` | Default pattern |

## Infrastructure Naming

| Category | Convention | Example |
|----------|-----------|---------|
| Git branches | `type/scope/description` | `feat/orders/bulk-cancel` |
| Git tags | `v{major}.{minor}.{patch}` | `v2.1.0` |
| Docker images | `smartfood/{service}` | `smartfood/backend` |
| Docker tags | `{version}-{env}` | `2.1.0-production` |
| Env variables | `UPPER_SNAKE_CASE` | `MONGODB_URI`, `JWT_SECRET` |
| GitHub workflows | `kebab-case` | `ci.yml`, `security-scan.yml` |
| npm scripts | `kebab-case` | `migrate:up`, `db:check` |

## Directory Naming

| Category | Convention | Example |
|----------|-----------|---------|
| Domain modules | `plural` | `orders/`, `restaurants/` |
| App directories | `kebab-case` | `delivery-zones/` |
| Shared directories | `kebab-case` | `shared/constants/` |
| Test directories | `kebab-case` | `tests/integration/` |

## Git Branch Naming

```
type/scope/description
```

| Type | Usage |
|------|-------|
| `feat` | New feature |
| `fix` | Bug fix |
| `refactor` | Code refactoring |
| `test` | Test additions/changes |
| `docs` | Documentation |
| `chore` | Build, CI, tooling |

**Examples:**
- `feat/orders/bulk-cancel`
- `fix/payment/webhook-timeout`
- `refactor/auth/extract-token-service`
- `chore/deps/upgrade-mongoose`

## Commit Message Naming

```
type(scope): description

body (optional, wrapped at 72 chars)
```

Follows [Conventional Commits 1.0.0](https://www.conventionalcommits.org/).

## API Naming

| Element | Convention | Example |
|---------|-----------|---------|
| URL paths | `plural kebab-case` | `/api/v1/delivery-zones` |
| URL params | `camelCase` | `/:restaurantId` |
| Query params | `snake_case` | `?order_status=pending` |
| JSON fields | `camelCase` | `{ "restaurantId": "abc" }` |
| Error codes | `UPPER_SNAKE_CASE` | `VALIDATION_ERROR` |
