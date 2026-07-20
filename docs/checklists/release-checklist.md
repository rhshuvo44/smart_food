# Release Checklist

## Pre-Release (24h before)

### Backend Checks
- [ ] Health endpoint responds `200 OK` at `/api/v1/health`
- [ ] Readiness endpoint responds `200 OK` at `/api/v1/ready`
- [ ] All database migrations applied successfully (no pending migrations)
- [ ] Rollback script for latest migration tested
- [ ] Environment variables verified in Railway dashboard:
  - [ ] `NODE_ENV=production`
  - [ ] `MONGODB_URI` points to production cluster
  - [ ] `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` set (min 32 chars)
  - [ ] `CORS_ORIGIN` includes all app domains
  - [ ] `STRIPE_*` keys are live (not test) keys
  - [ ] `SSLCOMMERZ_*` credentials are production credentials
  - [ ] Notification service keys (`SENDGRID_API_KEY`, `TWILIO_*`, `EXPO_ACCESS_TOKEN`) populated
  - [ ] `GOOGLE_MAPS_API_KEY` and `MAPBOX_ACCESS_TOKEN` are production keys
- [ ] SSL certificate valid and not expiring within 30 days
- [ ] Railway `railway.json` points to correct Dockerfile path
- [ ] Railway restart policy configured (`ON_FAILURE`, max 3 retries)
- [ ] Logging level set to `info` (not `debug`)
- [ ] Rate limiting configured on production endpoints
- [ ] Backup of production database completed
- [ ] Monitoring dashboards (Prometheus/Grafana) reachable

### Admin App Checks (`apps/admin/`)
- [ ] `eas.json` has correct EAS project ID
- [ ] `app.json` has correct app icon, splash screen, and version
- [ ] `app.json` has `expo-build-properties` plugin with correct SDK/build tool versions
- [ ] `app.json` has `updates` config with `checkAutomatically: "ON_LOAD"`
- [ ] `package.json` has all EAS build scripts
- [ ] `.env` has production `EXPO_PUBLIC_API_URL`
- [ ] Google Maps API key placeholder noted for replacement
- [ ] EAS Build succeeds with `development` profile
- [ ] QR code from development build verified on physical device
- [ ] All deep links (`smartfood-admin://`) work correctly

### Customer App Checks (`apps/customer/`)
- [ ] `eas.json` has correct EAS project ID
- [ ] `app.json` has correct app icon, splash screen, and version
- [ ] `app.json` has `expo-build-properties` plugin with correct SDK/build tool versions
- [ ] `app.json` has `expo-updates` plugin
- [ ] `app.json` has `updates` config with `checkAutomatically: "ON_LOAD"`
- [ ] `package.json` has all EAS build scripts
- [ ] `.env` has production `EXPO_PUBLIC_API_URL`
- [ ] Google Maps API key placeholder noted for replacement
- [ ] EAS Build succeeds with `development` profile
- [ ] QR code from development build verified on physical device
- [ ] All deep links (`smartfood://`) work correctly

### Restaurant App Checks (`apps/restaurant/`)
- [ ] `eas.json` has correct EAS project ID
- [ ] `app.json` has correct app icon, splash screen, and version
- [ ] `app.json` has `expo-build-properties` plugin with correct SDK/build tool versions
- [ ] `app.json` has `updates` config with `checkAutomatically: "ON_LOAD"`
- [ ] `package.json` has all EAS build scripts
- [ ] `.env` has production `EXPO_PUBLIC_API_URL`
- [ ] Google Maps API key placeholder noted for replacement
- [ ] EAS Build succeeds with `development` profile
- [ ] QR code from development build verified on physical device
- [ ] All deep links (`smartfood-restaurant://`) work correctly

### Shared Dependencies
- [ ] `@smartfood/shared` package builds without errors
- [ ] All three apps reference the latest `@smartfood/shared` version
- [ ] TypeScript compilation passes for all workspaces (`npm run build --workspaces`)
- [ ] No TypeScript errors in shared types used by all apps
- [ ] Zod validation schemas in shared package are backward-compatible

---

## Deployment Day

