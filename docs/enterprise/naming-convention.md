# Naming Convention

## Code Naming

| Category | Convention | Example |
|----------|-----------|---------|
| Files | `kebab-case` | `order.service.ts` |
| Directories | `kebab-case` | `src/services/` |
| Classes | `PascalCase` | `OrderService` |
| Functions | `camelCase` | `createOrder()` |
| Methods | `camelCase` | `orderService.createOrder()` |
| Variables | `camelCase` | `const activeOrders = []` |
| Constants | `UPPER_SNAKE_CASE` | `MAX_RETRY_COUNT` |
| Types | `PascalCase` | `OrderStatus` |
| Interfaces | `IPascalCase` | `IOrderService` |
| Enums | `PascalCase` | `OrderStatus` |
| Enum Values | `UPPER_SNAKE_CASE` | `OrderStatus.PENDING` |
| Generics | Single uppercase letter or PascalCase | `T`, `TData`, `TResponse` |
| Boolean variables | `is`/`has`/`should` prefix | `isDeleted`, `hasPermission`, `shouldRetry` |
| Private methods | `_` prefix | `_validateStatusTransition()` |

## File Naming

| File Type | Convention | Example |
|-----------|-----------|---------|
| Backend Controllers | `*.controller.ts` | `order.controller.ts` |
| Backend Services | `*.service.ts` | `order.service.ts` |
| Backend Routes | `*.routes.ts` | `order.routes.ts` |
| Backend Models | `*.model.ts` | `order.model.ts` |
| Backend Repositories | `*.repository.ts` | `order.repository.ts` |
| Backend Validators | `*.validator.ts` | `order.validator.ts` |
| Backend Middleware | `*.middleware.ts` | `auth.middleware.ts` |
| Backend Types | `*.types.ts` | `order.types.ts` |
| Backend Events | `*.events.ts` | `order.events.ts` |
| Backend Tests | `*.test.ts` | `order.service.test.ts` |
| Backend Fixtures | `*.fixture.ts` | `orders.fixture.ts` |
| React Components | `PascalCase.tsx` | `OrderCard.tsx` |
| React Pages (expo-router) | `kebab-case.tsx` | `order-detail.tsx` |
| React Layouts | `_layout.tsx` | `_layout.tsx` |
| Expo Router Dynamic | `[param].tsx` | `[id].tsx` |
| Expo Router Catch-all | `[...param].tsx` | `[...unmatched].tsx` |

## Database Naming

| Category | Convention | Example |
|----------|-----------|---------|
| Collections | `plural_lowercase` | `orders`, `restaurants`, `menu_items` |
| Fields | `camelCase` | `restaurantId`, `createdAt`, `isDeleted` |
| Indexes | `idx_field1_field2` | `idx_restaurant_status_created` |
| References | `camelCase` + `Id` suffix | `customerId`, `restaurantId` |
| Boolean Fields | `is`/`has` prefix | `isDeleted`, `hasDelivery`, `isActive` |
| Enum Fields | `PascalCase` | `status: OrderStatus` |
| Time Fields | `At` suffix | `createdAt`, `updatedAt`, `deletedAt` |
| Money Fields | `Amount` suffix (in cents) | `totalAmount`, `taxAmount` |

### Mongo-Specific Patterns

```javascript
// Collection naming
db.orders.createIndex(...)           // plural, lowercase
db.restaurant_ratings.createIndex(...) // compound names with underscore

// Field naming in documents
{
  _id: ObjectId,
  restaurantId: ObjectId,            // reference
  orderNumber: "ORD-20260713-0001",  // human-readable
  subtotal: 2999,                    // cents (integer)
  isDeleted: false,                  // boolean prefix
  createdAt: ISODate,               // timestamp suffix
  version: 1                         // optimistic locking
}

// Index naming
orderSchema.index(
  { restaurantId: 1, status: 1, createdAt: -1 },
  { name: 'idx_restaurant_status_created' }
);
```

## Git Naming

| Category | Convention | Example |
|----------|-----------|---------|
| Branches | `type/scope/description` | `feat/orders/bulk-cancel` |
| Tags | `v{major}.{minor}.{patch}` | `v2.1.0` |
| Commits | Conventional Commits | `feat(orders): add bulk cancellation` |
| PR Titles | Conventional Commits | `feat(orders): add bulk cancellation endpoint` |

### Branch Types

| Type | Purpose | Example |
|------|---------|---------|
| `feat/` | New features | `feat/orders/scheduled-ordering` |
| `fix/` | Bug fixes | `fix/payment/webhook-timeout` |
| `refactor/` | Code restructuring | `refactor/auth/extract-service` |
| `test/` | Test additions/changes | `test/orders/add-integration-tests` |
| `docs/` | Documentation | `docs/api/update-openapi-spec` |
| `chore/` | Build/tooling | `chore/deps/upgrade-mongoose` |
| `perf/` | Performance | `perf/queries/add-indexes` |
| `release/` | Release branches | `release/v2.1.0` |
| `hotfix/` | Production fixes | `hotfix/auth/token-expiry` |

## Infrastructure Naming

| Category | Convention | Example |
|----------|-----------|---------|
| Docker Images | `smartfood/{service}` | `smartfood/backend` |
| Docker Tags | `{version}-{env}` | `2.1.0-production` |
| Environment Variables | `UPPER_SNAKE_CASE` | `MONGODB_URI`, `JWT_SECRET` |
| GitHub Workflows | `kebab-case.yml` | `ci.yml`, `security-scan.yml` |
| Kubernetes Resources | `kebab-case` | `backend-deployment`, `mongo-service` |
| DNS Records | `{subdomain}.smartfood.com` | `api.smartfood.com` |
