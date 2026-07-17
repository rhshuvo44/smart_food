# Architecture Guide

## System Overview

SmartFood follows a **modular monolith** architecture — a single deployable backend decomposed into strict domain boundaries. This provides the development benefits of microservices (domain isolation, team autonomy) without the operational complexity.

```
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│ Customer    │  │ Restaurant  │  │ Admin       │
│ App (RN)    │  │ App (RN)    │  │ App (RN)    │
└──────┬──────┘  └──────┬──────┘  └──────┬──────┘
       │                │                │
       └────────────────┼────────────────┘
                        │
              ┌─────────▼──────────┐
              │  API Gateway        │
              │  (Express.js)       │
              │  /api/v1/*          │
              └─────────┬──────────┘
                        │
       ┌────────────────┼────────────────┐
       │                │                │
┌──────▼──────┐ ┌──────▼──────┐ ┌──────▼──────┐
│ Orders      │ │ Restaurants │ │ Customers   │
│ Domain      │ │ Domain      │ │ Domain      │
├──────┬──────┤ ├──────┬──────┤ ├──────┬──────┤
│Orders│Order │ │Menu  │Hours │ │Profile│Addr │
│Svc   │Items │ │Svc   │      │ │Svc   │     │
└──────┴──────┘ └──────┴──────┘ └──────┴──────┘
       │                │                │
       └────────────────┼────────────────┘
                        │
              ┌─────────▼──────────┐
              │  MongoDB            │
              │  (per-domain cols)  │
              └────────────────────┘
```

## Architectural Principles

### 1. Modular Monolith

- Single deployable unit (Express.js)
- Decomposed by domain: Orders, Restaurants, Customers, Payments, Delivery, Notifications, Analytics
- Each domain is self-contained (routes, controllers, services, models, events, types)
- Cross-domain communication via typed event bus (in-process)
- Database collections owned by their domain

### 2. Layer Architecture

```
Request → Middleware → Route → Controller → Service → Repository → Model
```

- **No layer skipping** — Controllers never access models directly
- **No business logic in controllers** — Controllers handle HTTP concerns only
- **Services** contain all business logic (pure, testable)
- **Repositories** encapsulate database access

### 3. Domain Isolation Rules

- A service in `orders/` cannot import a model from `restaurants/`
- Cross-domain communication through:
  - Service interfaces via DI container
  - Typed events via the event bus
  - Shared types defined in `shared/`
- Events defined and emitted by the owning domain

### 4. API Design

- RESTful, URL-versioned (`/api/v1/orders`)
- Standard response envelope with `success`, `data`, `error`, `meta`, `correlationId`
- Idempotency keys for all mutation endpoints
- Cursor-based pagination for list endpoints
- Rate limiting per endpoint group

## Data Flow

### Request Lifecycle

```
1. Client → HTTP Request
2. Middleware chain: Helmet → CORS → Compression → JSON Parse → Rate Limit → Logging → Auth → Correlation ID
3. Route matching → Controller
4. Controller: Validate input (Zod) → Call service → Format response
5. Service: Business logic → Call repository → Emit events → Return DTO
6. Repository: MongoDB query (Mongoose) → Return lean document
7. Response → Standard envelope → JSON → Client
```

### Event Flow

```
Service A publishes event → Event Bus → Subscribers (Service B, C, ...)
                                         → Socket.IO broadcast
                                         → Persist to events collection
```

## Domain Boundaries

| Domain | Owns | Emits Events | Consumes Events |
|--------|------|-------------|-----------------|
| Orders | orders collection | order.created, order.cancelled, order.completed | payment.completed, delivery.assigned |
| Restaurants | restaurants, menus | menu.updated, restaurant.status | order.created (stock check) |
| Customers | customers, addresses | — | order.created (notification) |
| Payments | payments, transactions | payment.completed, payment.failed | order.cancelled (refund) |
| Delivery | delivery_zones, tracking | delivery.assigned, delivery.completed | order.created (assignment) |
| Notifications | — | — | All events (push/email) |
| Analytics | analytics_events | — | All events (logging) |

## Technology Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Monolith vs Microservices | Modular Monolith | Lower ops complexity, faster dev, extract only when proven bottleneck |
| Database | MongoDB | Flexible schema, geospatial queries, good Node.js ecosystem |
| ODM | Mongoose 8 | Schema validation, middleware, type-safe with TypeScript |
| Validation | Zod | Runtime type validation, excellent TypeScript integration |
| Mobile | Expo (React Native) | Cross-platform, OTA updates, managed workflow |
| Styling | NativeWind | Utility-first, fast iteration, consistent design tokens |
| State Management | TanStack Query + Zustand | Server state vs client state separation |
| Real-time | Socket.IO | Reliable WebSocket, rooms, auto-reconnect |
| Auth | JWT (RS256) | Stateless, secure, service-to-service compatible |

## Constraints

- **No Redis** — Use MongoDB for caching and job queuing unless profiling proves otherwise
- **No BullMQ** — Use MongoDB change streams for job scheduling
- **No GraphQL** — REST-only unless architect approves
- **No moment.js** — Use `date-fns` or `Intl` API
- **No microservices** — Start as monolith, extract only when profiling proves bottleneck
- **No raw MongoDB in services** — Always use repository pattern

## SLOs

| Metric | Target | Window |
|--------|--------|--------|
| API p50 | < 100ms | 5 min moving avg |
| API p95 | < 300ms | 5 min moving avg |
| API p99 | < 1000ms | 5 min moving avg |
| Uptime | 99.9% | 30 days |
| Error rate | < 0.1% | 5 min window |
| DB query p95 | < 100ms | 5 min window |
