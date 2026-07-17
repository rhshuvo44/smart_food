# ADR-006: Monorepo to Multi-Repository Split

**Status:** Implemented
**Date:** 2026-07-17
**Decision Maker:** Architecture Team

## Context

The SmartFood platform originally used a single monorepo (npm workspaces) containing:

- `backend/` — Express.js API server
- `apps/admin/` — Admin Expo mobile app
- `apps/customer/` — Customer Expo mobile app
- `apps/restaurant/` — Restaurant Expo mobile app
- `shared/` — Shared types, constants, validators, events, utils

As the platform grew, several pain points emerged:

1. **Independent deployments** — Backend API deploys at a different cadence than mobile apps. Monorepo ties all release cycles together.
2. **CI/CD complexity** — A single pipeline must handle backend Docker builds, mobile Expo builds, and shared library compilation. Changes to one app trigger CI for everything.
3. **Team autonomy** — Backend and mobile teams have different workflows, code review patterns, and deployment targets.
4. **Build times** — `npm ci` installs dependencies for all workspaces even when only the backend changes.
5. **Docker complexity** — The Dockerfile must build the shared package before the backend, requiring careful monorepo-aware configuration.

## Decision

Split the monorepo into **4 independent repositories**, each with its own CI/CD pipeline, dependency management, and deployment process.

## Repository Breakdown

### 1. `smartfood-backend` — Backend API

**Location:** `C:\project\smartfood-backend\` (or `github.com/org/smartfood-backend`)

**Contents:**
- `backend/` — Express.js API (same structure as before)
- `backend/src/shared/` — Previously in `shared/` monorepo package, now embedded directly under `src/shared/` as source files:
  - `src/shared/types/` — TypeScript type definitions
  - `src/shared/constants/` — Runtime constants (OrderStatus, UserRole, PaymentStatus)
  - `src/shared/validators/` — Zod validation schemas
  - `src/shared/events/` — Domain event interfaces and ChatSocketEvents
- `backend/docker/Dockerfile` — Self-contained Docker build
- `.github/workflows/` — Backend-specific CI/CD

**Key change:** Imports changed from `@smartfood/shared` to `@/shared` (local path alias).

**Deployment:** Railway (same as before), Docker compose, GitHub Container Registry.

---

### 2. `smartfood-admin-app` — Admin Mobile App

**Location:** `C:\project\smartfood-admin-app\` (or `github.com/org/smartfood-admin-app`)

**Contents:**
- `admin/` — Expo app (same structure as before)
- `admin/types/shared.ts` — Local type definitions (previously from `@smartfood/shared`)

**Key change:** Types that were imported from `@smartfood/shared` are now defined locally in `types/shared.ts`. No runtime code from shared is needed (apps only use type-only imports).

---

### 3. `smartfood-customer-app` — Customer Mobile App

**Location:** `C:\project\smartfood-customer-app\` (or `github.com/org/smartfood-customer-app`)

**Contents:**
- `customer/` — Expo app (same structure as before)
- `customer/types/shared.ts` — Local type definitions

---

### 4. `smartfood-restaurant-app` — Restaurant Mobile App

**Location:** `C:\project\smartfood-restaurant-app\` (or `github.com/org/smartfood-restaurant-app`)

**Contents:**
- `restaurant/` — Expo app (same structure as before)
- `restaurant/types/shared.ts` — Local type definitions

---

## Shared Code Strategy

| Module | Backend | Apps |
|--------|---------|------|
| **types/** | Inline in `src/shared/types/` | Locally defined in `types/shared.ts` |
| **constants/** | Inline in `src/shared/constants/` | Not needed (types only) |
| **validators/** | Inline in `src/shared/validators/` | Not needed (types only) |
| **events/** | Inline in `src/shared/events/` | Not needed (types only) |
| **utils/** | Not needed (currently unused) | Not needed |

**Rationale:**
- Backend uses shared code at runtime (validators, constants, events). Embedding as source ensures no build-time dependency on an external package.
- Apps only use shared code for TypeScript type annotations (compile-time only). Defining types locally avoids any dependency on a shared npm package.

## Original Monorepo

The original `smart_food/` monorepo remains unchanged at `C:\project\smart_food\`. It is preserved as the historical record and single source of truth for the pre-split codebase. New development should be done in the respective new repositories.

## Consequences

### Positive
- Each repo can be deployed independently
- CI/CD pipelines are smaller and faster
- Teams can work autonomously on their respective repos
- Docker builds are simpler (no monorepo awareness needed)
- `npm ci` only installs dependencies for one project

### Negative
- Type definitions are duplicated across repos (types/shared.ts)
- No shared versioning — if a type changes, it must be updated in all repos manually
- Developers need to clone multiple repos for full-stack work

### Mitigations
- Type duplication is acceptable since apps only use types (no runtime logic)
- Cross-cutting type changes should be coordinated via PRs across repos
- A shared types-only npm package (`@smartfood/types`) can be introduced later if duplication becomes burdensome

## Original Context

- [ADR-005: Monorepo Structure](./ADR-005-monorepo-structure.md) — Original decision to use a monorepo
- [Architecture Guide](./architecture-guide.md) — Full system architecture
