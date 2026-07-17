# Folder Structure Guide

> **⚠️ Repository Split:** The platform has been split into 4 independent repositories. See [ADR-006](./architecture/ADR-006-repository-split.md) for details.

## Repository Layout

### `smartfood-backend` — Backend API

```
smartfood-backend/
├── backend/
│   ├── src/
│   │   ├── config/                # Environment & app configuration
│   │   │   ├── env.ts             #   Zod-validated environment
│   │   │   ├── database.ts        #   MongoDB connection
│   │   │   ├── cors.ts            #   CORS configuration
│   │   │   └── app.ts             #   Express app setup & middleware
│   │   ├── domains/               # Domain modules (bounded contexts)
│   │   │   ├── orders/            #   Order lifecycle, items, status
│   │   │   ├── restaurants/       #   Restaurant menus, hours, zones
│   │   │   ├── customers/         #   Customer profiles, addresses
│   │   │   ├── payments/          #   Payment processing, webhooks
│   │   │   ├── delivery/          #   Delivery zones, tracking
│   │   │   ├── notifications/     #   Push, email, SMS notifications
│   │   │   └── analytics/         #   Dashboards, metrics, reports
│   │   ├── middleware/            # Cross-cutting middleware
│   │   ├── shared/                # Backend shared utilities + types
│   │   │   ├── async-handler.ts   #   Express async error wrapper
│   │   │   ├── errors.ts          #   AppError, ValidationError, etc.
│   │   │   ├── event-bus.ts       #   In-process event bus
│   │   │   ├── geo.ts             #   Haversine distance, ETA
│   │   │   ├── idempotency.ts     #   Idempotency middleware
│   │   │   ├── mongoose.ts        #   Mongoose transform helper
│   │   │   ├── types/             #   Type definitions (from old shared/)
│   │   │   ├── constants/         #   Runtime constants (OrderStatus, UserRole, etc.)
│   │   │   ├── validators/        #   Zod validation schemas
│   │   │   └── events/            #   Domain event interfaces
│   │   ├── sockets/               # Socket.IO setup & handlers
│   │   └── server.ts              # Application entry point
│   ├── tests/
│   ├── migrations/
│   ├── seeds/
│   ├── docker/
│   │   ├── Dockerfile
│   │   └── .dockerignore
│   ├── tsconfig.json
│   └── package.json
├── docker-compose.yml
├── docker-compose.prod.yml
├── railway.json
├── .github/workflows/
│   ├── ci.yml
│   └── cd.yml
├── tsconfig.base.json
└── package.json
```

### `smartfood-{admin,customer,restaurant}-app` — Mobile Apps

```
smartfood-admin-app/
├── admin/                       # Expo app (same structure across all 3 apps)
│   ├── app/                     # expo-router file-based routing
│   │   ├── (auth)/
│   │   ├── (tabs)/
│   │   ├── _layout.tsx
│   │   └── [...unmatched].tsx
│   ├── components/
│   ├── hooks/
│   ├── services/
│   ├── stores/
│   ├── types/
│   │   ├── index.ts             # Re-exports from shared.ts
│   │   └── shared.ts            # Local type definitions (previously from @smartfood/shared)
│   ├── utils/
│   ├── constants/
│   ├── tsconfig.json
│   └── package.json
├── .github/workflows/
│   └── ci.yml
├── tsconfig.base.json
├── .eslintrc.js
└── package.json
```

## Key Conventions

- **Domain modules** in `backend/src/domains/` follow a consistent internal structure
- **Mobile apps** mirror each other — same file structure, same patterns
- **Tests** mirror source structure (`src/` → `tests/`)
- **Migration scripts** use timestamp prefix for ordering
- **No file exceeds 400 lines** — split when approaching this limit
- **No cross-domain imports** — domains communicate via event bus or service interfaces
