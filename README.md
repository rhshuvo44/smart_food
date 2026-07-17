# SmartFood — Enterprise Food Delivery Platform

An enterprise-grade food delivery ecosystem connecting customers, restaurants, and administrators through three dedicated mobile applications with a unified Express.js backend API.

## Architecture

```
apps/
├── customer/       Customer React Native app (Expo)
├── restaurant/     Restaurant React Native app (Expo)
└── admin/          Admin React Native app (Expo)
backend/            Express.js API (modular monolith)
shared/             Shared types, constants, validators
```

- **Backend:** Express.js modular monolith with domain boundaries (Orders, Restaurants, Customers, Payments, Delivery, Notifications, Analytics)
- **Mobile:** 3 React Native apps — Expo SDK 52, NativeWind, expo-router
- **Database:** MongoDB 7.x with Mongoose ODM
- **Real-time:** Socket.IO for order tracking, chat, notifications
- **Infrastructure:** Docker, GitHub Actions CI/CD

## Quick Start

```bash
# Prerequisites: Node.js >= 20, Docker >= 24
npm install
docker compose up -d
cd backend && cp .env.example .env && npm install && npm run migrate:up && npm run seed && npm run dev
```

See the [Project Setup Guide](docs/project-setup.md) for detailed instructions.

## Documentation

| Document | Description |
|----------|-------------|
| [Project Setup Guide](docs/project-setup.md) | Environment setup, prerequisites, configuration |
| [Architecture Guide](docs/architecture/architecture-guide.md) | System architecture, domain design, data flow |
| [Development Workflow](docs/development-workflow.md) | Daily engineering workflow and conventions |
| [Sprint Workflow](docs/sprint-workflow.md) | Agile sprint lifecycle and ceremonies |
| [Coding Standards](docs/standards/coding-standards.md) | TypeScript, error handling, code organization |
| [API Standards](docs/standards/api-standards.md) | REST conventions, response envelope, pagination |
| [Naming Convention](docs/standards/naming-convention.md) | Code, database, infrastructure naming rules |
| [Git Workflow](docs/git-workflow.md) | Commits, PRs, review process |
| [Branch Strategy](docs/branch-strategy.md) | Branch naming, lifecycle, protection rules |
| [Release Strategy](docs/release-strategy.md) | Semantic versioning, changelog, deployment |
| [Testing Strategy](docs/testing-strategy.md) | Test pyramid, coverage, CI testing |
| [Deployment Strategy](docs/deployment-strategy.md) | Environments, CI/CD, rollback |
| [Deployment Guide](docs/deployment-guide.md) | Step-by-step production deployment |
| [Security Checklist](docs/checklists/security-checklist.md) | Security review, compliance, hardening |
| [Performance Checklist](docs/checklists/performance-checklist.md) | Performance budgets, optimization |
| [Code Review Checklist](docs/checklists/code-review-checklist.md) | Review criteria, quality gates |
| [Folder Structure](docs/folder-structure.md) | Directory layout and ownership |

## AI Development Environment

This project uses an AI-augmented development workflow via the [OpenCode](https://opencode.ai) platform. The `.opencode/` directory contains the complete multi-agent configuration:

- **30 specialized agents** covering Planning, Design, Development, Quality, Delivery, and Maintenance phases
- Structured handoff protocols between agents
- Comprehensive rules and standards enforcement
- Domain-specific agent files for backend, mobile, database, and infrastructure

## Key Metrics

| Metric | Target |
|--------|--------|
| API p50 | < 100ms |
| API p95 | < 300ms |
| Uptime | 99.9% |
| Test coverage | >= 85% |

## License

Proprietary — All rights reserved.
