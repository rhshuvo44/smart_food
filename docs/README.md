# SmartFood — Enterprise Food Delivery Platform

**Version:** 2.0.0 | **Status:** Active | **Last Updated:** 2026-07-13

## Overview

SmartFood is an enterprise-grade food delivery ecosystem connecting customers, restaurants, and administrators through three dedicated mobile applications with a unified backend API. The platform handles 100,000+ orders per day, processes real-time payments, manages geospatial delivery logistics, and provides multi-tenant administration while maintaining 99.9% uptime and sub-500ms p95 response times.

## System Architecture

```
Customer App (React Native)  │  Restaurant App (React Native)  │  Admin App (React Native)
─────────────────────────────┼─────────────────────────────────┼─────────────────────────────
                              │  REST API (Express.js)         │
                              │  MongoDB (Primary DB)          │
                              │  Socket.IO (Real-time)         │
                              │  Shared Kernel (Types/Utils)   │
```

- **Backend:** Express.js modular monolith with domain boundaries
- **Mobile:** 3 React Native apps (Expo, NativeWind, expo-router)
- **Database:** MongoDB with Mongoose ODM
- **Real-time:** Socket.IO for order tracking, chat, notifications
- **Infrastructure:** Docker, GitHub Actions CI/CD

## Quick Links

| Document | Purpose |
|----------|---------|
| [Project Setup Guide](./project-setup.md) | Environment setup, prerequisites, installation |
| [Architecture Guide](./architecture/architecture-guide.md) | System architecture, domain design, data flow |
| [Development Workflow](./development-workflow.md) | Daily engineering workflow |
| [Sprint Workflow](./sprint-workflow.md) | Agile sprint lifecycle |
| [Coding Standards](./standards/coding-standards.md) | TypeScript, style, error handling rules |
| [API Standards](./standards/api-standards.md) | REST conventions, versioning, error responses |
| [Naming Convention](./standards/naming-convention.md) | Files, code, database, infrastructure naming |
| [Git Workflow](./git-workflow.md) | Branching, commits, PR process |
| [Branch Strategy](./branch-strategy.md) | Git branches, naming, lifecycle |
| [Release Strategy](./release-strategy.md) | Semantic versioning, changelog, release process |
| [Testing Strategy](./testing-strategy.md) | Test pyramid, coverage, CI testing |
| [Deployment Strategy](./deployment-strategy.md) | Environments, CI/CD, rollback |
| [Security Checklist](./checklists/security-checklist.md) | Security review, compliance, hardening |
| [Performance Checklist](./checklists/performance-checklist.md) | Performance budgets, optimization |
| [Code Review Checklist](./checklists/code-review-checklist.md) | Review criteria, quality gates |
| [Folder Structure](./folder-structure.md) | Directory layout, ownership |

## Technology Stack

| Category | Technology | Version | Purpose |
|----------|-----------|---------|---------|
| Language | TypeScript | 5.4+ | Strict mode, typed safe |
| Backend | Express.js | 4.18+ | REST API framework |
| Mobile | React Native (Expo) | SDK 52 | Cross-platform mobile apps |
| Styling | NativeWind | 4.x | Utility-first styling |
| Database | MongoDB | 7.x | Primary data store |
| ODM | Mongoose | 8.x | Schema & data access |
| Validation | Zod | 3.x | Runtime type validation |
| State (Server) | TanStack Query | 5.x | API data caching |
| State (Client) | Zustand | 4.x | Client state management |
| Real-time | Socket.IO | 4.x | WebSocket communication |
| Auth | JWT (RS256) | — | Authentication tokens |
| Payments | Stripe | latest | Payment processing |
| Maps | Google Maps API | latest | Geocoding, tracking |
| CI/CD | GitHub Actions | — | Automated pipelines |
| Containers | Docker | 24+ | Containerization |
| Compression | Brotli | — | Response compression |

## AI-Assisted Development

This project uses the OpenCode AI Development Environment with a 30-agent system. The `.opencode/` directory at the project root contains the full agent configuration, rules, workflows, and domain-specific agent definitions. All agents collaborate through structured handoff protocols across 6 lifecycle phases (Planning → Design → Development → Quality → Delivery → Maintenance).

## Key Metrics & SLOs

| Metric | Target |
|--------|--------|
| API p50 response time | < 100ms |
| API p95 response time | < 300ms |
| API p99 response time | < 1000ms |
| Uptime | 99.9% |
| Unit test coverage | >= 85% lines |
| Mobile cold start | < 2s |
| Mobile bundle size | < 2MB |

## Related Repositories

All code lives in this monorepo. See the [Folder Structure](./folder-structure.md) guide for directory layout.

---

*For AI agent configuration, see [.opencode/](../.opencode/README.md)*
