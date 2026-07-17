# Folder Structure Guide

## Top-Level Layout

```
smart_food/
├── .opencode/             # AI development environment config
├── apps/                  # Mobile applications
├── backend/               # Express.js API
├── shared/                # Shared code across all apps
├── infrastructure/        # Docker, nginx, monitoring configs
├── .github/               # CI/CD workflows
├── scripts/               # Automation scripts
├── docs/                  # Enterprise documentation
├── docker-compose.yml     # Local development
├── docker-compose.prod.yml# Production
├── .env.example           # Environment template
├── .eslintrc.js           # ESLint config
├── .prettierrc            # Prettier config
├── tsconfig.json          # Root TypeScript config
├── package.json           # Workspace root
└── README.md              # Project README
```

## .opencode/ — AI Development Environment

```
.opencode/
├── README.md              # Environment setup & onboarding
├── PROJECT.md             # Architecture & project context
├── RULES.md               # Operational & engineering rules
├── WORKFLOW.md            # Development lifecycle workflow
├── AGENTS.md              # Agent registry & configuration
├── CLAUDE.md              # Claude AI agent config
├── GEMINI.md              # Gemini AI agent config
└── agents/                # 30 specialized agent files
    ├── planner.md
    ├── architect.md
    ├── backend.md
    ├── database.md
    ├── customer-app.md
    ├── restaurant-app.md
    ├── admin-app.md
    ├── ui-ux.md
    ├── api.md
    ├── security.md
    ├── qa.md
    ├── reviewer.md
    ├── devops.md
    ├── deployment.md
    ├── git.md
    ├── release.md
    ├── docs.md
    ├── payment.md
    ├── notification.md
    ├── maps.md
    ├── chat.md
    ├── analytics.md
    ├── performance.md
    ├── ai.md
    ├── clean-code.md
    ├── code-style.md
    ├── file-structure.md
    ├── scrum-master.md
    ├── product-manager.md
    └── escalation.md
```

## apps/ — Mobile Applications

Three React Native apps with identical structure:

```
apps/
├── customer/                     # Customer-facing app
│   ├── app/                      # Expo Router pages
│   │   ├── (auth)/               # Auth routes (login, register)
│   │   ├── (tabs)/               # Tab navigation routes
│   │   │   ├── home.tsx
│   │   │   ├── search.tsx
│   │   │   ├── orders.tsx
│   │   │   └── profile.tsx
│   │   ├── _layout.tsx           # Root layout
│   │   └── [...unmatched].tsx    # 404 handler
│   ├── components/               # Reusable UI components
│   │   ├── common/               # Buttons, inputs, cards, modals
│   │   ├── order/                # Order-related components
│   │   └── restaurant/           # Restaurant-related components
│   ├── hooks/                    # Custom React hooks
│   ├── services/                 # API client & service functions
│   ├── stores/                   # Zustand state stores
│   ├── types/                    # App-specific TypeScript types
│   ├── utils/                    # Utility functions
│   ├── constants/                # App constants (colors, spacing)
│   ├── assets/                   # Images, fonts, animations
│   ├── app.json                  # Expo configuration
│   └── package.json
├── restaurant/                   # Restaurant-facing app
│   └── (mirrors customer structure)
└── admin/                        # Admin dashboard app
    └── (mirrors customer structure)
```

### app/ Directory (Expo Router)

```
app/
├── (auth)/                       # Route group for auth flow
│   ├── login.tsx
│   ├── register.tsx
│   └── _layout.tsx               # Auth stack layout
├── (tabs)/                       # Route group for main tabs
│   ├── _layout.tsx               # Tab navigator layout
│   ├── home.tsx
│   ├── search.tsx
│   ├── orders.tsx
│   └── profile.tsx
├── order/                        # Nested routes
│   ├── [id].tsx                  # Order detail (dynamic)
│   └── create.tsx                # Order creation
├── _layout.tsx                   # Root layout
└── [...unmatched].tsx            # Catch-all 404
```

## backend/ — Express.js API

