# Project Setup Guide

## Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | >= 20 LTS | JavaScript runtime |
| npm | >= 10 | Package manager |
| Docker | >= 24 | Container runtime |
| MongoDB | >= 7.x (or Docker) | Database |
| Git | >= 2.40 | Version control |
| Expo CLI | latest | React Native development |
| EAS CLI | latest | Mobile app builds |

## Initial Setup

### 1. Clone Repository

```bash
git clone <repository-url> smart_food
cd smart_food
```

### 2. Verify Prerequisites

```bash
node --version    # >= 20.x
npm --version     # >= 10.x
docker --version  # >= 24.x
git --version     # >= 2.40
```

### 3. Install Dependencies

```bash
# Root workspace (shared config)
npm install

# Backend
cd backend && npm install && cd ..

# Mobile apps
cd apps/customer && npm install && cd ../..
cd apps/restaurant && npm install && cd ../..
cd apps/admin && npm install && cd ../..
```

### 4. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your local configuration:

```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/smartfood_dev

# JWT
JWT_ACCESS_SECRET=your-access-secret
JWT_REFRESH_SECRET=your-refresh-secret
JWT_PUBLIC_KEY_PATH=./keys/public.pem

# External Services
STRIPE_SECRET_KEY=sk_test_...
GOOGLE_MAPS_API_KEY=...
CLOUDINARY_URL=cloudinary://...

# App
NODE_ENV=development
PORT=3000
CORS_ORIGIN=http://localhost:8081
```

### 5. Start Infrastructure

```bash
# Start MongoDB, Redis (if needed), and other services
docker compose up -d

# Verify
docker compose ps
```

### 6. Database Setup

```bash
cd backend

# Run migrations
npm run migrate:up

# Seed development data
npm run seed

# Verify
npm run db:check
```

### 7. Start Development Servers

```bash
# Terminal 1: Backend API
cd backend
npm run dev

# Terminal 2: Customer App
cd apps/customer
npx expo start

# Terminal 3: Restaurant App
cd apps/restaurant
npx expo start

# Terminal 4: Admin App
cd apps/admin
npx expo start
```

### 8. Verify Setup

```bash
# Health check
curl http://localhost:3000/api/v1/health
# Expected: {"status":"healthy","database":"connected",...}

# Run tests
cd backend && npm test
```

## Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | Yes | `development` | Runtime environment |
| `PORT` | No | `3000` | API server port |
| `MONGODB_URI` | Yes | — | MongoDB connection string |
| `JWT_ACCESS_SECRET` | Yes | — | Access token signing key |
| `JWT_REFRESH_SECRET` | Yes | — | Refresh token signing key |
| `STRIPE_SECRET_KEY` | No* | — | Stripe API key |
| `GOOGLE_MAPS_API_KEY` | No* | — | Google Maps API key |
| `CLOUDINARY_URL` | No* | — | Cloudinary connection URL |
| `CORS_ORIGIN` | No | `http://localhost:8081` | Allowed CORS origin |

*\* Required only if using the corresponding feature.*

## Docker Commands

```bash
# Start all services
docker compose up -d

# View logs
docker compose logs -f

# Restart a service
docker compose restart backend

# Stop all
docker compose down

# Rebuild
docker compose build --no-cache

# Production stack
docker compose -f docker-compose.prod.yml up -d
```

## Common Issues

### MongoDB Connection Refused

```bash
# Check if MongoDB is running
docker ps | grep mongo

# Restart MongoDB container
docker compose restart mongo

# Verify connection
docker compose exec mongo mongosh --eval "db.runCommand({ ping: 1 })"
```

### Port Already in Use

```bash
# Find process on port 3000
netstat -ano | findstr :3000

# Kill process
taskkill /PID <PID> /F
```

### Expo Build Fails

```bash
# Clear Metro cache
npx expo start -c

# Check Expo doctor
npx expo doctor --fix-dependencies

# Verify SDK compatibility
npx expo config
```

## Next Steps

- Read the [Architecture Guide](./architecture/architecture-guide.md)
- Review [Coding Standards](./standards/coding-standards.md)
- Set up your IDE with ESLint and Prettier extensions
- Read the [Development Workflow](./development-workflow.md)
