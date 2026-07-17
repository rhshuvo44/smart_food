---
title: "Milestone 1 Handoff: Foundation"
type: handoff
from_agent: architect
to_agents: [backend, database, api, devops, code-style, ui-ux]
status: ready
date: 2026-07-13
---

# Milestone 1: Foundation — Implementation Handoff

## Overview

Build the SmartFood project scaffolding, shared kernel, backend core, mobile app shells, Docker infrastructure, and CI/CD pipeline. This milestone establishes the foundation for all subsequent feature development.

**Duration target**: 3 weeks
**Priority**: P0 (blocking — nothing can start until this is done)

---

## 1. PRECONDITIONS

- ✅ 5 foundational ADRs accepted (ADR-001 through ADR-005)
- ✅ .opencode environment cleaned (redundant files removed, priorities fixed, opencode.jsonc created)
- ❌ **No code exists yet** — this is the first implementation milestone

---

## 2. SCOPE

### 2.1 Root Configuration (Lead: code-style)

| File | Purpose |
|------|---------|
| `tsconfig.base.json` | Shared TypeScript config (strict mode, ES2022, NodeNext) |
| `.eslintrc.js` | ESLint config — `@typescript-eslint/strict` + Prettier |
| `.prettierrc` | Prettier config (matching ESLint) |
| `jest.config.ts` | Root Jest config (projects mode for each package) |
| `.gitignore` | Root gitignore (node_modules, dist, .env, *.log) |
| `.editorconfig` | Editor-agnostic formatting |

### 2.2 Shared Kernel (Lead: architect, Supporting: api, database)

```
shared/
├── types/
│   ├── index.ts                   # Re-exports
│   ├── order.types.ts             # IOrder, IOrderItem, OrderStatus enum
│   ├── restaurant.types.ts        # IRestaurant, IMenuItem, IBusinessHours
│   ├── user.types.ts              # IUser, IUserRole, IUserAddress
│   ├── payment.types.ts           # IPayment, IPaymentStatus
│   ├── delivery.types.ts          # IDeliveryZone, IDeliveryTracking
│   └── common.types.ts            # IAddress, IGeoPoint, IPagination, IApiResponse<T>
├── constants/
│   ├── index.ts
│   ├── order-status.ts            # OrderStatus enum with state machine transitions
│   ├── payment-status.ts          # PaymentStatus enum
│   └── user-roles.ts              # UserRole enum (hierarchical)
├── validators/
│   ├── index.ts
│   ├── common.validators.ts       # Address schema, pagination schema, ID schema
│   └── auth.validators.ts         # Login, register, refresh schemas
├── events/
│   ├── index.ts                   # Re-exports all event types
│   ├── order.events.ts            # IOrderCreatedEvent, IOrderCancelledEvent, IOrderCompletedEvent
│   ├── payment.events.ts          # IPaymentCompletedEvent, IPaymentFailedEvent
│   ├── restaurant.events.ts       # IMenuUpdatedEvent, IRestaurantStatusEvent
│   ├── delivery.events.ts         # IDeliveryAssignedEvent, IDeliveryCompletedEvent
│   └── base-event.ts              # IDomainEvent<T> base interface
├── utils/
│   ├── index.ts
│   ├── money.ts                   # centsToDollars(), dollarsToCents(), formatMoney()
│   ├── id.ts                      # generateId() — UUIDv4, validateObjectId()
│   └── time.ts                    # formatDate(), isInBusinessHours(), date-fns wrappers
├── package.json
└── tsconfig.json                  # Extends ../tsconfig.base.json
```

**Type constraints**:
- All monetary values: `number` (cents, integer)
- All IDs: `string` (UUIDv4 for event IDs, ObjectId string for DB refs)
- All enums: `const enum` with reverse mapping
- Event bus types: discriminated union discriminated by `type` field
- `IApiResponse<T>` must match the standard envelope (`success`, `data`, `error`, `meta`, `correlationId`)

### 2.3 Backend Scaffold (Lead: backend, Supporting: database)

