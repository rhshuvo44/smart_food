---
title: "ADR-005: Monorepo Structure with npm Workspaces"
status: accepted
date: 2026-07-13
deciders: Principal AI Architect, DevOps Lead
tags: [infrastructure, monorepo, workspaces, tooling]
---

# ADR-005: Monorepo Structure with npm Workspaces

## Context

SmartFood consists of multiple deployable artifacts:
- 3 React Native mobile apps (Customer, Restaurant, Admin)
- 1 Express.js backend API
- 1 shared kernel (types, constants, validators, utils)
- Infrastructure configuration (Docker, nginx, monitoring)
- CI/CD pipeline definitions

The project structure must support:
- Shared code across all 3 mobile apps (components, hooks, API client, types)
- Shared code across backend and mobile apps (types, validators, constants)
- Independent versioning and deployment of each artifact
- Fast CI/CD (only rebuild changed packages)
- Easy onboarding for new developers

## Decision

We will use a **single monorepo with npm workspaces** organized as follows:

```
smart_food/
├── apps/                      # Mobile applications
│   ├── customer/              #   Customer React Native app (Expo)
│   ├── restaurant/            #   Restaurant React Native app (Expo)
│   └── admin/                 #   Admin React Native app (Expo)
├── backend/                   # Express.js API backend
├── shared/                    # Shared kernel (types, constants, validators, utils)
├── infrastructure/            # Docker, nginx, monitoring
├── .github/                   # CI/CD workflows
├── docs/                      # Documentation
├── scripts/                   # Automation scripts
├── package.json               # Root workspace config
├── tsconfig.base.json         # Shared TypeScript config
└── ...
```

### Workspace Configuration

```json
{
  "name": "smartfood",
  "private": true,
  "workspaces": [
    "apps/*",
    "backend",
    "shared",
    "infrastructure"
  ]
}
```

### Dependency Strategy

| Dependency Type | Location | Example |
|----------------|----------|---------|
| Shared utilities | `shared/` | Types, validators, constants |
| Shared mobile components | Each app duplicates (no shared mobile component lib) | To avoid cross-app coupling |
| Backend-only | `backend/package.json` | Express, Mongoose, Zod |
| App-specific | Each app's `package.json` | Expo SDK, NativeWind |

### Why no shared mobile component library?

Each mobile app has distinct UI requirements:
- Customer app: Card-based browsing, map integration, order tracking
- Restaurant app: List-based order management, status controls
- Admin app: Data tables, forms, moderation tools

Shared components (Button, Input, Card) are simple enough to duplicate or extract only when 3+ instances exist. Premature extraction creates abstraction overhead.

## Alternatives Considered

### Alternative 1: Polyrepo (separate repos per app + backend)
- **Pros**: Independent CI/CD, independent versioning, team autonomy, no monorepo tooling
- **Cons**: Cross-repo changes require multiple PRs, no atomic commits across packages, shared code must be published as npm packages, coordination overhead, harder onboarding
- **Rejected because**: Cross-repo coordination would significantly slow development velocity. With 3 mobile apps sharing API types and validators, every backend change would require 3 PRs in 3 repos. The monorepo enables atomic cross-cutting changes.

### Alternative 2: Monorepo with Turborepo/Nx
- **Pros**: Build caching, parallel task execution, dependency graph awareness, affected-project detection
- **Cons**: Additional tooling dependency, learning curve, configuration overhead, lock-in to the tool's conventions
- **Rejected because**: npm workspaces + a simple shell script provides sufficient build orchestration for our current scale (4-5 packages). If CI build times become a bottleneck, we can add Turborepo without restructuring.

## Consequences

### Positive
- Single `npm install` for the entire project
- Atomic commits across all packages (shared types + backend + mobile in one PR)
- Shared kernel (`shared/`) is versioned with the code — no npm publish overhead
- Consistent tooling (TypeScript, ESLint, Prettier) across all packages
- Easy onboarding — clone one repo, run one install command
- CI can cache node_modules at the root level

### Negative
- No independent versioning of packages (all share the root version)
- `node_modules` can grow large (all dependencies in one tree)
- A broken commit can block all packages simultaneously
- Git history is shared — `git log` shows changes across all packages
- No access control per package (in a polyrepo, you can restrict access per repo)

### Mitigations
- Branch protection rules prevent broken commits to `develop` and `main`
- CI runs tests for only the affected packages (using `git diff` to detect changes)
- CODEOWNERS file restricts who can approve changes to `backend/`, `shared/`, etc.
- `.gitignore` patterns per subdirectory for build artifacts

## Trade-offs

| Concern | Monorepo (npm workspaces) | Polyrepo |
|---------|--------------------------|----------|
| Atomic commits | ✅ Yes | ❌ No (multi-PR) |
| Onboarding | ✅ One clone | ⚠️ Multiple clones |
| Shared code management | ✅ In-repo | ❌ npm publish needed |
| Independent versioning | ❌ Single version | ✅ Per-repo versioning |
| Access control | ⚠️ CODEOWNERS | ✅ Per-repo permissions |
| CI speed | ⚠️ Affected-only detection | ✅ Independent per-repo |
| Git history | ⚠️ Mixed | ✅ Per-package history |

## Migration Path

If the monorepo becomes too large (e.g., 50+ packages, 100+ engineers):
1. Adopt Turborepo/Nx for build caching and task orchestration
2. Split the backend into `packages/backend-core`, `packages/domain-orders`, etc. (within the same monorepo)
3. If team size justifies, extract high-churn packages into separate repos with published npm packages
4. Use Changesets for independent versioning of extractable packages
