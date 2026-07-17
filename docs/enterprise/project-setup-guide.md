# Project Setup Guide

## Prerequisites

### Required Software

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | 20.x LTS | JavaScript runtime |
| npm | 10.x | Package manager |
| Docker | 24.x | Containerization |
| Docker Compose | 2.x | Multi-container orchestration |
| MongoDB | 7.x | Database (or use Docker) |
| Expo CLI | Latest | React Native development |
| OpenCode CLI | Latest | AI development environment |
| Git | 2.x | Version control |

### Optional Tools

| Tool | Purpose |
|------|---------|
| MongoDB Compass | GUI for MongoDB |
| Postman/Insomnia | API testing |
| VS Code | Recommended IDE |
| React Native Debugger | Mobile debugging |
| EAS CLI | Expo build and submit |

## Environment Setup

### 1. Clone Repository

```bash
git clone <repository-url> smart_food
cd smart_food
```

### 2. Install Node.js

**Windows:**
- Download from https://nodejs.org/ (LTS version 20.x)
- Verify: `node --version` and `npm --version`

**macOS:**
```bash
brew install node@20
```

**Linux:**
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 3. Install Docker

**Windows:** Download Docker Desktop from https://www.docker.com/products/docker-desktop/

**macOS:** `brew install --cask docker`

**Linux:**
```bash
sudo apt-get install docker.io docker-compose-v2
```

### 4. Install OpenCode CLI

```bash
npm install -g @anthropic-ai/opencode
opencode --version
```

### 5. Install Expo CLI

```bash
npm install -g expo-cli
expo --version
```

## Project Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Node
NODE_ENV=development
PORT=3000

# MongoDB
MONGODB_URI=mongodb://localhost:27017/smartfood

# JWT
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d

# External Services
CLOUDINARY_URL=cloudinary://key:secret@cloud
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Mobile
EXPO_PUBLIC_API_URL=http://localhost:3000/api/v1
```

### 3. Start Infrastructure

```bash
docker compose up -d
```

This starts:
- MongoDB (port 27017)
- Mongo Express (port 8081) — optional admin UI

### 4. Verify Infrastructure

```bash
# Check Docker containers
docker compose ps

# Check MongoDB connection
docker compose exec mongo mongosh --eval "db.runCommand({ ping: 1 })"
```

### 5. Run Database Migrations

```bash
npm run migrate:up
```

### 6. Seed Development Data

```bash
npm run seed
```

### 7. Start Development Server

```bash
# Start backend
npm run dev:backend

# In another terminal, start mobile apps
npm run dev:customer     # Customer app
npm run dev:restaurant   # Restaurant app
npm run dev:admin        # Admin app
```

## Verify Setup

```bash
# Backend health check
curl http://localhost:3000/api/v1/health
# Expected: {"status":"healthy","uptime":...,"database":"connected"}

# API test
curl http://localhost:3000/api/v1/restaurants
# Expected: paginated list of seeded restaurants

# Run tests
npm test
# Expected: all tests passing

# Lint check
npm run lint
# Expected: zero errors, zero warnings

# TypeScript check
npm run typecheck
# Expected: zero errors
```

## Mobile App Setup

### iOS (macOS only)

```bash
# Install CocoaPods
sudo gem install cocoapods

# Install iOS dependencies
cd apps/customer/ios && pod install

# Run on iOS simulator
cd ../.. && npx expo run:ios
```

### Android

```bash
# Run on Android emulator
cd apps/customer
npx expo run:android

# Or build APK
npx eas build --platform android --profile preview
```

## Troubleshooting

### MongoDB Connection Issues

```bash
# Check if MongoDB is running
docker compose ps
docker compose logs mongo

# Restart MongoDB
docker compose restart mongo

# Check connection string
echo $MONGODB_URI
```

### npm Issues

```bash
# Clear npm cache
npm cache clean --force

# Delete and reinstall node_modules
rm -rf node_modules package-lock.json
npm install
```

### Expo Issues

```bash
# Clear Metro bundler cache
npx expo start -c

# Check for dependency issues
npx expo doctor --fix-dependencies
```

## OpenCode Environment

### Initialize OpenCode

```bash
# Load project context
opencode .opencode/PROJECT.md
opencode .opencode/WORKFLOW.md
opencode .opencode/RULES.md
opencode .opencode/AGENTS.md
```

### Activate Agents

```bash
# Planning phase
opencode .opencode/agents/planner.md

# Design phase
opencode .opencode/agents/architect.md

# Development phase
opencode .opencode/agents/backend.md
opencode .opencode/agents/customer-app.md

# Quality phase
opencode .opencode/agents/qa.md
opencode .opencode/agents/reviewer.md
```

## Development Workflow Commands

```bash
npm run dev          # Start all development servers
npm run build        # Build for production
npm test             # Run all tests
npm run lint         # Run ESLint
npm run typecheck    # Run TypeScript check
npm run migrate:up   # Run database migrations
npm run migrate:down # Rollback migrations
npm run seed         # Seed development data
```
