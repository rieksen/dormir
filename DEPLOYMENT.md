# Dormir Production Deployment Guide

Target architecture:

```
Frontend  →  Cloudflare Pages  (React + Vite)
Backend   →  Oracle Cloud VM   (Dockerized FastAPI)
Database  →  PostgreSQL 15+    (Docker or managed)
HTTPS     →  Nginx reverse proxy on VM → api.yourdomain.com
```

---

## Prerequisites

- Oracle Cloud VM (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed on the VM
- Domain with DNS pointing to the VM (API) and Cloudflare (frontend)
- Cloudflare Pages account

---

## 1. Backend — PostgreSQL + Docker

### Environment variables

Copy the example file and edit values:

```bash
cp backend/.env.example backend/.env
```

| Variable | Description | Example |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql+psycopg2://dormir:secret@db:5432/dormir` |
| `CORS_ORIGINS` | Comma-separated allowed frontend origins | `https://app.yourdomain.com` |
| `DEBUG` | Enable SQL echo / debug mode | `false` |

For Docker Compose, also set root-level variables (optional overrides):

| Variable | Default |
|---|---|
| `POSTGRES_USER` | `dormir` |
| `POSTGRES_PASSWORD` | `dormir` |
| `POSTGRES_DB` | `dormir` |
| `API_PORT` | `8000` |
| `CORS_ORIGINS` | `http://localhost:5173` |

### Build and run

```bash
# From project root
docker compose build
docker compose up -d
```

Verify:

```bash
curl http://localhost:8000/health
# {"status":"ok"}
```

### Database initialization

Tables are created automatically on startup via `create_db_and_tables()`.
The backend waits for PostgreSQL to become healthy before connecting.

To seed demo data (optional, run inside the app container):

```bash
docker compose exec app python seed_dormir.py
```

---

## 2. Oracle Cloud VM Setup

### Install Docker (Ubuntu)

```bash
sudo apt update
sudo apt install -y docker.io docker-compose-v2
sudo usermod -aG docker $USER
# Log out and back in
```

### Open firewall ports

In Oracle Cloud **Security Lists** / **Network Security Groups**, allow:

| Port | Purpose |
|---|---|
| 22 | SSH |
| 80 | HTTP (Nginx) |
| 443 | HTTPS (Nginx + TLS) |
| 8000 | Direct API access (optional; prefer Nginx on 443) |

On the VM with `ufw`:

```bash
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

### Deploy backend

```bash
git clone <your-repo> /opt/dormir
cd /opt/dormir

# Set production env
cp backend/.env.example backend/.env
# Edit: DATABASE_URL, CORS_ORIGINS=https://app.yourdomain.com, DEBUG=false

docker compose up -d --build
```

### Nginx reverse proxy

```bash
sudo apt install -y nginx
sudo cp deploy/nginx/dormir-api.conf /etc/nginx/sites-available/dormir-api
sudo ln -s /etc/nginx/sites-available/dormir-api /etc/nginx/sites-enabled/
# Edit server_name to your domain
sudo nginx -t && sudo systemctl reload nginx
```

### TLS with Let's Encrypt

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d api.yourdomain.com
```

---

## 3. Frontend — Cloudflare Pages

### Environment variables

Set in Cloudflare Pages dashboard → **Settings → Environment variables**:

| Variable | Production value |
|---|---|
| `VITE_API_URL` | `https://api.yourdomain.com` |

Local development uses `frontend/.env.development`:

```
VITE_API_URL=http://localhost:8000
```

### Build settings (Cloudflare Pages dashboard)

| Setting | Value |
|---|---|
| Framework preset | None (or Vite) |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Root directory | `frontend` |

Alternatively, use the included `frontend/wrangler.toml` as reference.

### SPA routing

The `frontend/public/_redirects` file ensures React Router works on Cloudflare Pages:

```
/* /index.html 200
```

### Local production build test

```bash
cd frontend
npm install
npm run build
# Verify dist/ contains index.html and _redirects
```

---

## 4. Production checklist

- [ ] `DATABASE_URL` points to PostgreSQL (no SQLite)
- [ ] `DEBUG=false` in production
- [ ] `CORS_ORIGINS` set to your Cloudflare Pages domain only
- [ ] `VITE_API_URL` set in Cloudflare Pages to your API domain
- [ ] Nginx proxying `https://api.yourdomain.com` → `localhost:8000`
- [ ] TLS certificates installed
- [ ] Health check passes: `curl https://api.yourdomain.com/health`
- [ ] Frontend loads and dashboard fetches data

---

## Troubleshooting

### Backend cannot connect to PostgreSQL

```bash
docker compose logs db
docker compose logs app
```

- Ensure `db` service is healthy: `docker compose ps`
- Check `DATABASE_URL` uses host `db` (Docker network name), not `localhost`, inside containers

### CORS errors in browser

- Verify `CORS_ORIGINS` includes the exact frontend origin (scheme + domain, no trailing slash)
- Restart backend after changing env: `docker compose up -d --force-recreate app`

### Frontend shows network errors

- Confirm `VITE_API_URL` is set in Cloudflare Pages (rebuild after changing)
- Check API is reachable: `curl https://api.yourdomain.com/health`

### Tables missing

Restart the app container to re-run startup migration:

```bash
docker compose restart app
```

### Nginx 502 Bad Gateway

- Confirm backend is running: `curl http://127.0.0.1:8000/health`
- Check Nginx error log: `sudo tail -f /var/log/nginx/error.log`

---

## File reference

| File | Purpose |
|---|---|
| `backend/database.py` | PostgreSQL engine config |
| `backend/Dockerfile` | Production backend image |
| `docker-compose.yml` | Backend + PostgreSQL stack |
| `deploy/nginx/dormir-api.conf` | Nginx reverse proxy |
| `frontend/public/_redirects` | SPA routing for Cloudflare |
| `frontend/.env.production` | Production API URL template |
| `frontend/.env.development` | Local dev API URL |
