# Folder Structure Guide

## Root Layout

```
smart_food/
├── .opencode/                 # AI development environment (OpenCode)
├── apps/                      # Mobile applications
│   ├── customer/              #   Customer-facing app
│   ├── restaurant/            #   Restaurant-facing app
│   └── admin/                 #   Admin dashboard
├── backend/                   # Express.js API backend
├── shared/                    # Shared kernel (types, utils, constants)
├── infrastructure/            # Docker, Nginx, monitoring configs
├── .github/                   # CI/CD pipelines, CODEOWNERS
├── docs/                      # Enterprise documentation
├── scripts/                   # Automation and utility scripts
└── [config files]             # Root config: tsconfig, eslint, prettier
```

## Backend Structure

```
backend/
├── src/
│   ├── config/                # Environment & app configuration
│   │   ├── env.ts             #   Zod-validated environment
│   │   ├── database.ts        #   MongoDB connection
│   │   ├── cors.ts            #   CORS configuration
│   │   └── app.ts             #   Express app setup & middleware
│   ├── domains/               # Domain modules (bounded contexts)
│   │   ├── orders/            #   Order lifecycle, items, status
│   │   │   ├── order.controller.ts
│   │   │   ├── order.service.ts
│   │   │   ├── order.model.ts
│   │   │   ├── order.routes.ts
│   │   │   ├── order.validator.ts
│   │   │   ├── order.events.ts
│   │   │   └── order.types.ts
│   │   ├── restaurants/       #   Restaurant menus, hours, zones
│   │   ├── customers/         #   Customer profiles, addresses
│   │   ├── payments/          #   Payment processing, webhooks
│   │   ├── delivery/          #   Delivery zones, tracking
│   │   ├── notifications/     #   Push, email, SMS notifications
│   │   └── analytics/         #   Dashboards, metrics, reports
│   ├── middleware/            # Cross-cutting middleware
│   │   ├── auth.middleware.ts
│   │   ├── error.middleware.ts
│   │   ├── validation.middleware.ts
│   │   ├── rate-limit.middleware.ts
│   │   ├── logging.middleware.ts
│   │   └── correlation.middleware.ts
│   ├── shared/                # Backend shared utilities
│   │   ├── event-bus.ts
│   │   ├── logger.ts
│   │   └── errors.ts
│   ├── sockets/               # Socket.IO setup & handlers
│   └── server.ts              # Application entry point
├── tests/
│   ├── unit/                  # Unit tests (mirror src/ structure)
│   ├── integration/           # Integration tests
│   └── fixtures/              # Test data & factories
├── migrations/                # Database migration scripts
├── seeds/                     # Seed data scripts
├── docker/
│   ├── Dockerfile
│   └── .dockerignore
├── tsconfig.json
└── package.json
```

## Mobile App Structure (apps/customer, apps/restaurant, apps/admin)

```
apps/customer/
├── app/                       # expo-router file-based routing
│   ├── (auth)/                #   Auth flow routes
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   └── _layout.tsx
│   ├── (tabs)/                #   Main tab navigation
│   │   ├── index.tsx          #   Home screen
│   │   ├── orders.tsx
│   │   ├── profile.tsx
│   │   └── _layout.tsx
│   ├── _layout.tsx            # Root layout (providers)
│   └── [...unmatched].tsx     # 404 handler
├── components/                # Reusable UI components
│   ├── common/                # Shared: Button, Input, Card
│   ├── order/                 # Order-specific components
│   └── restaurant/            # Restaurant-specific components
├── hooks/                     # Custom React hooks
│   ├── useOrders.ts
│   ├── useRestaurants.ts
│   └── useAuth.ts
├── services/                  # API client & service functions
│   ├── api.ts                 # Axios/fetch instance
│   ├── order.service.ts
│   └── restaurant.service.ts
├── stores/                    # Zustand state stores
│   ├── auth.store.ts
│   └── theme.store.ts
├── types/                     # App-specific TypeScript types
├── utils/                     # Utility functions
├── constants/                 # App constants
├── assets/                    # Images, fonts, animations
├── app.json                   # Expo configuration
└── package.json
```

## Shared Kernel

```
shared/
├── types/                     # Cross-app type definitions
│   ├── order.types.ts
│   ├── restaurant.types.ts
│   └── user.types.ts
├── constants/                 # Shared enums and constants
│   ├── order-status.ts
│   └── payment-status.ts
├── validators/                # Shared Zod validation schemas
└── utils/                     # Shared utility functions
```

## Infrastructure

```
infrastructure/
├── docker-compose.yml          # Local development
├── docker-compose.prod.yml     # Production composition
├── nginx/                      # Reverse proxy config
│   ├── nginx.conf
│   └── sites/
└── monitoring/                 # Observability config
    ├── prometheus.yml
    └── grafana-dashboards/
```

## Key Conventions

- **Domain modules** in `backend/src/domains/` follow a consistent internal structure
- **Mobile apps** mirror each other — same file structure, same patterns
- **Tests** mirror source structure (`src/` → `tests/`)
- **Migration scripts** use timestamp prefix for ordering
- **No file exceeds 400 lines** — split when approaching this limit
- **No cross-domain imports** — domains communicate via event bus or service interfaces
