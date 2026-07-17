# Local Setup Guide

## Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | >= 20 | JavaScript runtime |
| npm | >= 10 | Package manager |
| Docker | >= 24 | MongoDB container (optional — see note) |
| Expo CLI | latest | React Native dev server |
| EAS CLI | latest | Mobile app builds |

> **MongoDB note:** The backend can run without Docker using `mongodb-memory-server` (auto-starts an in-memory MongoDB). For a persistent local DB, use Docker.

---

## 1. Install Dependencies

```bash
# From the monorepo root
npm install

# Build the shared package (required by backend & apps)
npm run build --workspace=shared
```

## 2. Start MongoDB

**Option A — Docker (recommended for persistent data):**

```bash
docker compose up -d
docker compose ps
```

**Option B — In-memory (no Docker needed):**

The dev server auto-starts a `mongodb-memory-server` when `MONGODB_URI` is not set. Skip this step entirely.

## 3. Configure Backend

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` minimally — defaults work for local dev. Key overrides you may want:

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/smart_food    # Only if using Docker MongoDB
CORS_ORIGIN=http://localhost:8081
```

## 4. Start Backend

```bash
cd backend
npm run dev
```

Expected output:
```
Server running on port 5000 in development mode
Health check: http://localhost:5000/api/v1/health
```

Verify:
```bash
curl http://localhost:5000/api/v1/health
# {"status":"ok","timestamp":"...","uptime":...}
```

## 5. Start Mobile Apps

Open separate terminals for each app:

```bash
# Customer App
cd apps/customer
npx expo start

# Restaurant App
cd apps/restaurant
npx expo start

# Admin App (also supports web)
cd apps/admin
npx expo start --web
```

Each will open the Expo dev tools in your browser. Scan the QR code with **Expo Go** (iOS/Android) or press `a` (Android emulator) / `i` (iOS simulator).

## 6. Set API URL for Apps

The apps default to `http://localhost:5000/api/v1`. To override:

```bash
# PowerShell
$env:EXPO_PUBLIC_API_URL="http://localhost:5000/api/v1"
npx expo start

# Bash
EXPO_PUBLIC_API_URL=http://localhost:5000/api/v1 npx expo start
```

Or create an `.env` file in each app directory:
```env
EXPO_PUBLIC_API_URL=http://localhost:5000/api/v1
```

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Port 5000 in use | Change `PORT` in `backend/.env` |
| Backend can't connect to MongoDB | Ensure Docker MongoDB is running or remove `MONGODB_URI` from `.env` to use in-memory DB |
| Metro bundler cache issues | `npx expo start -c` |
| App can't reach backend | Check `EXPO_PUBLIC_API_URL` matches the backend address |
| Module not found for `@smartfood/shared` | Run `npm run build --workspace=shared` from root |
