# Deployment Strategy

## Environments

| Environment | Purpose | URL | Deploy Trigger |
|------------|---------|-----|---------------|
| Local | Development | `localhost:3000` | Manual |
| Staging | QA & integration testing | `staging.smartfood.com` | Push to develop |
| Production | Live users | `api.smartfood.com` | Push to main (release) |

## CI/CD Pipeline

### CI Pipeline (per PR)

```yaml
name: CI
on: pull_request

jobs:
  lint:
    - ESLint strict (zero warnings)
  typecheck:
    - TypeScript strict (zero errors)
  test:
    - Unit tests (>= 85% coverage)
    - Integration tests
  build:
    - Backend Docker image
    - Mobile apps (Expo export)
  security:
    - SAST scan
    - Dependency audit
    - Secret detection
```

### CD Pipeline (per push to main)

```yaml
name: CD
on:
  push:
    branches: [main]

jobs:
  deploy-staging:
    - Build Docker image
    - Push to registry
    - Deploy to staging
    - Run smoke tests

  deploy-production:
    - Deploy to production (rolling update)
    - Run health checks
    - Monitor for 15 minutes
```

## Deployment Types

### Rolling Deployment (default)

- Zero-downtime
- Instances updated one at a time
- Health check between each instance
- Traffic shifts gradually

### Canary Deployment (major releases)

- 10% traffic to new version first
- Monitor for errors (15 min)
- Increase to 50% (monitor 15 min)
- Increase to 100%

### Hotfix Deployment

- Immediate deployment to all instances
- Feature flag disabled initially
- Enable gradually after verification

## Docker Setup

### Dockerfile (Backend)

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
EXPOSE 3000
CMD ["node", "dist/server.js"]
```

### Docker Compose

```yaml
# docker-compose.yml
services:
  backend:
    build: ./backend
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://mongo:27017/smartfood
    depends_on:
      - mongo

  mongo:
    image: mongo:7
    volumes:
      - mongo_data:/data/db
```

## Database Migrations

- Run **before** new code is deployed
- Must be backward-compatible (old code works with new schema)
- Always reversible (up + down scripts)
- Tested against staging data first

```bash
# Migration commands
npm run migrate:up     # Apply pending migrations
npm run migrate:down   # Rollback last migration
npm run migrate:status # Check migration state
```

## Health Checks

Every container exposes `/health` and `/ready` endpoints:

```json
GET /api/v1/health
{
  "status": "healthy",
  "uptime": 123456,
  "database": "connected",
  "memory": { "used": 256, "total": 512, "percentage": 50 },
  "version": "2.1.0"
}
```

## Monitoring & Alerting

| Metric | Threshold | Action |
|--------|-----------|--------|
| API error rate | > 1% | PagerDuty alert |
| p95 response time | > 500ms | Slack notification |
| Memory usage | > 80% | Auto-scale trigger |
| Disk usage | > 85% | Ops ticket |
| DB query p95 | > 200ms | Performance review |

## Rollback

See [Release Strategy](./release-strategy.md) for rollback procedure.

**Target: Complete rollback within 30 minutes.**

## Step-by-Step Guide

For a detailed walkthrough covering server provisioning, SSL setup, backup procedures,
and troubleshooting, see the [Deployment Guide](./deployment-guide.md).

## Infrastructure as Code

- Docker Compose for local and staging
- Production: Docker Swarm or Kubernetes (TBD)
- Config via environment variables (not config files)
- Secrets via environment variables or vault
- Logs via Docker stdout (collected by logging agent)
