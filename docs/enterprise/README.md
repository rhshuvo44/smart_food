# SmartFood Enterprise Platform

## Overview

SmartFood is an enterprise-grade food delivery ecosystem connecting customers, restaurants, and administrators through three dedicated mobile applications powered by a unified backend API. The platform handles 100,000+ orders per day, processes real-time payments, manages geospatial delivery logistics, and provides multi-tenant administration.

## Architecture at a Glance

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Backend API | Express.js + TypeScript | RESTful API, business logic, data access |
| Database | MongoDB + Mongoose | Primary data store, geospatial queries |
| Customer App | React Native + Expo | Customer-facing ordering experience |
| Restaurant App | React Native + Expo | Restaurant order management |
| Admin App | React Native + Expo | Platform administration dashboard |
| Real-time | Socket.IO | Live order tracking, chat, notifications |
| Infrastructure | Docker + Docker Compose | Containerization and deployment |

## Documentation Map

| Document | Location | Purpose |
|----------|----------|---------|
| Architecture Guide | `docs/enterprise/architecture-guide.md` | System architecture, patterns, principles |
| Coding Standards | `docs/enterprise/coding-standards.md` | TypeScript, code style, quality gates |
| Naming Convention | `docs/enterprise/naming-convention.md` | Naming rules for all project artifacts |
| API Standards | `docs/enterprise/api-standards.md` | REST API design, versioning, contracts |
| Git Workflow | `docs/enterprise/git-workflow.md` | Git operations, commit conventions |
| Branch Strategy | `docs/enterprise/branch-strategy.md` | Branching model and lifecycle |
| Testing Strategy | `docs/enterprise/testing-strategy.md` | Test pyramid, coverage, practices |
| Deployment Strategy | `docs/enterprise/deployment-strategy.md` | Environment management, CI/CD |
| Release Strategy | `docs/enterprise/release-strategy.md` | Versioning, changelog, release process |
| Security Checklist | `docs/enterprise/security-checklist.md` | Security review items, threat model |
| Performance Checklist | `docs/enterprise/performance-checklist.md` | Performance budgets, optimization |
| Code Review Checklist | `docs/enterprise/code-review-checklist.md` | Review criteria, approval gates |
| Development Workflow | `docs/enterprise/development-workflow.md` | Daily workflow, phase transitions |
| Sprint Workflow | `docs/enterprise/sprint-workflow.md` | Sprint cadence, ceremonies, delivery |
| Project Setup Guide | `docs/enterprise/project-setup-guide.md` | Environment setup, onboarding |
| Folder Structure Guide | `docs/enterprise/folder-structure-guide.md` | Directory layout and ownership |

## Quick Start

### Prerequisites

- Node.js 20+
- Docker Desktop
- MongoDB 7+
- Expo CLI
- OpenCode CLI

### Setup

```bash
# Clone the repository
git clone <repository-url> smart_food
cd smart_food

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your configuration

# Start infrastructure
docker compose up -d

# Run database migrations
npm run migrate:up

# Seed development data
npm run seed

# Start development servers
npm run dev
```

## Development Environment

The development environment is managed through OpenCode with 30 specialized AI agents organized across 6 lifecycle phases. See `.opencode/AGENTS.md` for the complete agent registry.

### Daily Workflow

```bash
# Load project context
opencode .opencode/PROJECT.md
opencode .opencode/WORKFLOW.md

# Activate phase-specific agent
opencode .opencode/agents/backend.md    # Development phase
opencode .opencode/agents/qa.md         # Quality phase
```

## Technology Stack

### Backend
- **Runtime**: Node.js 20+ LTS
- **Framework**: Express.js 4.x
- **Language**: TypeScript 5.x (strict mode)
- **Database**: MongoDB 7+ with Mongoose 8.x
- **Validation**: Zod 3.x
- **Auth**: JWT (RS256) + bcrypt
- **Real-time**: Socket.IO 4.x
- **Testing**: Jest + Supertest

### Mobile
- **Framework**: React Native with Expo SDK 52+
- **Routing**: expo-router (file-based)
- **Styling**: NativeWind (Tailwind CSS)
- **Server State**: TanStack React Query
- **Client State**: Zustand
- **Navigation**: Expo Router (file-based)

### Infrastructure
- **Containerization**: Docker + Docker Compose
- **CI/CD**: GitHub Actions
- **Monitoring**: Prometheus + Grafana
- **Logging**: Structured JSON logging
- **CDN**: Cloudinary (images)

## Key Principles

1. **Modular Monolith** — Single deployable unit decomposed by domain
2. **TypeScript Strict** — Zero tolerance for `any`, `@ts-ignore`, or type assertions
3. **Test-Driven** — 85%+ line coverage minimum, tests before implementation
4. **Security First** — Defense in depth, zero trust, least privilege
5. **Documentation Parity** — Docs updated in same PR as code changes
6. **Incremental Delivery** — Small, deployable, reviewable changes
7. **Event-Driven** — Cross-domain communication through typed events
8. **Fail Fast** — Validate at boundaries, fail immediately on invalid state
