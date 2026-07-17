# Deployment Guide

Step-by-step guide for deploying the SmartFood platform to production.

---

## Prerequisites

| Tool  | Version  | Purpose                     |
|-------|----------|-----------------------------|
| Docker      | >= 24    | Container runtime           |
| Docker Compose | >= 2.24 | Orchestration            |
| Git         | >= 2.40  | Version control             |
| certbot     | latest   | SSL certificates (optional) |

---

## 1. Server Provisioning

### 1.1 Initial Setup (Ubuntu 24.04)

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
# Log out & back in for group changes to take effect

# Install Docker Compose plugin
sudo apt install -y docker-compose-plugin

# Verify
docker --version && docker compose version
```

### 1.2 Firewall

```bash
sudo ufw allow 22/tcp      # SSH
sudo ufw allow 80/tcp      # HTTP
sudo ufw allow 443/tcp     # HTTPS
sudo ufw --force enable
```

### 1.3 Directory Structure

```bash
sudo mkdir -p /opt/smartfood
sudo chown $USER:$USER /opt/smartfood
git clone <repository-url> /opt/smartfood
```

---

## 2. Environment Configuration

### 2.1 Create Production Environment File

```bash
cp /opt/smartfood/backend/.env.production /opt/smartfood/backend/.env
```

Edit `/opt/smartfood/backend/.env` with your production values:

```bash
nano /opt/smartfood/backend/.env
```

**Critical secrets to set:**
- `JWT_ACCESS_SECRET` — generate with `openssl rand -hex 32`
- `JWT_REFRESH_SECRET` — generate with `openssl rand -hex 32`
- `MONGODB_URI` — your MongoDB Atlas or external DB URI
- `STRIPE_SECRET_KEY` — from Stripe dashboard
- `CORS_ORIGIN` — your app domains

### 2.2 Set Docker Compose Variables

Create `/opt/smartfood/.env`:

```bash
cat > /opt/smartfood/.env << 'EOF'
MONGO_ROOT_USER=admin
MONGO_ROOT_PASSWORD=$(openssl rand -base64 24)
MONGODB_URI=mongodb://admin:<password>@mongodb:27017/smartfood?authSource=admin
JWT_ACCESS_SECRET=<hex-string>
JWT_REFRESH_SECRET=<hex-string>
CORS_ORIGIN=https://admin.smartfood.app
DOCKER_REGISTRY=ghcr.io
IMAGE_TAG=latest
EOF
```

> **Security:** Restrict permissions — `chmod 600 /opt/smartfood/.env`

---

## 3. SSL Certificate (Let's Encrypt)

```bash
sudo apt install -y certbot

# Obtain certificate
sudo certbot certonly --standalone -d api.smartfood.app

# Auto-renewal (certbot installs a systemd timer by default)
sudo certbot renew --dry-run
```

The nginx config in `infrastructure/nginx/nginx.conf` expects certificates at:
- `/etc/letsencrypt/live/api.smartfood.app/fullchain.pem`
- `/etc/letsencrypt/live/api.smartfood.app/privkey.pem`

---

## 4. Deploy

### 4.1 First-Time Deploy

```bash
cd /opt/smartfood

# Pull the latest Docker image
docker compose -f docker-compose.prod.yml pull

# Start all services
docker compose -f docker-compose.prod.yml up -d

# Check status
docker compose -f docker-compose.prod.yml ps

# View logs
docker compose -f docker-compose.prod.yml logs -f
```

### 4.2 Subsequent Deploys (via CD)

The GitHub Actions CD workflow (`.github/workflows/cd.yml`) automates this:

1. **Builds** the Docker image
2. **Pushes** to GitHub Container Registry
3. **SSH into server** and runs:
   ```bash
   cd /opt/smartfood
   docker compose -f docker-compose.prod.yml pull backend
   docker compose -f docker-compose.prod.yml up -d backend
   ```

To enable SSH deployment, add these secrets to GitHub:
- `SSH_PRIVATE_KEY` — private key for deploy user
- `SSH_HOST` — server IP or hostname
- `SSH_USER` — deploy username

Then uncomment the SSH step in `.github/workflows/cd.yml`.

### 4.3 Manual Deploy

```bash
cd /opt/smartfood

# Pull latest image
docker compose -f docker-compose.prod.yml pull backend

# Restart backend with zero-downtime
docker compose -f docker-compose.prod.yml up -d --no-deps --scale backend=2 backend
# Wait for health check
sleep 15
# Scale down old instance
docker compose -f docker-compose.prod.yml up -d --no-deps --scale backend=1 backend
```

---

## 5. Verify Deployment

### 5.1 Smoke Tests

```bash
# From the server itself
./scripts/smoke-test.sh http://localhost:3000

# Or from external
./scripts/smoke-test.sh https://api.smartfood.app
```

Expected output:
```
========================================
  SmartFood Smoke Tests
  Target: http://localhost:3000
========================================

  ✓ Health endpoint
  ✓ Ready endpoint
  ✓ 404 on unknown route
```

### 5.2 Manual Checks

```bash
# Health endpoint
curl https://api.smartfood.app/api/v1/health

# Check container logs
docker compose -f docker-compose.prod.yml logs --tail=50 backend

# Check resource usage
docker stats --no-stream
```

---

## 6. Monitoring

### 6.1 Prometheus

Prometheus runs as part of the production stack (see `docker-compose.prod.yml`).

Access the UI at `http://<server-ip>:9090` (bound to localhost only — use SSH tunnel).

### 6.2 Logging

```bash
# Follow all logs
docker compose -f docker-compose.prod.yml logs -f

# Follow backend logs only
docker compose -f docker-compose.prod.yml logs -f backend

# Last 100 lines with timestamps
docker compose -f docker-compose.prod.yml logs --tail=100 -t backend
```

### 6.3 Alerts

Configure alerts in Prometheus or use a SaaS tool:
- **Error rate > 1%** — PagerDuty / OpsGenie
- **p95 latency > 500ms** — Slack notification
- **Disk usage > 85%** — Ops ticket

---

## 7. Database Backups

### 7.1 Automated Backup (cron)

```bash
sudo crontab -e
# Add:
# 0 3 * * * docker exec smartfood-mongodb mongodump --username admin --password <pass> --out /data/db/backups/$(date +\%Y\%m\%d) && docker cp smartfood-mongodb:/data/db/backups/$(date +\%Y\%m\%d) /opt/smartfood/backups/
```

### 7.2 Restore

```bash
docker cp /opt/smartfood/backups/<date> smartfood-mongodb:/data/db/restore
docker exec smartfood-mongodb mongorestore --username admin --password <pass> /data/db/restore
```

---

## 8. Rollback

If a deployment fails:

```bash
cd /opt/smartfood

# Rollback to previous image tag
export IMAGE_TAG=<previous-sha>
docker compose -f docker-compose.prod.yml up -d backend
./scripts/smoke-test.sh
```

For the CD pipeline, re-run the previous successful workflow from GitHub Actions UI.

---

## 9. Troubleshooting

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| Backend won't start | MongoDB not ready | Check `docker compose logs mongodb`; ensure `depends_on.condition: service_healthy` |
| Health check failing | Missing env vars | Check `docker compose config` for env_file resolution |
| SSL errors | Cert expired | Run `sudo certbot renew` |
| Port 80/443 in use | nginx conflict | `sudo lsof -i :80` then stop conflicting service |
| Permission denied | Wrong user | Ensure `/etc/letsencrypt` is readable by the nginx container |
