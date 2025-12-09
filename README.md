# GroveMonitor

> **Unified observability platform for Grove Platform services**

**URL**: [monitor.grove.place](https://monitor.grove.place)

Single pane of glass for monitoring 9+ Cloudflare Workers, D1 databases, R2 buckets, and KV namespaces with real-time metrics, health checks, alerting, and cost tracking.

---

## 🎯 Features

- **Real-time Monitoring** - Metrics updated every 5 minutes
- **Health Checks** - Uptime tracking for all service endpoints
- **Email Alerts** - Resend-powered alerts for threshold breaches
- **Cost Tracking** - Estimate daily/monthly Cloudflare costs
- **Historical Data** - 90-day retention in D1
- **Beautiful Dashboard** - SvelteKit UI with Chart.js visualizations

---

## 📦 Project Structure

```
GroveMonitor/
├── packages/
│   ├── collector/        # Cron worker - data collection (every 5 min)
│   ├── api/              # API worker for dashboard
│   └── dashboard/        # SvelteKit UI (Cloudflare Pages)
├── migrations/           # D1 database schemas
├── shared/               # Shared TypeScript types & constants
└── docs/                 # Project documentation
```

**Monorepo**: Uses pnpm workspaces for dependency management

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 20+
- **pnpm** 8+
- **Cloudflare Account** with Workers, D1, KV, R2, and Pages enabled
- **Resend Account** for email alerts

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Set Up Cloudflare Resources

Create the required Cloudflare resources:

```bash
# Create D1 database
wrangler d1 create grove-monitor-db
# Copy the database_id and update wrangler.toml files

# Create KV namespace
wrangler kv:namespace create MONITOR_KV
# Copy the id and update wrangler.toml files

# Create R2 bucket (optional for snapshots)
wrangler r2 bucket create grove-monitor-snapshots
```

### 3. Run Database Migrations

```bash
# Run migrations on your D1 database
pnpm db:migrate
```

### 4. Configure Secrets

Copy the template and fill in your values:

```bash
cp secrets_template.json secrets.json
# Edit secrets.json with your API keys

# For local development
cp .dev.vars.example .dev.vars
# Edit .dev.vars with your values
```

**Set production secrets** (for deployed workers):

```bash
cd packages/collector
wrangler secret put CF_API_TOKEN
wrangler secret put CF_ACCOUNT_ID
wrangler secret put RESEND_API_KEY
wrangler secret put ALERT_EMAIL_TO

cd ../api
# API worker doesn't need secrets unless using auth
```

### 5. Local Development

```bash
# Run collector locally
pnpm dev:collector

# Run API locally
pnpm dev:api

# Run dashboard locally
pnpm dev:dashboard
```

### 6. Deploy

```bash
# Deploy all services
pnpm deploy:all

# Or deploy individually
pnpm deploy:collector
pnpm deploy:api
pnpm deploy:dashboard
```

### 7. Configure Custom Domain

In Cloudflare Dashboard:
1. Go to Pages → `grove-monitor`
2. Add custom domain: `monitor.grove.place`
3. DNS will auto-configure

---

## 📊 Monitored Services

### Workers (9)
- groveauth (auth.grove.place)
- scout (scout.grove.place)
- grove-domain-tool (domains.grove.place)
- autumnsgrove (autumnsgrove.dev)
- library-enhancer-api
- grove-backup-worker
- autumnsgrove-daily-summary (cron)
- autumnsgrove-sync-posts (cron)

### D1 Databases (9)
- groveauth, scout-db, grove-engine-db, grovemusic-db
- library-enhancer-db, autumnsgrove-posts, autumnsgrove-git-stats
- grove-domain-jobs, your-site-posts

### R2 Buckets (6)
- grove-cdn, grove-media, scout-results
- grovemusic-storage, autumnsgrove-images, library-enhancer-images

### KV Namespaces (7)
- SCOUT_CACHE, SESSIONS, grove-cache, CONFIG
- CACHE, autumnsgrove-CACHE_KV, RATE_LIMITS

---

## 🔔 Alert Configuration

Default alert thresholds (configurable in dashboard):

- **Error Rate**: Warning at 5%, Critical at 10%
- **Latency (p95)**: Warning at 500ms, Critical at 1000ms
- **Health Checks**: Critical on failure
- **D1 Size**: Warning at 8GB, Critical at 9.5GB (10GB limit)
- **Daily Cost**: Warning at $5, Critical at $10

Alerts are sent via **Resend email** to the configured address.

---

## 🛠️ Development

### Commands

```bash
# Development
pnpm dev:collector      # Run collector locally
pnpm dev:api            # Run API locally
pnpm dev:dashboard      # Run dashboard locally

# Build
pnpm build              # Build all packages

# Type checking
pnpm typecheck          # Check types in all packages

# Linting & Formatting
pnpm lint               # Lint all packages
pnpm format             # Format with Prettier

# Database
pnpm db:migrate         # Run D1 migrations

# Logs (production)
pnpm logs:collector     # Tail collector logs
pnpm logs:api           # Tail API logs

# Deploy
pnpm deploy:all         # Deploy everything
```

### Package Scripts

Each package has its own scripts:

```bash
cd packages/collector
pnpm dev                # Start dev server
pnpm deploy             # Deploy to Cloudflare
pnpm tail               # Tail production logs
```

---

## 📁 Package Details

### `packages/collector`
Cron worker that collects metrics every 5 minutes:
- Fetches worker analytics from Cloudflare APIs
- Performs health checks on all endpoints
- Queries D1/R2/KV stats
- Stores data in D1 and KV
- Sends alerts via Resend when thresholds are breached

### `packages/api`
API worker serving dashboard data:
- RESTful endpoints for metrics, health, alerts, costs
- Reads from D1 (historical) and KV (real-time)
- CORS-enabled for dashboard access
- Optional password protection

### `packages/dashboard`
SvelteKit dashboard UI:
- Overview page with service grid
- Detailed pages for workers, databases, storage
- Health/uptime tracking with 90-day grid
- Alert configuration and history
- Cost breakdown and projections
- Chart.js visualizations

---

## 🗄️ Database Schema

### Tables

- **metrics** - Time-series metrics (requests, errors, latency, CPU time)
- **health_checks** - Health check results with response times
- **d1_stats** - D1 database size and query counts
- **r2_stats** - R2 bucket object counts and sizes
- **incidents** - Alert history with resolution tracking
- **alert_thresholds** - Configurable alert rules
- **daily_aggregates** - Daily rollups for cost tracking

See `migrations/` for full schema.

---

## 🔐 Security

- **API Tokens**: Stored as Wrangler secrets, never committed
- **Secrets Template**: `secrets_template.json` for reference
- **Dev Vars**: `.dev.vars` for local development (gitignored)
- **Dashboard Auth**: Optional password protection via env var
- **CORS**: Restricted to monitor.grove.place in production

---

## 📈 Cost Estimation

GroveMonitor tracks usage and estimates costs based on:
- **Workers**: $0.15 per million requests (after free tier)
- **D1**: $0.75/GB storage, $0.001 per million reads
- **R2**: $0.015/GB storage, class A/B operations
- **KV**: $0.50 per million reads, $5.00 per million writes

Actual costs may vary. Check Cloudflare dashboard for precise billing.

---

## 🎨 Design System

### Colors

```css
--grove-primary: #10b981;      /* Emerald green */
--grove-secondary: #1e3a2c;    /* Dark forest */
--grove-accent: #34d399;       /* Light green */

--status-healthy: #22c55e;     /* Green */
--status-degraded: #f59e0b;    /* Orange */
--status-down: #ef4444;        /* Red */
```

---

## 📝 Implementation Phases

See `docs/SPEC.md` for detailed phases:

1. **Phase 1**: Core infrastructure (D1, KV, monorepo)
2. **Phase 2**: Data collection (Cloudflare APIs, cron)
3. **Phase 3**: API layer (endpoints, caching)
4. **Phase 4**: Dashboard UI (pages, charts)
5. **Phase 5**: Alerting (thresholds, Resend)
6. **Phase 6**: Polish (costs, uptime, mobile)

---

## 🤝 Contributing

This is a private Grove Platform project. See `AGENT.md` for Claude Code workflows and `AgentUsage/` for detailed guides.

---

## 📄 License

Private - Grove Platform Internal

---

**Built with**: TypeScript • SvelteKit • Cloudflare Workers • D1 • KV • R2 • Chart.js • TailwindCSS

**Powered by**: Cloudflare Pages

**Monitored**: 9 Workers • 9 D1 DBs • 6 R2 Buckets • 7 KV Namespaces