```
backend/
├── src/
│   ├── config/                   # Configuration modules
│   │   ├── env.ts                # Zod-validated environment
│   │   ├── database.ts           # MongoDB connection
│   │   ├── cors.ts               # CORS configuration
│   │   └── app.ts                # Express app setup
│   ├── domains/                  # Domain modules
│   │   ├── orders/
│   │   │   ├── order.controller.ts
│   │   │   ├── order.service.ts
│   │   │   ├── order.repository.ts
│   │   │   ├── order.model.ts
│   │   │   ├── order.routes.ts
│   │   │   ├── order.validator.ts
│   │   │   ├── order.events.ts
│   │   │   └── order.types.ts
│   │   ├── restaurants/
│   │   ├── customers/
│   │   ├── payments/
│   │   ├── delivery/
│   │   ├── notifications/
│   │   └── analytics/
│   ├── middleware/               # Express middleware
│   │   ├── auth.middleware.ts
│   │   ├── error.middleware.ts
│   │   ├── validation.middleware.ts
│   │   ├── rate-limit.middleware.ts
│   │   ├── logging.middleware.ts
│   │   └── correlation.middleware.ts
│   ├── shared/                   # Shared utilities
│   │   ├── event-bus.ts
│   │   ├── logger.ts
│   │   └── errors.ts
│   ├── sockets/                  # Socket.IO
│   │   ├── socket.server.ts
│   │   ├── auth.socket.ts
│   │   └── handlers/
│   └── server.ts                 # Entry point
├── tests/
│   ├── unit/
│   ├── integration/
│   ├── e2e/
│   └── fixtures/
├── migrations/                   # DB migration scripts
├── seeds/                        # Seed data scripts
├── docker/                       # Docker configuration
│   ├── Dockerfile
│   └── .dockerignore
└── package.json
```

### Domain Module Pattern

Each domain follows a consistent structure:

```
domains/orders/
├── order.controller.ts    # HTTP request/response handling (< 20 lines)
├── order.service.ts       # Business logic & orchestration
├── order.repository.ts    # Data access layer (MongoDB queries)
├── order.model.ts         # Mongoose schema & indexes
├── order.routes.ts        # Route definitions & middleware chain
├── order.validator.ts     # Zod validation schemas
├── order.events.ts        # Domain event types & publishing
└── order.types.ts         # TypeScript interfaces & types
```

## shared/ — Cross-Application Code

```
shared/
├── types/                      # Shared type definitions
│   ├── order.types.ts
│   ├── restaurant.types.ts
│   ├── user.types.ts
│   └── api.types.ts            # Standard response envelope
├── constants/                  # Shared constants & enums
│   ├── order-status.ts
│   ├── payment-status.ts
│   └── error-codes.ts
├── validators/                 # Shared Zod schemas
│   ├── address.validator.ts
│   └── pagination.validator.ts
└── utils/                      # Shared utilities
    ├── format.ts               # Currency, date formatting
    └── validation.ts           # Common validation helpers
```

## infrastructure/ — Operations

```
infrastructure/
├── docker-compose.yml          # Local development
├── docker-compose.prod.yml     # Production composition
├── nginx/                      # Reverse proxy config
│   └── default.conf
└── monitoring/                 # Observability configs
    ├── prometheus.yml
    └── grafana/
        └── dashboards/
```

## docs/ — Enterprise Documentation

```
docs/
├── enterprise/                 # Enterprise documentation
│   ├── README.md              # Overview & quick start
│   ├── architecture-guide.md  # System architecture
│   ├── coding-standards.md    # TypeScript & code quality
│   ├── naming-convention.md   # Naming rules
│   ├── api-standards.md       # REST API design
│   ├── git-workflow.md        # Git operations
│   ├── branch-strategy.md     # Branching model
│   ├── testing-strategy.md    # Test pyramid & practices
│   ├── deployment-strategy.md # Environment management
│   ├── release-strategy.md    # Versioning & releases
│   ├── security-checklist.md  # Security review items
│   ├── performance-checklist.md # Performance budgets
│   ├── code-review-checklist.md # Review criteria
│   ├── sprint-workflow.md     # Sprint ceremonies
│   ├── development-workflow.md # Daily dev process
│   ├── project-setup-guide.md # Onboarding guide
│   └── folder-structure-guide.md # This file
├── architecture/              # ADRs & architecture docs
├── api/                       # OpenAPI specs
├── checklists/                # Operational checklists
├── guides/                    # Operation guides
├── runbooks/                  # Operations runbooks
└── standards/                 # Standards documents
```
