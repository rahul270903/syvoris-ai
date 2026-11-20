# SYVORIS Ai™ — Zero-Cost (₹0) Staging Deployment Guide

This guide provides step-by-step instructions for deploying the complete **SYVORIS Ai™** enterprise platform to a 100% free-tier staging environment for manager review.

---

## 1. Zero-Cost (₹0) Target Architecture

```
┌───────────────────────────────────────┐
│        Manager / Reviewer Web         │
│                Browser                │
└───────────────────┬───────────────────┘
                    │
                    │ HTTPS (SPA Navigation)
                    ▼
┌───────────────────────────────────────┐
│         Cloudflare Pages              │
│       (100% Free Tier - ₹0)           │
│     React 18 + Vite + TypeScript      │
│  (Unlimited Bandwidth, SPA Redirects) │
└───────────────────┬───────────────────┘
                    │
                    │ Direct HTTPS REST API Requests + Bearer JWT
                    ▼
┌───────────────────────────────────────┐
│        Render Web Service             │
│       (100% Free Tier - ₹0)           │
│      FastAPI + Uvicorn (Python)       │
│       (750 Free Hours / Month)        │
└───────────────────┬───────────────────┘
                    │
                    │ Asyncpg Connection Pool (SSL Required)
                    ▼
┌───────────────────────────────────────┐
│         Neon Serverless DB            │
│       (100% Free Tier - ₹0)           │
│        PostgreSQL 16 Engine           │
│   (0.5 GiB Storage, Tenant RLS)       │
└───────────────────────────────────────┘
```

| Tier Component | Provider | Plan | Cost | Billing / Credit Card Required? |
|---|---|---|:---:|:---:|
| **Frontend** | Cloudflare Pages | Free Plan | **₹0** | **NO** (No credit card required) |
| **Backend** | Render | Free Web Service | **₹0** | **NO** (No credit card required) |
| **Database** | Neon | Free Serverless Postgres 16 | **₹0** | **NO** (No credit card required) |
| **Total** | — | — | **₹0** | **100% Free** |

---

## 2. Database: Neon Free PostgreSQL Setup

Neon provides a forever-free serverless PostgreSQL 16 database without requiring a credit card or subscription.

