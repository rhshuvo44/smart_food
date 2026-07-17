# Railway Deployment Guide

## Prerequisites

- GitHub repository with this codebase pushed
- [Railway](https://railway.app) account (GitHub login)
- [MongoDB Atlas](https://mongodb.com/atlas) free cluster (M0)

---

## 1. Create railway.json

Create `railway.json` at the project root:

```json
{
  "build": {
    "dockerfilePath": "backend/docker/Dockerfile"
  },
  "deploy": {
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 3
  }
}
```

This tells Railway to use the existing Dockerfile in `backend/docker/Dockerfile`, which already handles the monorepo build (shared package + backend compilation).

## 2. Push to GitHub

```bash
git add .
git commit -m "Add railway.json"
git push origin main
```

## 3. Create Railway Project

1. Go to [railway.app](https://railway.app) → **Dashboard**
2. Click **New Project** → **Deploy from GitHub repo**
3. Select your repository
4. Railway detects `railway.json` and auto-configures the Dockerfile path
5. The build starts automatically — it will fail initially because environment variables aren't set yet

## 4. Configure Environment Variables

In the Railway dashboard, go to your project → **Variables** and add:

| Variable | Value | Notes |
|----------|-------|-------|
| `NODE_ENV` | `production` | |
| `MONGODB_URI` | `mongodb+srv://<user>:<pass>@cluster0.xxxxx.mongodb.net/smartfood?retryWrites=true&w=majority` | From MongoDB Atlas |
| `JWT_ACCESS_SECRET` | `<random-64-char-hex>` | Run `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `JWT_REFRESH_SECRET` | `<different-random-64-char-hex>` | Same command, different output |
| `CORS_ORIGIN` | `*` | Restrict later to your app domains |
| `LOG_LEVEL` | `info` | |
| `CLIENT_URL` | `https://<your-project>.up.railway.app` | Public Railway URL |
| `APP_BASE_URL` | `https://<your-project>.up.railway.app` | Same as above |

**Optional** (can use placeholder defaults):

| Variable | Default |
|----------|---------|
| `STRIPE_SECRET_KEY` | `sk_test_placeholder` |
| `SSLCOMMERZ_STORE_ID` | `testbox` |
| `SSLCOMMERZ_STORE_PASSWORD` | `testbox123` |
| `GOOGLE_MAPS_API_KEY` | (empty) |
| `MAPBOX_ACCESS_TOKEN` | (empty) |

> Railway automatically injects a `PORT` variable — do NOT set it manually.

## 5. Deploy

Once variables are set, Railway will automatically redeploy. Monitor the **Deployments** tab for logs.

Expected successful output:
```
Server running on port <railway-port> in production mode
Health check: http://localhost:<port>/api/v1/health
```

## 6. Verify

```bash
curl https://<your-project>.up.railway.app/api/v1/health
# {"status":"ok","timestamp":"...","uptime":...}
```

Your Railway public URL is shown in the dashboard under **Settings** → **Domains**.

## 7. Connect Mobile Apps

Set the `EXPO_PUBLIC_API_URL` environment variable when building your mobile apps:

```bash
EXPO_PUBLIC_API_URL=https://<your-project>.up.railway.app/api/v1 eas build --platform android
```

---

## Updating Deployments

Push new commits to GitHub → Railway auto-deploys the `main` branch.

To manually redeploy: Railway dashboard → **Deployments** → **Redeploy**.

## Logs

```bash
# In Railway dashboard: Deployments → View logs
# Or using Railway CLI:
npm install -g @railway/cli
railway login
railway logs
```

## Environment Variable Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGODB_URI` | Yes | MongoDB Atlas connection string |
| `JWT_ACCESS_SECRET` | Yes | JWT access token signing key (min 32 chars) |
| `JWT_REFRESH_SECRET` | Yes | JWT refresh token signing key (min 32 chars) |
| `NODE_ENV` | Yes | Must be `production` |
| `CORS_ORIGIN` | No | Allowed CORS origins, comma-separated |
| `LOG_LEVEL` | No | `fatal`, `error`, `warn`, `info`, `debug`, `trace` |
| `STRIPE_SECRET_KEY` | No* | Stripe production secret key |
| `STRIPE_WEBHOOK_SECRET` | No* | Stripe webhook signing secret |
| `SSLCOMMERZ_STORE_ID` | No* | SSLCommerz store ID |
| `GOOGLE_MAPS_API_KEY` | No* | Google Maps API key |
| `MAPBOX_ACCESS_TOKEN` | No* | Mapbox access token |

*\* Required only if using the corresponding feature.*
