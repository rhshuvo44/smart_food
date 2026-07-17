# Architecture Guide

## System Architecture

SmartFood follows a **modular monolith** architecture — a single deployable unit decomposed into domain modules with strict boundaries.

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Mobile Apps (React Native)               │
│  ┌──────────────────┐  ┌──────────────────┐  ┌────────────┐ │
│  │  Customer App    │  │ Restaurant App   │  │  Admin App │ │
│  └────────┬─────────┘  └────────┬─────────┘  └──────┬─────┘ │
│           │                     │                     │       │
└───────────┼─────────────────────┼─────────────────────┼───────┘
            │                     │                     │
            ▼                     ▼                     ▼
┌───────────────────────────────────────────────────────────────┐
│                     API Gateway (Express.js)                   │
│  Authentication → Rate Limiting → Routing → Compression       │
└───────────────────────────────────────────────────────────────┘
            │
            ▼
┌───────────────────────────────────────────────────────────────┐
│                    Domain Modules (Modular Monolith)           │
│  ┌────────┐ ┌──────────┐ ┌────────┐ ┌────────┐ ┌──────────┐  │
│  │ Orders │ │Restaurants│ │Payments│ │Delivery│ │Customers │  │
│  └────┬───┘ └────┬─────┘ └───┬────┘ └───┬────┘ └─────┬────┘  │
│       │          │           │          │            │        │
│  ┌────┴──────────┴───────────┴──────────┴────────────┴────┐  │
│  │                  Event Bus (In-Process)                 │  │
│  └──────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────┘
            │
            ▼
┌───────────────────────────────────────────────────────────────┐
│                       MongoDB (Primary Data Store)             │
│  orders │ restaurants │ customers │ payments │ delivery        │
│  notifications │ analytics │ (collections per domain)         │
└───────────────────────────────────────────────────────────────┘
```

## Architecture Principles

### 1. Modular Monolith

The backend is a modular monolith where each domain is a self-contained module:

```
domains/
├── orders/
│   ├── order.controller.ts    # HTTP request handling
│   ├── order.service.ts       # Business logic
│   ├── order.repository.ts    # Data access
│   ├── order.model.ts         # Mongoose schema
│   ├── order.routes.ts        # Route definitions
│   ├── order.validator.ts     # Zod validation schemas
│   ├── order.events.ts        # Domain events
│   └── order.types.ts         # TypeScript types
├── restaurants/
├── customers/
├── payments/
├── delivery/
├── notifications/
└── analytics/
```

**Rules:**
- Domains communicate only through service interfaces or event bus
- No direct database access across domain boundaries
- No importing controllers from another domain
- Shared kernel (`shared/`) is the only cross-cutting module

### 2. Layer Separation

Every request flows through a strict layer hierarchy:

```
Route → Middleware → Controller → Service → Repository → Model
```

- **Routes**: Define HTTP method, path, and middleware chain
- **Middleware**: Authentication, validation, rate limiting, logging
- **Controller**: Request parsing, response formatting (< 20 lines)
- **Service**: Business logic, orchestration (< 40 lines per function)
- **Repository**: Data access, query logic
- **Model**: Mongoose schema, validation, indexes

### 3. Event-Driven Communication

Cross-domain operations use typed events via an in-process event bus:

```typescript
// Event definition (order.events.ts)
export interface OrderCreatedEvent {
  type: 'order.created';
  payload: {
    orderId: string;
    customerId: string;
    restaurantId: string;
    total: number;
    items: OrderItemDTO[];
  };
}

// Publishing
eventBus.publish('order.created', {
  orderId: order._id,
  customerId: order.customerId,
  restaurantId: order.restaurantId,
  total: order.total,
  items: order.items,
});

