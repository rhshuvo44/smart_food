# Deployment Strategy

## Environment Overview

| Environment | Purpose | URL | Deploy Method |
|-------------|---------|-----|---------------|
| Development | Local development | `localhost:3000` | `npm run dev` |
| Staging | Integration testing | `staging-api.smartfood.com` | CI/CD auto-deploy |
| Production | Live system | `api.smartfood.com` | CI/CD manual approval |

## CI/CD Pipeline

### GitHub Actions Workflow

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [develop, 'release/*', 'hotfix/*']
  pull_request:
    branches: [develop, main]

jobs:
  lint-and-typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck

  test:
    needs: lint-and-typecheck
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run test:coverage
      - uses: actions/upload-artifact@v4
        with:
          name: coverage-report
          path: coverage/

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-artifact@v4
        with:
          name: dist
          path: dist/

  docker-build:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - id: meta
        uses: docker/metadata-action@v5
        with:
          images: smartfood/backend
          tags: |
            type=ref,event=branch
            type=ref,event=pr
            type=semver,pattern={{version}}
      - uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      - uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: ${{ steps.meta.outputs.tags }}
```

## Deployment Environments

### Development Environment

```bash
# Start all services
docker compose up -d

# Start with hot reload
npm run dev

# Access
API:      http://localhost:3000
MongoDB:  mongodb://localhost:27017
Mongo Express: http://localhost:8081
```

### Staging Environment

- Auto-deployed from `develop` branch
- Uses staging MongoDB (separate from production)
- Seeds with anonymized production data
- Runs automated smoke tests post-deploy
- Accessible to internal team only (VPN required)

### Production Environment

- Deployed from `release/*` or `hotfix/*` branches
- Multiple Docker replicas behind load balancer
- MongoDB replica set (3 nodes)
- Rolling deployment for zero-downtime
- Gradual rollout for high-risk changes

### Production Architecture

```
                    ┌──────────┐
                    │  DNS      │
                    │  (Route53)│
                    └────┬─────┘
                         │
                    ┌────▼─────┐
                    │  CDN     │
                    │(CloudFront)│
                    └────┬─────┘
                         │
                    ┌────▼─────┐
                    │  LB      │
                    │(ALB)     │
                    └────┬─────┘
                    ┌────┴─────┐
         ┌──────────┤ API GW   ├──────────┐
         │          └────┬─────┘          │
    ┌────▼────┐    ┌────▼────┐    ┌───────┴───┐
    │ Backend │    │ Backend │    │  Backend   │
    │  v2.1.0 │    │  v2.1.0 │    │  v2.1.0   │
    └────┬────┘    └────┬────┘    └───────┬───┘
         │              │                 │
         └──────────────┼─────────────────┘
                        │
                   ┌────▼─────┐
                   │  MongoDB  │
                   │Replica Set│
                   │(3 nodes)  │
                   └──────────┘
```

## Deployment Process

### Standard Release Deployment

```yaml
steps:
  pre-deployment:
    - "Verify release branch CI passes"
    - "Backup production database"
    - "Notify team and stakeholders"
    - "Verify monitoring dashboards are active"

  deployment:
    - "Run database migrations"
    - "Deploy new Docker images (rolling update)"
    - "Wait for health check to pass"
    - "Monitor error rates for 15 minutes"

  post-deployment:
    - "Verify feature flags are correct"
    - "Run smoke tests against production"
    - "Tag release in git"
    - "Publish release notes"
    - "Notify team of successful deployment"
```

### Hotfix Deployment

```yaml
steps:
  - "Create hotfix branch from main"
  - "Apply fix with tests"
  - "CI builds and tests"
  - "Manual approval from architect"
  - "Deploy to staging, run smoke tests"
  - "Deploy to production (immediate, no gradual)"
  - "Monitor closely for 30 minutes"
  - "Merge hotfix back to develop"
```

## Rollback Procedure

### Trigger Conditions

- Error rate increases > 1% above baseline
- p95 response time > 2x baseline
- Any P0 functionality broken
- Security vulnerability discovered
- Database migration failure

### Rollback Steps

```bash
# 1. Identify the rollback target
git tag                          # List available tags
git checkout v2.0.0              # Previous stable version

# 2. Run migration rollback
npm run migrate:down

# 3. Deploy previous Docker image
docker compose -f docker-compose.prod.yml up -d backend:2.0.0

# 4. Verify health
curl https://api.smartfood.com/health

# 5. Monitor
# Check error rates, response times, database performance

# 6. Communicate
# Notify team of rollback via Slack
```

**Target**: Complete rollback within 30 minutes.

## Docker Configuration

### Development Docker Compose

```yaml
version: '3.8'
services:
  backend:
    build:
      context: .
      dockerfile: backend/docker/Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - MONGODB_URI=mongodb://mongo:27017/smartfood
    volumes:
      - ./backend/src:/app/src
    depends_on:
      - mongo

  mongo:
    image: mongo:7
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db

volumes:
  mongo_data:
```

### Production Docker Compose

```yaml
version: '3.8'
services:
  backend:
    image: ghcr.io/smartfood/backend:2.1.0
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=${MONGODB_URI}
      - JWT_SECRET=${JWT_SECRET}
    deploy:
      replicas: 3
      update_config:
        parallelism: 1
        delay: 10s
        order: start-first
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

## Pre-Deployment Checklist

- [ ] Release branch CI passes all checks
- [ ] Database migrations written and tested (up + down)
- [ ] Database backup taken
- [ ] Environment variables configured
- [ ] Feature flags set correctly
- [ ] Monitoring dashboards active
- [ ] Rollback plan documented
- [ ] Stakeholders notified
- [ ] Deployment window confirmed
