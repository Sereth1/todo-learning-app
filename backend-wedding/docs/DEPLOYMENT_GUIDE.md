# Wedding App Deployment Guide

This guide covers deploying the Wedding Planner application on a self-hosted Linux server (Ubuntu/Debian) with:
- **Backend**: Django REST Framework + Gunicorn + Nginx
- **Frontend**: Next.js 15+ with Node.js + Nginx
- **Database**: PostgreSQL
- **SSL**: Let's Encrypt (Certbot)

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Server Setup](#server-setup)
3. [Backend Deployment](#backend-deployment)
4. [Frontend Deployment](#frontend-deployment)
5. [DNS Configuration](#dns-configuration)
6. [How It Works](#how-it-works)
7. [Maintenance & Troubleshooting](#maintenance--troubleshooting)

---

## Prerequisites

### Server Requirements
- Ubuntu 20.04+ or Debian 11+
- Root or sudo access
- At least 1GB RAM, 20GB storage
- Domain name with DNS access

### Software to Install
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install -y python3 python3-pip python3-venv git nginx postgresql postgresql-contrib certbot python3-certbot-nginx curl

# Install Node.js (v18+)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installations
python3 --version
node --version
npm --version
nginx -v
psql --version
```

---

## Server Setup

### 1. Create PostgreSQL Database

```bash
# Switch to postgres user
sudo -u postgres psql

# In PostgreSQL shell:
CREATE DATABASE wedding_planner_prod;
CREATE USER wedding_admin WITH PASSWORD 'YourSecurePassword123!';
GRANT ALL PRIVILEGES ON DATABASE wedding_planner_prod TO wedding_admin;
ALTER USER wedding_admin CREATEDB;  -- For running tests
\c wedding_planner_prod
GRANT ALL ON SCHEMA public TO wedding_admin;
\q
```

### 2. Create Directory Structure

```bash
sudo mkdir -p /var/www/todo-learning-app
sudo mkdir -p /var/www/wedding-frontend
sudo mkdir -p /var/log/gunicorn
```

---

## Backend Deployment

### Step 1: Clone/Copy Code to Server

```bash
cd /var/www/todo-learning-app

# Option A: Clone from Git
git clone https://github.com/Sereth1/todo-learning-app.git .

# Option B: Copy from local (run on local machine)
# scp -r /path/to/project root@your-server-ip:/var/www/todo-learning-app
```

### Step 2: Create Virtual Environment

```bash
cd /var/www/todo-learning-app
python3 -m venv venv
source venv/bin/activate
```

### Step 3: Install Dependencies

```bash
pip install --upgrade pip
pip install -r requirements.txt

# Make sure gunicorn is installed
pip install gunicorn
```

### Step 4: Create Environment File

```bash
nano /var/www/todo-learning-app/.env
```

Add the following content:

```env
# Deployment
DEPLOYMENT_ENV=prod
DEBUG=False
SECRET_KEY=your-super-secret-key-change-this-to-random-64-chars

# Allowed Hosts
ALLOWED_HOSTS=wedding-api.ncmulti.dev,localhost,127.0.0.1

# Database (PostgreSQL)
DB_NAME=wedding_planner_prod
DB_USER=wedding_admin
DB_PASSWORD=YourSecurePassword123!
DB_HOST=localhost
DB_PORT=5432

# CORS & CSRF (Frontend URLs)
CORS_ALLOWED_ORIGINS=https://wedding-app.ncmulti.dev
CORS_ORIGIN_WHITELIST=https://wedding-app.ncmulti.dev
CSRF_TRUSTED_ORIGINS=https://wedding-api.ncmulti.dev,https://wedding-app.ncmulti.dev

# Frontend URL (for email links, etc.)
FRONTEND_URL=https://wedding-app.ncmulti.dev

# Site Info
SITE_NAME=Wedding Planner
SITE_DOMAIN=wedding-api.ncmulti.dev

# Email (optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
DEFAULT_FROM_EMAIL=noreply@ncmulti.dev
```

### Step 5: Run Migrations & Collect Static

```bash
source venv/bin/activate
python manage.py migrate
python manage.py collectstatic --noinput

# Create superuser (optional)
python manage.py createsuperuser
```

### Step 6: Create Gunicorn Log Directory

```bash
sudo mkdir -p /var/log/gunicorn
sudo touch /var/log/gunicorn/wedding-access.log
sudo touch /var/log/gunicorn/wedding-error.log
sudo chown -R www-data:www-data /var/log/gunicorn
```

### Step 7: Create Systemd Service

```bash
sudo nano /etc/systemd/system/wedding-api.service
```

Add:

```ini
[Unit]
Description=Wedding Planner API (Gunicorn)
After=network.target postgresql.service

[Service]
User=www-data
Group=www-data
WorkingDirectory=/var/www/todo-learning-app
Environment="PATH=/var/www/todo-learning-app/venv/bin"
EnvironmentFile=/var/www/todo-learning-app/.env
ExecStart=/var/www/todo-learning-app/venv/bin/gunicorn config.wsgi:application --bind 127.0.0.1:8001 --workers 3 --access-logfile /var/log/gunicorn/wedding-access.log --error-logfile /var/log/gunicorn/wedding-error.log
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
```

### Step 8: Set Permissions & Start Service

```bash
sudo chown -R www-data:www-data /var/www/todo-learning-app
sudo systemctl daemon-reload
sudo systemctl enable wedding-api
sudo systemctl start wedding-api
sudo systemctl status wedding-api
```

### Step 9: Create Nginx Configuration

```bash
sudo nano /etc/nginx/sites-available/wedding-api
```

Add:

```nginx
server {
    listen 80;
    server_name wedding-api.ncmulti.dev;

    location / {
        proxy_pass http://127.0.0.1:8001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /static/ {
        alias /var/www/todo-learning-app/static/;
    }

    location /media/ {
        alias /var/www/todo-learning-app/media/;
    }
}
```

### Step 10: Enable Nginx Site & Get SSL

```bash
sudo ln -s /etc/nginx/sites-available/wedding-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Get SSL certificate
sudo certbot --nginx -d wedding-api.ncmulti.dev
```

### Step 11: Verify Backend

```bash
# Check service status
sudo systemctl status wedding-api

# Test locally
curl http://127.0.0.1:8001/api/

# Test via domain (after DNS is set up)
curl https://wedding-api.ncmulti.dev/api/
```

---

## Frontend Deployment

### Step 1: Copy Frontend Code to Server

```bash
# From your local machine
scp -r /path/to/wedding-frontend root@your-server-ip:/var/www/wedding-frontend

# Or clone from git
cd /var/www/wedding-frontend
git clone https://github.com/Sereth1/todo-learning-app.git temp
mv temp/wedding-frontend/* .
rm -rf temp
```

### Step 2: Create Environment File

```bash
nano /var/www/wedding-frontend/.env
```

Add:

```env
NEXT_PUBLIC_API_URL=https://wedding-api.ncmulti.dev/api
```

### Step 3: Install Dependencies & Build

```bash
cd /var/www/wedding-frontend
npm install
npm run build
```

### Step 4: Create Systemd Service

```bash
sudo nano /etc/systemd/system/wedding-frontend.service
```

Add:

```ini
[Unit]
Description=Wedding App Frontend (Next.js)
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=/var/www/wedding-frontend
Environment="NODE_ENV=production"
Environment="NEXT_PUBLIC_API_URL=https://wedding-api.ncmulti.dev/api"
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
```

### Step 5: Set Permissions & Start Service

```bash
sudo chown -R www-data:www-data /var/www/wedding-frontend
sudo systemctl daemon-reload
sudo systemctl enable wedding-frontend
sudo systemctl start wedding-frontend
sudo systemctl status wedding-frontend
```

### Step 6: Create Nginx Configuration

```bash
sudo nano /etc/nginx/sites-available/wedding-app
```

Add:

```nginx
server {
    listen 80;
    server_name wedding-app.ncmulti.dev;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

### Step 7: Enable Nginx Site & Get SSL

```bash
sudo ln -s /etc/nginx/sites-available/wedding-app /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Get SSL certificate
sudo certbot --nginx -d wedding-app.ncmulti.dev
```

---

## DNS Configuration

Add these A records in your domain's DNS settings:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | wedding-api | YOUR_SERVER_IP | 300 |
| A | wedding-app | YOUR_SERVER_IP | 300 |

**Note**: DNS propagation can take up to 48 hours, but usually completes within minutes.

---

## How It Works

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         INTERNET                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      NGINX (Port 80/443)                         │
│  ┌─────────────────────────┐  ┌─────────────────────────────┐   │
│  │ wedding-app.ncmulti.dev │  │ wedding-api.ncmulti.dev     │   │
│  │     (Frontend)          │  │     (Backend API)           │   │
│  └───────────┬─────────────┘  └───────────┬─────────────────┘   │
└──────────────│────────────────────────────│─────────────────────┘
               │                            │
               ▼                            ▼
┌──────────────────────────┐  ┌──────────────────────────────────┐
│   Next.js (Port 3000)    │  │   Gunicorn (Port 8001)           │
│   wedding-frontend.service│  │   wedding-api.service            │
│                          │  │                                  │
│   - React components     │  │   - Django REST Framework        │
│   - Server-side render   │  │   - JWT Authentication           │
│   - API calls to backend │  │   - Business logic               │
└──────────────────────────┘  └───────────────┬──────────────────┘
                                              │
                                              ▼
                              ┌──────────────────────────────────┐
                              │   PostgreSQL (Port 5432)          │
                              │   wedding_planner_prod database   │
                              └──────────────────────────────────┘
```

### Component Breakdown

#### 1. Nginx (Reverse Proxy)
- **What it does**: Receives all incoming HTTP/HTTPS requests
- **Why**: 
  - Handles SSL termination (HTTPS)
  - Routes requests to correct backend service
  - Serves static files efficiently
  - Load balancing (if needed)
- **How**: Uses `proxy_pass` to forward requests to internal services

#### 2. Gunicorn (WSGI Server)
- **What it does**: Runs the Django application
- **Why**: 
  - Django's built-in server is not production-ready
  - Handles multiple concurrent requests via workers
  - Manages process lifecycle
- **How**: Spawns multiple worker processes (we use 3) to handle requests

#### 3. Django REST Framework (Backend)
- **What it does**: Provides the API
- **Why**:
  - Handles authentication (JWT)
  - Business logic
  - Database operations
  - Data validation
- **Endpoints**: `/api/` prefix, e.g., `/api/wedding_planner/guests/`

#### 4. Next.js (Frontend)
- **What it does**: Renders the UI
- **Why**:
  - Server-side rendering for SEO and performance
  - React components for interactive UI
  - App Router for modern routing
- **How**: Runs as a Node.js server, makes API calls to backend

#### 5. PostgreSQL (Database)
- **What it does**: Stores all application data
- **Why**:
  - Production-ready, reliable
  - Supports complex queries
  - ACID compliant

#### 6. Systemd (Process Manager)
- **What it does**: Manages service lifecycle
- **Why**:
  - Auto-starts services on boot
  - Restarts services if they crash
  - Manages logs
- **Services**: `wedding-api.service`, `wedding-frontend.service`

#### 7. Certbot/Let's Encrypt (SSL)
- **What it does**: Provides free SSL certificates
- **Why**: HTTPS is required for security
- **How**: Auto-renews certificates before expiry

### Request Flow Example

1. User visits `https://wedding-app.ncmulti.dev/login`
2. Nginx receives request, forwards to Next.js (port 3000)
3. Next.js renders login page, sends HTML to browser
4. User submits login form
5. Next.js server action calls `https://wedding-api.ncmulti.dev/api/auth/login/`
6. Nginx receives API request, forwards to Gunicorn (port 8001)
7. Django validates credentials, returns JWT token
8. Frontend stores token, redirects to dashboard
9. Dashboard loads, fetches data from API with JWT in headers
10. User sees their wedding data

---

## Maintenance & Troubleshooting

### Common Commands

```bash
# Check service status
sudo systemctl status wedding-api
sudo systemctl status wedding-frontend
sudo systemctl status nginx
sudo systemctl status postgresql

# Restart services
sudo systemctl restart wedding-api
sudo systemctl restart wedding-frontend
sudo systemctl reload nginx

# View logs
sudo journalctl -u wedding-api -f          # Backend logs (live)
sudo journalctl -u wedding-frontend -f     # Frontend logs (live)
cat /var/log/gunicorn/wedding-error.log    # Gunicorn errors
sudo tail -f /var/log/nginx/error.log      # Nginx errors

# Test Nginx config
sudo nginx -t
```

### Updating the Application

#### Backend Update
```bash
cd /var/www/todo-learning-app
source venv/bin/activate
git pull origin main  # or copy new files

pip install -r requirements.txt
python manage.py migrate
python manage.py collectstatic --noinput

sudo systemctl restart wedding-api
```

#### Frontend Update
```bash
cd /var/www/wedding-frontend
git pull origin main  # or copy new files

npm install
npm run build

sudo systemctl restart wedding-frontend
```

### SSL Certificate Renewal

Certbot auto-renews, but you can test:
```bash
sudo certbot renew --dry-run
```

### Database Backup

```bash
# Backup
pg_dump -U wedding_admin wedding_planner_prod > backup_$(date +%Y%m%d).sql

# Restore
psql -U wedding_admin wedding_planner_prod < backup_file.sql
```

### Common Issues

| Issue | Solution |
|-------|----------|
| Service won't start | Check logs: `sudo journalctl -u SERVICE_NAME -n 50` |
| 502 Bad Gateway | Service crashed - restart it |
| Permission denied | Run `sudo chown -R www-data:www-data /var/www/...` |
| Database connection error | Check `.env` credentials, PostgreSQL status |
| CORS errors | Check `CORS_ALLOWED_ORIGINS` in backend `.env` |
| SSL not working | Run certbot again, check DNS |

---

## Quick Reference

### URLs
- **Frontend**: https://wedding-app.ncmulti.dev
- **Backend API**: https://wedding-api.ncmulti.dev/api/
- **API Docs**: https://wedding-api.ncmulti.dev/api/docs/
- **Admin**: https://wedding-api.ncmulti.dev/admin/

### Ports
| Service | Port | Internal Only? |
|---------|------|----------------|
| Nginx | 80, 443 | No (public) |
| Gunicorn (Django) | 8001 | Yes |
| Next.js | 3000 | Yes |
| PostgreSQL | 5432 | Yes |

### File Locations
| What | Where |
|------|-------|
| Backend code | `/var/www/todo-learning-app/` |
| Frontend code | `/var/www/wedding-frontend/` |
| Backend env | `/var/www/todo-learning-app/.env` |
| Frontend env | `/var/www/wedding-frontend/.env` |
| Gunicorn logs | `/var/log/gunicorn/` |
| Nginx configs | `/etc/nginx/sites-available/` |
| Systemd services | `/etc/systemd/system/` |
| SSL certificates | `/etc/letsencrypt/live/` |

---

*Last updated: December 2, 2025*