// Subscribing (in notification domain)
eventBus.subscribe('order.created', async (event) => {
  await notificationService.sendOrderConfirmation(event.payload);
});
```

### 4. API Design

- **Versioning**: URL-prefixed (`/api/v1/`, `/api/v2/`)
- **Response Envelope**: Standardized JSON wrapper for all responses
- **Idempotency**: All mutation endpoints support `Idempotency-Key` header
- **Pagination**: Cursor-based pagination for all list endpoints
- **Error Handling**: Structured error responses with correlation IDs

### 5. Data Architecture

#### Collection per Domain

Each domain owns its MongoDB collection(s):

| Domain | Collections | Key Indexes |
|--------|-------------|-------------|
| Orders | `orders` | `restaurantId+status+createdAt`, `customerId+createdAt` |
| Restaurants | `restaurants`, `menu_items` | `cuisine+rating`, `location:2dsphere` |
| Customers | `customers` | `email`, `phone` |
| Payments | `payments` | `orderId`, `transactionId` |
| Delivery | `deliveries`, `delivery_zones` | `driverId+status`, `zone:2dsphere` |
| Notifications | `notifications` | `userId+type+createdAt`, `TTL:7d` |
| Analytics | `analytics_events` | `eventType+createdAt`, `userId+eventType` |

#### Document Design

```typescript
interface IBaseDocument {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;     // Soft delete pattern
  deletedAt?: Date;
  version: number;        // Optimistic locking
}
```

**Rules:**
- All monetary values stored in cents (integers)
- All timestamps in UTC
- Soft deletes with `isDeleted` flag
- Optimistic locking with `version` field
- Embedded sub-documents for bounded, co-accessed data

## Mobile Architecture

### Three-App Consistency

All three React Native apps share:
- Same `expo-router` file-based routing
- Same NativeWind styling with shared design tokens
- Same component library (customizable per app via props)
- Same API client with interceptors for auth and retry
- Same Zustand stores for auth and theme

### State Management

```
┌──────────────────────────────────────────────────┐
│                   React Native App                │
│                                                    │
│  ┌────────────────┐    ┌──────────────────────┐   │
│  │ TanStack Query  │    │    Zustand Stores    │   │
│  │ (Server State)  │    │    (Client State)    │   │
│  │                 │    │                      │   │
│  │ • Order data    │    │ • Auth tokens        │   │
│  │ • Menu items    │    │ • Theme preference   │   │
│  │ • Restaurant    │    │ • UI state           │   │
│  │ • User profile  │    │ • Offline queue      │   │
│  └────────────────┘    └──────────────────────┘   │
└──────────────────────────────────────────────────┘
```

**Rules:**
- All API data through TanStack React Query
- Only auth, theme, UI state in Zustand
- No API response data in Zustand stores
- Configure `staleTime`, `cacheTime`, `retry` for every query
- Components are pure — no data fetching in render

## Deployment Architecture

```
┌──────────────────┐
│   Load Balancer   │
└────────┬─────────┘
         │
┌────────┴──────────┐
│  API Instance 1    │
│  (Docker Replica)  │
└────────┬──────────┘
         │
┌────────┴──────────┐
│  API Instance 2    │
│  (Docker Replica)  │
└────────┬──────────┘
         │
┌────────┴──────────┐
│   MongoDB Replica  │
│   Set (3 nodes)    │
└───────────────────┘
```

**Key Properties:**
- Stateless instances — any instance handles any request
- Horizontal scaling via Docker replicas
- Graceful shutdown on SIGTERM (30s drain)
- Health probes: `/health` and `/ready`
- Rolling deployments for zero-downtime updates
- Database migrations run before new code deploys

## Security Architecture

### Defense in Depth

```
Layer 1: Network
  ├── TLS 1.3 for all traffic
  ├── CORS whitelist (no wildcard)
  └── Rate limiting at gateway

Layer 2: Authentication
  ├── JWT access tokens (15min, RS256)
  ├── Refresh tokens (7d, rotation)
  └── Service-to-service tokens

Layer 3: Authorization
  ├── Role-based access control
  ├── Endpoint-level permission checks
  └── Principle of least privilege

Layer 4: Validation
  ├── Zod schemas at API boundary
  ├── Mongoose schema validation
  └── Input sanitization

Layer 5: Data Protection
  ├── PII encryption at rest (AES-256-GCM)
  ├── bcrypt for passwords (cost 12)
  └── Secrets via environment variables
```