### Docker Image Build & Push
- [ ] Backend Docker image builds successfully: `docker build -f backend/docker/Dockerfile -t smartfood-backend:latest .`
- [ ] Image tagged with version + commit SHA: `smartfood-backend:<version>-<short-sha>`
- [ ] Image pushed to GitHub Container Registry (GHCR)
- [ ] `docker-compose.prod.yml` references correct image tag
- [ ] Docker Compose stack starts with no errors on staging
- [ ] Health checks pass for all services (nginx, mongodb, backend)
- [ ] Resource limits (CPU/memory) verified on all containers

### EAS Build — Android (all 3 apps)
- [ ] **Admin App**: `eas build --platform android --profile production` succeeds
- [ ] **Customer App**: `eas build --platform android --profile production` succeeds
- [ ] **Restaurant App**: `eas build --platform android --profile production` succeeds
- [ ] AAB artifacts downloaded and stored in releases
- [ ] AAB tested on physical Android device (via bundletool or internal testing track)

### EAS Build — iOS (all 3 apps)
- [ ] **Admin App**: `eas build --platform ios --profile production` succeeds
- [ ] **Customer App**: `eas build --platform ios --profile production` succeeds
- [ ] **Restaurant App**: `eas build --platform ios --profile production` succeeds
- [ ] IPA artifacts downloaded and stored in releases
- [ ] IPA tested on physical iOS device (via TestFlight or direct install)

### Backend Railway Deploy
- [ ] Latest backend Docker image deployed to Railway
- [ ] Railway deploy logs show no errors
- [ ] MongoDB connection established
- [ ] JWT signing/verification working
- [ ] Stripe/SslCommerz webhook endpoints reachable

### Smoke Tests
- [ ] **Admin App**: Login, dashboard load, order list, driver map
- [ ] **Customer App**: Browse restaurants, place order, track delivery
- [ ] **Restaurant App**: Login, view orders, update order status
- [ ] **API**: All CRUD endpoints respond correctly
- [ ] **WebSocket**: Real-time order updates delivered
- [ ] **Payments**: Test transaction with Stripe test mode
- [ ] **Push Notifications**: Trigger and verify delivery

### Health Checks
- [ ] Backend `/api/v1/health` returns healthy
- [ ] Backend `/api/v1/ready` returns ready
- [ ] nginx reverse proxy routes correctly
- [ ] MongoDB replica set healthy (if applicable)
- [ ] Prometheus targets all up
- [ ] Grafana dashboards rendering data

---

## Post-Release (48h)

### Monitoring
- [ ] Error rate < 0.1% across all endpoints (check Grafana)
- [ ] P95 latency < 500ms for API requests
- [ ] P95 latency < 2s for order placement flow
- [ ] No 5xx errors spiking
- [ ] Server CPU/memory usage within limits (< 80%)
- [ ] MongoDB connection pool not exhausted
- [ ] Disk usage trending normal (< 70%)

### Crash Reporting
- [ ] Crash-free rate > 99.5% for Android (all 3 apps)
- [ ] Crash-free rate > 99.5% for iOS (all 3 apps)
- [ ] No new ANR (Application Not Responding) reports
- [ ] No native crash stacks in Sentry/Crashlytics

### App Store Status
- [ ] Android build approved on Google Play Console (if new version)
- [ ] iOS build approved on App Store Connect (if new version)
- [ ] What's New / Release Notes published for all 3 apps
- [ ] In-app purchases/products updated (if any)

### Rollback Preparedness
- [ ] Previous Docker image tagged and available in GHCR
- [ ] Previous EAS build artifacts accessible
- [ ] Database rollback script tested and ready
- [ ] Railway can redeploy previous version with 1 click
- [ ] Rollback runbook reviewed by on-call engineer

---

## Emergency Rollback Procedure

If critical issues are detected during or after release:

1. **Backend**: Railway dashboard → Deploy → Rollback to previous stable deploy
2. **Android Apps**: Google Play Console → Release → Rollback to previous version
3. **iOS Apps**: App Store Connect → Build → Remove from销售 (or promote previous version)
4. **Database**: Run `npm run migrate:down` to revert the latest migration
5. **Communicate**: Post incident in #incidents channel, notify stakeholders

> **Sign-off**: Release Manager: \_\_\_\_\_\_\_\_\_\_\_\_\_\_ Date: \_\_\_\_\_\_\_\_\_\_\_\_\_\_