```
backend/
├── src/
│   ├── config/
│   │   ├── env.ts                 # Zod-validated environment variables
│   │   ├── database.ts            # MongoDB connection with Mongoose
│   │   ├── cors.ts                # CORS whitelist config
│   │   └── app.ts                 # Express app factory with middleware stack
│   ├── shared/
│   │   ├── event-bus.ts           # In-process typed event bus (see ADR-004)
│   │   ├── logger.ts              # Structured logger (Pino) with correlation ID
│   │   ├── errors.ts              # AppError, ValidationError, AuthError, NotFoundError, ConflictError
│   │   ├── async-handler.ts       # Async route wrapper (catch async errors)
│   │   └── idempotency.ts         # Idempotency key middleware + store
│   ├── middleware/
│   │   ├── auth.middleware.ts      # JWT verification (stub — full impl in M2)
│   │   ├── error.middleware.ts     # Global error handler with envelope format
│   │   ├── validation.middleware.ts# Zod validation middleware factory
│   │   ├── rate-limit.middleware.ts# Rate limiter (stub — full impl in M2)
│   │   ├── logging.middleware.ts   # Request/response logging with correlation ID
│   │   └── correlation.middleware.ts# Correlation ID generation/propagation
│   ├── domains/
│   │   └── health/
│   │       ├── health.controller.ts  # GET /api/v1/health — liveness
│   │       └── health.routes.ts      # Unauthenticated health check
│   ├── sockets/
│   │   └── socket.server.ts         # Socket.IO server setup (stub — full impl in M3)
│   └── server.ts                    # Entry point — create app, connect DB, start listening
├── tests/
│   ├── setup.ts                     # Jest setup (mongodb-memory-server, global mocks)
│   ├── unit/
│   │   └── shared/
│   │       ├── errors.test.ts
│   │       ├── event-bus.test.ts
│   │       └── logger.test.ts
│   └── integration/
│       └── health.test.ts           # GET /api/v1/health returns 200
├── docker/
│   ├── Dockerfile                   # Multi-stage: build with devDeps, run with prod only
│   └── .dockerignore
├── migrations/
│   └── .gitkeep                     # First migration in M2
├── seeds/
│   └── .gitkeep                     # First seed in M2
├── package.json
└── tsconfig.json                    # Extends ../tsconfig.base.json
```

### 2.4 Mobile App Shells (Lead: ui-ux, Supporting: customer-app, restaurant-app, admin-app)

Each app (`apps/customer/`, `apps/restaurant/`, `apps/admin/`):

```
apps/{app}/
├── app/
│   ├── _layout.tsx              # Root layout (providers, error boundary)
│   ├── (auth)/
│   │   ├── _layout.tsx          # Auth flow layout (stack navigator)
│   │   ├── login.tsx            # Login screen (placeholder)
│   │   └── register.tsx         # Register screen (placeholder)
│   ├── (tabs)/
│   │   ├── _layout.tsx          # Tab navigator layout
│   │   ├── index.tsx            # Home screen (placeholder)
│   │   ├── orders.tsx           # Orders screen (placeholder)
│   │   └── profile.tsx          # Profile screen (placeholder)
│   └── [...unmatched].tsx       # 404 handler
├── components/
│   └── common/
│       ├── button.tsx           # Primary/secondary/ghost Button
│       ├── input.tsx            # Form Input with label + error
│       ├── card.tsx             # Standard Card container
│       ├── loading.tsx          # Loading spinner
│       ├── error-state.tsx      # Error state with retry
│       └── empty-state.tsx      # Empty state with illustration
├── hooks/
│   └── use-auth.ts              # Auth state hook (stub)
├── services/
│   ├── api.ts                   # Axios instance with interceptors
│   └── api.test.ts              # API client unit tests
├── stores/
│   ├── auth.store.ts            # Zustand auth store
│   └── theme.store.ts           # Zustand theme store (light/dark)
├── types/
│   └── index.ts                 # Re-exports from @smartfood/shared
├── utils/
│   ├── storage.ts               # expo-secure-store wrapper
│   └── validation.ts            # Client-side validation helpers
├── constants/
│   └── index.ts                 # Colors, spacing, typography tokens
├── assets/                      # Images, fonts
├── app.json                     # Expo config
├── babel.config.js              # Including NativeWind plugin
├── tailwind.config.js           # NativeWind design tokens
├── package.json
└── tsconfig.json
```

**Design tokens** (consistent across all 3 apps):
```typescript
export const colors = {
  primary: '#FF6B35',       // SmartFood orange
  secondary: '#004E89',     // Deep blue
  background: '#FFFFFF',
  surface: '#F8F9FA',
  text: '#1A1A2E',
  textSecondary: '#6C757D',
  error: '#DC3545',
  success: '#28A745',
  warning: '#FFC107',
  border: '#DEE2E6',
};

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 };
export const borderRadius = { sm: 4, md: 8, lg: 16, full: 9999 };
export const typography = { /* font sizes, weights, families */ };
```

### 2.5 Infrastructure (Lead: devops)

```
infrastructure/
├── docker-compose.yml          # MongoDB 7 + backend (dev)
├── docker-compose.prod.yml     # Production composition (adds nginx)
├── nginx/
│   └── nginx.conf              # Reverse proxy, SSL termination
└── monitoring/
    ├── prometheus.yml          # Metrics collection config
    └── grafana-dashboards/     # Pre-built dashboards (empty, configured in M6)
```

### 2.6 CI/CD (Lead: devops)

```
.github/
└── workflows/
    ├── ci.yml                  # Lint → Typecheck → Test → Build (all packages)
    ├── cd.yml                  # Build Docker image → Push to registry → Deploy staging
    └── security-scan.yml       # npm audit, SAST, secret detection
```