### Step 2.1: Create Free Database on Neon
1. Go to [neon.tech](https://neon.tech) and sign up with your GitHub account (`rahul270903`).
2. Click **Create Project**:
   - **Project Name:** `syvoris-staging`
   - **Postgres Version:** `16` (Default)
   - **Region:** `AWS US East (Ohio)` or `AWS US East (N. Virginia)` (Default)
3. On the Neon Console Dashboard, locate your **Connection Details**:
   - Select **Direct connection** (or pooled).
   - Copy the connection string. It will look like:
     ```text
     postgresql://<username>:<password>@ep-xxxxxx.us-east-2.aws.neon.tech/neondb?sslmode=require
     ```

### Step 2.2: Driver Compatibility
The SYVORIS Ai backend automatically detects and normalizes `postgresql://` and `postgres://` into `postgresql+asyncpg://`. No manual URL syntax edits are required.

### Step 2.3: Execute Migrations Against Neon Staging DB
Once you have the Neon connection string, apply the Alembic schema migrations directly from your local project root:

```powershell
cd D:\syvoris-ai\backend
$env:DATABASE_URL="postgresql://<user>:<password>@ep-xxxxxx.us-east-2.aws.neon.tech/neondb?sslmode=require"
.\venv\Scripts\python.exe -m alembic -c alembic.ini upgrade head
```

Verify the schema reached head:
```powershell
.\venv\Scripts\python.exe -m alembic -c alembic.ini current
# Output: 015_billing_subscriptions_and_metering (head)
```

---

## 3. Backend: Render Free Web Service Setup

Render provides 750 free instance hours per month, sufficient to run one Web Service continuously 24/7 without incurring charges.

### Step 3.1: Connect Repository to Render
1. Go to [dashboard.render.com](https://dashboard.render.com) and sign in with GitHub.
2. Click **New +** ➔ **Web Service**.
3. Select the repository `rahul270903/syvoris-ai` (branch: `main`).
4. Configure service parameters:
   - **Name:** `syvoris-api-staging`
   - **Region:** `Oregon (US West)` (or closest to your Neon database)
   - **Root Directory:** `backend`
   - **Runtime:** `Python 3`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT --workers 2 --proxy-headers`
   - **Instance Type:** **Free** ($0 / month)

### Step 3.2: Configure Backend Environment Variables
In the Render Web Service **Environment** tab, set:

| Variable Name | Staging Value | Purpose |
|---|---|---|
| `DATABASE_URL` | `postgresql://<user>:<password>@ep-xxxxxx.us-east-2.aws.neon.tech/neondb?sslmode=require` | Connection to Neon Free DB |
| `SECRET_KEY` | *(Generate via `openssl rand -hex 32`)* | JWT Signing Key |
| `ALGORITHM` | `HS256` | JWT Algorithm |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `120` | 2-hour session lifetime |
| `CORS_ORIGINS` | `https://syvoris-ai.pages.dev,http://localhost:5173` | Allowed frontend origins |
| `POSTGRES_RLS_ENABLED` | `true` | Enforce tenant isolation |
| `ENVIRONMENT` | `staging` | Staging mode |
| `PYTHONPATH` | `.` | Module resolution |

*(Alternatively, deploy via Render Blueprint using the included `render.yaml` which automatically configures these values on the Free plan).*

### Step 3.3: Verify Backend Health
Once Render completes building, verify the service is active:
```bash
curl -i https://syvoris-api-staging.onrender.com/api/v1/health
# Response: {"status":"ok","service":"syvoris-api"}

curl -i https://syvoris-api-staging.onrender.com/api/v1/health/ready
# Response: {"status":"ready","database":"connected"}
```

> [!NOTE]
> On Render's Free tier, services spin down after 15 minutes of inactivity. The first request after a period of inactivity may take ~30 seconds to spin up (cold start). Subsequent requests are instant.

---

## 4. Frontend: Cloudflare Pages Free Setup

Cloudflare Pages provides free hosting with unlimited bandwidth, global CDN caching, and zero cost.

### Step 4.1: Connect Repository to Cloudflare Pages
1. Go to [dash.cloudflare.com](https://dash.cloudflare.com) and log in.
2. In the sidebar, select **Workers & Pages** ➔ **Create application** ➔ **Pages** tab ➔ **Connect to Git**.
3. Select your GitHub account and choose `rahul270903/syvoris-ai` (branch: `main`).

### Step 4.2: Build Settings
In the Cloudflare Pages deployment configuration:
- **Project Name:** `syvoris-ai` (This assigns the default URL `https://syvoris-ai.pages.dev`)
- **Framework Preset:** `Vite`
- **Build Command:** `npm run build`
- **Build Output Directory:** `dist`
- **Root Directory:** *(leave blank / default)*

### Step 4.3: Environment Variables
Under **Environment Variables (Advanced)**, add:

| Variable Name | Value |
|---|---|
| `VITE_API_BASE_URL` | `https://syvoris-api-staging.onrender.com/api/v1` |

*(Note: Replace with your actual Render URL. Do not include a trailing slash; the client auto-normalizes it).*

### Step 4.4: Deploy & SPA Routing
Click **Save and Deploy**.
Cloudflare Pages will build the site and deploy to `https://syvoris-ai.pages.dev`.
Client-side routing is handled by `public/_redirects`:
```text
/*    /index.html   200
```
This ensures all 121 enterprise routes resolve without 404 errors.

---

## 5. Provisioning Marlon's Manager Review Account

Once the database and backend are connected, generate secure staging credentials for Marlon:

```powershell
cd D:\syvoris-ai\backend
$env:DATABASE_URL="postgresql://<user>:<password>@ep-xxxxxx.us-east-2.aws.neon.tech/neondb?sslmode=require"
.\venv\Scripts\python.exe scripts\provision_staging_account.py `
  --email "marlon@company.com" `
  --tenant-slug "bluepeak-innovations" `
  --tenant-name "BluePeak Innovations" `
  --first-name "Marlon" `
  --last-name "Reviewer" `
  --role "Tenant Owner" `
  --generate-password
```

This generates a high-entropy 20-character temporary password and securely binds the account to tenant Row-Level Security.

---

## 6. Pre-Handover Verification Checklist

- [ ] **Cloudflare Pages URL Active:** `https://syvoris-ai.pages.dev/login` loads cleanly with empty fields.
- [ ] **Backend Health Check:** `https://syvoris-api-staging.onrender.com/api/v1/health` returns `200 OK`.
- [ ] **DB Connectivity Check:** `https://syvoris-api-staging.onrender.com/api/v1/health/ready` returns `{"status":"ready","database":"connected"}`.
- [ ] **Manager Login:** Login with Marlon's provisioned credentials succeeds and loads the dashboard.
- [ ] **No Localhost Leaks:** DevTools Network tab confirms all API traffic targets the Render URL with HTTPS.
- [ ] **Tenant RLS:** Workspace top bar shows `Connected: BluePeak Innovations (Tenant Owner) - PostgreSQL Core Active`.
- [ ] **Cost Check:** All three dashboards (Cloudflare, Render, Neon) confirm **$0.00 / Free Tier Active**.