---

## 3. IMPLEMENTATION ORDER

| Step | Package | Lead | Depends On |
|------|---------|------|------------|
| 1 | Root configs | code-style | Nothing |
| 2 | Shared kernel types + constants | architect | Step 1 |
| 3 | Shared kernel validators | api | Step 2 |
| 4 | Shared kernel events | architect | Step 2 |
| 5 | Shared kernel utils | architect | Step 3 |
| 6 | Backend env config + DB connection | backend | Step 1 |
| 7 | Backend shared utilities (logger, errors, event-bus) | backend | Step 4, 5 |
| 8 | Backend middleware stack | backend | Step 6, 7 |
| 9 | Backend server.ts + health endpoint | backend | Step 8 |
| 10 | Backend tests (unit + integration) | backend | Step 9 |
| 11 | Mobile app shells (3 apps in parallel) | ui-ux + 3 app agents | Step 2, 5 |
| 12 | Docker compose + Dockerfile | devops | Step 9 |
| 13 | CI/CD workflows | devops | Step 12 |
| 14 | Monitoring stubs | devops | Step 12 |

---

## 4. KEY DECISIONS

1. **Pino** for structured logging (already in RULES.md — fast, JSON-native, low overhead)
2. **Axios** for HTTP client in mobile apps (not fetch — interceptors for auth, retry, logging built-in)
3. **uuid** package for event IDs (v4) — already standard
4. **date-fns** for date/time manipulation (not moment — matches RULES.md prohibition)
5. **Expo SDK 52** for all mobile apps (latest stable at time of writing)
6. **NativeWind v4** for styling (Tailwind CSS for React Native)
7. **@tanstack/react-query v5** for server state management
8. **Zustand v4** for client state management
9. **mongodb-memory-server** for integration tests (avoids external DB dependency in CI)

---

## 5. ACCEPTANCE CRITERIA

- [ ] `npm install` at root installs all packages
- [ ] `npm run lint` — zero errors, zero warnings
- [ ] `npm run typecheck` — zero errors
- [ ] `npm run test` — all tests pass
- [ ] `docker compose up` starts MongoDB + backend, health check returns 200
- [ ] 3 mobile apps build with Expo (`npx expo export` succeeds)
- [ ] CI pipeline passes on PR (lint → typecheck → test → build)
- [ ] Shared kernel exports are importable by both backend and mobile apps
- [ ] Standard response envelope works end-to-end (health endpoint returns `{ success: true, data: {...}, correlationId: "..." }`)
- [ ] Error middleware returns proper envelope format for 400, 404, 500 errors

---

## 6. HANDOFF TARGETS

| Agent | Work Package | Priority |
|-------|-------------|----------|
| **code-style** | Root configs (tsconfig, eslint, prettier, jest) | P0 |
| **api** | Shared validators (Zod schemas) | P0 |
| **database** | Database connection module, Mongoose setup | P0 |
| **backend** | Backend scaffold (config, middleware, server, event-bus, logger, errors) | P0 |
| **ui-ux** | Mobile design tokens, common components, app shells | P0 |
| **customer-app** | Customer app shell (Expo, routes, api client, stores) | P0 |
| **restaurant-app** | Restaurant app shell (mirrors customer structure) | P0 |
| **admin-app** | Admin app shell (mirrors customer structure) | P0 |
| **devops** | Docker compose, Dockerfile, CI/CD workflows | P0 |

---

## 7. RISKS & MITIGATIONS

| Risk | Impact | Mitigation |
|------|--------|------------|
| Expo SDK 52 compatibility issues | Mobile app shell fails | Pin exact versions, run `expo doctor` during setup |
| npm workspace hoisting conflicts | Dependency resolution fails | Test with clean install, add `nohoist` if needed |
| mongodb-memory-server download failures | Integration tests fail in CI | Cache the binary in CI pipeline |
| New dependency security issues | CI security scan fails | Vet all new packages before inclusion |
| TypeScript path aliases not working across workspaces | Shared kernel imports fail | Verify `paths` in tsconfig, test with real imports |

---

## 8. REFERENCES

- [PROJECT.md](../../.opencode/PROJECT.md) — Full architecture documentation
- [RULES.md](../../.opencode/RULES.md) — All engineering standards
- [ADR-001](./ADR-001-modular-monolith.md) — Modular monolith architecture
- [ADR-002](./ADR-002-mongodb-mongoose.md) — MongoDB + Mongoose ODM
- [ADR-003](./ADR-003-jwt-authentication.md) — JWT authentication strategy
- [ADR-004](./ADR-004-event-bus.md) — In-process event bus
- [ADR-005](./ADR-005-monorepo-structure.md) — Monorepo structure
- [Architecture Guide](./architecture-guide.md) — System overview and data flow
