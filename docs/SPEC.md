# GroveMonitor - Unified Observability Platform

## Project Overview

**Name:** GroveMonitor  
**URL:** `monitor.grove.place`  
**Purpose:** Unified dashboard for monitoring all Grove Platform services  
**Stack:** SvelteKit + Cloudflare Workers + D1 + KV + R2

---

## 🎯 Goals

1. **Single pane of glass** for all 9+ Grove workers and services
2. **Real-time metrics** with historical data retention
3. **Alerting** via webhook (Discord/Slack) when things break
4. **Cost tracking** across D1, R2, KV, Workers
5. **Health checks** with uptime monitoring
6. **Beautiful dashboard** that's actually useful

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            GroveMonitor System                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│  grove-monitor   │     │  grove-monitor   │     │  monitor.grove   │
│     -collector   │────▶│       -api       │────▶│     .place       │
│    (Cron Worker) │     │    (API Worker)  │     │   (Dashboard)    │
└────────┬─────────┘     └────────┬─────────┘     └──────────────────┘
         │                        │
         │ Collects from:         │ Stores in:
         │                        │
         ▼                        ▼
┌──────────────────┐     ┌──────────────────┐
│ Cloudflare APIs  │     │  grove-monitor   │
│ • Analytics API  │     │      -db (D1)    │
│ • D1 API         │     │                  │
│ • R2 API         │     │  MONITOR_KV      │
│ • Workers API    │     │  (real-time)     │
│                  │     │                  │
│ Health Checks:   │     │  grove-monitor   │
│ • All *.grove.   │     │   -snapshots     │
│   place sites    │     │      (R2)        │
└──────────────────┘     └──────────────────┘

Data Flow:
1. Collector runs every 5 minutes (cron)
2. Fetches metrics from CF APIs + health checks all endpoints
3. Stores time-series in D1, real-time in KV
4. Dashboard reads from API worker
5. Alerts sent via webhook on threshold breaches
```

---

## 📦 Project Structure

```
GroveMonitor/
├── packages/
│   ├── collector/              # Cron worker - data collection
│   │   ├── src/
│   │   │   ├── index.ts        # Main scheduled handler
│   │   │   ├── collectors/
│   │   │   │   ├── cloudflare-analytics.ts
│   │   │   │   ├── d1-metrics.ts
│   │   │   │   ├── r2-metrics.ts
│   │   │   │   ├── kv-metrics.ts
│   │   │   │   └── health-checks.ts
│   │   │   ├── alerting/
│   │   │   │   ├── webhook.ts
│   │   │   │   └── thresholds.ts
│   │   │   └── types.ts
│   │   └── wrangler.toml
│   │
│   ├── api/                    # API worker for dashboard
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── routes/
│   │   │   │   ├── metrics.ts
│   │   │   │   ├── health.ts
│   │   │   │   ├── alerts.ts
│   │   │   │   └── costs.ts
│   │   │   └── middleware/
│   │   │       └── auth.ts     # Optional: protect dashboard
│   │   └── wrangler.toml
│   │
│   └── dashboard/              # SvelteKit dashboard UI
│       ├── src/
│       │   ├── routes/
│       │   │   ├── +page.svelte           # Overview
│       │   │   ├── workers/+page.svelte   # Worker details
│       │   │   ├── databases/+page.svelte # D1 metrics
│       │   │   ├── storage/+page.svelte   # R2/KV metrics
│       │   │   ├── health/+page.svelte    # Uptime/health
│       │   │   ├── alerts/+page.svelte    # Alert config
│       │   │   └── costs/+page.svelte     # Cost breakdown
│       │   ├── lib/
│       │   │   ├── components/
│       │   │   │   ├── MetricCard.svelte
│       │   │   │   ├── SparklineChart.svelte
│       │   │   │   ├── StatusBadge.svelte
│       │   │   │   ├── TimeSeriesChart.svelte
│       │   │   │   └── ServiceGrid.svelte
│       │   │   ├── stores/
│       │   │   │   └── metrics.ts
│       │   │   └── api.ts
│       │   └── app.html
│       ├── static/
│       └── wrangler.toml
│
├── migrations/                 # D1 schema
│   ├── 001_initial_schema.sql
│   └── 002_alerts_config.sql
│
├── shared/                     # Shared types/utils
│   ├── types.ts
│   └── constants.ts
│
├── package.json
├── pnpm-workspace.yaml
└── README.md
```

---

## 🗄️ Database Schema (D1)

```sql
-- migrations/001_initial_schema.sql

-- Time-series metrics storage
CREATE TABLE metrics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  service_name TEXT NOT NULL,           -- 'groveauth', 'scout', etc.
  metric_type TEXT NOT NULL,            -- 'requests', 'errors', 'latency_p95', etc.
  value REAL NOT NULL,
  unit TEXT,                            -- 'count', 'ms', 'bytes', 'percent'
  recorded_at INTEGER NOT NULL,         -- Unix timestamp
  metadata TEXT                         -- JSON for extra context
);

CREATE INDEX idx_metrics_service_time ON metrics(service_name, recorded_at DESC);
CREATE INDEX idx_metrics_type_time ON metrics(metric_type, recorded_at DESC);

-- Health check results
CREATE TABLE health_checks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  endpoint TEXT NOT NULL,               -- 'https://scout.grove.place'
  status_code INTEGER,
  response_time_ms INTEGER,
  is_healthy INTEGER NOT NULL,          -- 0 or 1
  error_message TEXT,
  checked_at INTEGER NOT NULL
);

CREATE INDEX idx_health_endpoint_time ON health_checks(endpoint, checked_at DESC);

-- D1 database stats
CREATE TABLE d1_stats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  database_name TEXT NOT NULL,
  database_id TEXT NOT NULL,
  size_bytes INTEGER,
  rows_read INTEGER,
  rows_written INTEGER,
  recorded_at INTEGER NOT NULL
);

CREATE INDEX idx_d1_stats_db_time ON d1_stats(database_name, recorded_at DESC);

-- R2 bucket stats
CREATE TABLE r2_stats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  bucket_name TEXT NOT NULL,
  object_count INTEGER,
  total_size_bytes INTEGER,
  recorded_at INTEGER NOT NULL
);

CREATE INDEX idx_r2_stats_bucket_time ON r2_stats(bucket_name, recorded_at DESC);

-- Incidents/alerts history
CREATE TABLE incidents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  service_name TEXT NOT NULL,
  severity TEXT NOT NULL,               -- 'critical', 'warning', 'info'
  title TEXT NOT NULL,
  description TEXT,
  triggered_at INTEGER NOT NULL,
  resolved_at INTEGER,
  acknowledged_by TEXT
);

CREATE INDEX idx_incidents_service ON incidents(service_name, triggered_at DESC);
CREATE INDEX idx_incidents_open ON incidents(resolved_at) WHERE resolved_at IS NULL;

-- migrations/002_alerts_config.sql

-- Alert threshold configuration
CREATE TABLE alert_thresholds (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  service_name TEXT NOT NULL,           -- '*' for global
  metric_type TEXT NOT NULL,
  operator TEXT NOT NULL,               -- 'gt', 'lt', 'eq'
  threshold_value REAL NOT NULL,
  severity TEXT NOT NULL,
  enabled INTEGER DEFAULT 1,
  webhook_url TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Daily aggregated stats (for cost tracking)
CREATE TABLE daily_aggregates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,                   -- 'YYYY-MM-DD'
  service_name TEXT NOT NULL,
  total_requests INTEGER DEFAULT 0,
  total_errors INTEGER DEFAULT 0,
  total_d1_reads INTEGER DEFAULT 0,
  total_d1_writes INTEGER DEFAULT 0,
  total_r2_reads INTEGER DEFAULT 0,
  total_r2_writes INTEGER DEFAULT 0,
  total_kv_reads INTEGER DEFAULT 0,
  total_kv_writes INTEGER DEFAULT 0,
  estimated_cost_usd REAL DEFAULT 0,
  UNIQUE(date, service_name)
);

CREATE INDEX idx_daily_date ON daily_aggregates(date DESC);
```

---

## ⚡ KV Schema (Real-time Data)

```typescript
// Key patterns for real-time metrics in KV

// Current status per service (updated every 5 min)
// Key: `status:{service_name}`
// TTL: 10 minutes
interface ServiceStatus {
  service: string;
  status: 'healthy' | 'degraded' | 'down';
  lastCheck: number;
  latencyMs: number;
  errorRate: number;
  requestsPerMin: number;
}

// Latest metrics snapshot
// Key: `metrics:latest:{service_name}`
// TTL: 10 minutes
interface LatestMetrics {
  requests: number;
  errors: number;
  p50Latency: number;
  p95Latency: number;
  p99Latency: number;
  cpuTime: number;
  timestamp: number;
}

// Active incidents
// Key: `incidents:active`
// No TTL - manually managed
interface ActiveIncidents {
  incidents: Array<{
    id: number;
    service: string;
    severity: string;
    title: string;
    triggeredAt: number;
  }>;
}

// System overview (for dashboard home)
// Key: `overview:current`
// TTL: 5 minutes
interface SystemOverview {
  totalServices: number;
  healthyServices: number;
  degradedServices: number;
  downServices: number;
  totalRequestsToday: number;
  totalErrorsToday: number;
  activeIncidents: number;
  lastUpdated: number;
}
```

---

## 🔌 Services to Monitor

### Workers (9)

| Service | Endpoint | Health Check Path |
|---------|----------|-------------------|
| groveauth | auth.grove.place | /health |
| scout | scout.grove.place | /health |
| grove-domain-tool | domains.grove.place | /health |
| autumnsgrove | autumnsgrove.dev | / |
| autumnsgrove-daily-summary | (cron only) | N/A |
| autumnsgrove-sync-posts | (cron only) | N/A |
| library-enhancer-api | (API) | /health |
| grove-backup-worker | (cron only) | /status |

### D1 Databases (9)

| Database | ID |
|----------|-----|
| groveauth | 45eae4c7-8ae7-4078-9218-8e1677a4360f |
| scout-db | 6a289378-c662-4c6a-9f1b-fa5296e03fa2 |
| grove-engine-db | a6394da2-b7a6-48ce-b7fe-b1eb3e730e68 |
| grovemusic-db | e1e31ed2-3b1f-4dbd-9435-c9105dadcfa2 |
| library-enhancer-db | afd1ce4c-618a-430a-bf0f-0a57647a388d |
| autumnsgrove-posts | 510badf3-457a-4892-bf2a-45d4bfd7a7bb |
| autumnsgrove-git-stats | 0ca4036f-93f7-4c8a-98a5-5353263acd44 |
| grove-domain-jobs | cd493112-a901-4f6d-aadf-a5ca78929557 |
| your-site-posts | 86342742-7d34-486f-97f0-928136555e1a |

### R2 Buckets (6)

| Bucket | Purpose |
|--------|---------|
| grove-cdn | CDN assets |
| grove-media | User uploads |
| scout-results | Search cache |
| grovemusic-storage | Audio files |
| autumnsgrove-images | Blog images |
| library-enhancer-images | Library assets |

### KV Namespaces (7)

| Namespace | ID |
|-----------|-----|
| SCOUT_CACHE | 31eb5622c7fd41ec8fc8c8f939f5099b |
| SESSIONS | 46c5fb1dd2d04385a7e624b2e4730ad6 |
| grove-cache | 514e91e81cc44d128a82ec6f668303e4 |
| CONFIG | 6488be12cf90402caf6ced7bf156ad6c |
| CACHE | 677a09cfeb5c4afe9bac24240c1fcc6d |
| autumnsgrove-CACHE_KV | 6bc72b16c721401e8b9a848a7ae4e0ca |
| RATE_LIMITS | d5c976093f344aba948f77f37d29194a |

---

## 📊 Metrics to Collect

### Per Worker (from CF Analytics API)
- `requests_total` - Total requests
- `requests_success` - 2xx responses
- `requests_error` - 4xx/5xx responses
- `error_rate` - Percentage of errors
- `latency_p50` - 50th percentile latency
- `latency_p95` - 95th percentile latency
- `latency_p99` - 99th percentile latency
- `cpu_time_avg` - Average CPU time per request
- `duration_avg` - Average wall-clock time

### Per D1 Database
- `size_bytes` - Database file size
- `rows_read` - Total rows read
- `rows_written` - Total rows written
- `query_count` - Number of queries

### Per R2 Bucket
- `object_count` - Number of objects
- `total_size_bytes` - Total storage used
- `class_a_ops` - PUT/POST/LIST operations
- `class_b_ops` - GET operations

### Per KV Namespace
- `read_count` - Number of reads
- `write_count` - Number of writes
- `delete_count` - Number of deletes
- `list_count` - Number of list operations

### System-wide
- `total_cost_estimate_usd` - Estimated daily/monthly cost
- `uptime_percentage` - Overall platform uptime
- `active_incidents` - Current open incidents

---

## 🚨 Alerting Configuration

### Default Thresholds

```typescript
const DEFAULT_THRESHOLDS = [
  // Error rate alerts
  { metric: 'error_rate', operator: 'gt', value: 5, severity: 'warning' },
  { metric: 'error_rate', operator: 'gt', value: 10, severity: 'critical' },
  
  // Latency alerts
  { metric: 'latency_p95', operator: 'gt', value: 500, severity: 'warning' },
  { metric: 'latency_p95', operator: 'gt', value: 1000, severity: 'critical' },
  
  // Health check alerts
  { metric: 'health_check', operator: 'eq', value: 0, severity: 'critical' },
  
  // D1 size alerts (approaching 10GB limit)
  { metric: 'd1_size_bytes', operator: 'gt', value: 8_000_000_000, severity: 'warning' },
  { metric: 'd1_size_bytes', operator: 'gt', value: 9_500_000_000, severity: 'critical' },
  
  // Cost alerts
  { metric: 'daily_cost_usd', operator: 'gt', value: 5, severity: 'warning' },
  { metric: 'daily_cost_usd', operator: 'gt', value: 10, severity: 'critical' },
];
```

### Webhook Payload

```typescript
interface AlertWebhookPayload {
  type: 'alert';
  severity: 'critical' | 'warning' | 'info';
  service: string;
  metric: string;
  currentValue: number;
  threshold: number;
  title: string;
  description: string;
  timestamp: string;
  dashboardUrl: string;
}

// Discord webhook format
const discordPayload = {
  embeds: [{
    title: `🚨 ${alert.severity.toUpperCase()}: ${alert.title}`,
    description: alert.description,
    color: alert.severity === 'critical' ? 0xff0000 : 0xffaa00,
    fields: [
      { name: 'Service', value: alert.service, inline: true },
      { name: 'Metric', value: alert.metric, inline: true },
      { name: 'Value', value: `${alert.currentValue} (threshold: ${alert.threshold})`, inline: true },
    ],
    timestamp: alert.timestamp,
  }],
};
```

---

## 🎨 Dashboard UI Specifications

### Pages

#### 1. Overview (`/`)
- **Hero Stats**: Total services, healthy/degraded/down counts
- **Service Grid**: Card per service with status badge, sparkline, key metric
- **Active Incidents**: List of unresolved alerts
- **24h Summary**: Requests, errors, cost estimate
- **Quick Actions**: Links to each service's detail page

#### 2. Workers (`/workers`)
- **Table View**: All workers with sortable columns
- **Per-Worker Detail** (`/workers/[name]`):
  - Request volume chart (24h, 7d, 30d toggles)
  - Error rate chart
  - Latency distribution
  - Recent errors log
  - CPU time breakdown

#### 3. Databases (`/databases`)
- **D1 Overview**: All databases with size, read/write counts
- **Per-Database Detail** (`/databases/[name]`):
  - Size over time
  - Read/write trends
  - Query patterns
  - Table breakdown (if available)

#### 4. Storage (`/storage`)
- **R2 Buckets**: Object count, size, operations
- **KV Namespaces**: Read/write patterns
- **Combined storage cost estimate

#### 5. Health (`/health`)
- **Uptime Grid**: 90-day uptime per service (GitHub-style grid)
- **Response Time History**: Line chart per endpoint
- **Recent Incidents**: Timeline view

#### 6. Alerts (`/alerts`)
- **Active Alerts**: Current incidents
- **Alert History**: Past alerts with resolution time
- **Configuration**: Threshold management UI
- **Webhook Setup**: Discord/Slack URL config

#### 7. Costs (`/costs`)
- **Daily Cost Breakdown**: Stacked bar chart by resource type
- **Monthly Projection**: Based on current usage
- **Per-Service Costs**: Which services cost the most
- **Optimization Tips**: Suggestions based on usage patterns

### Design System

```css
/* Color palette - Grove theme */
--grove-primary: #10b981;      /* Emerald green */
--grove-secondary: #1e3a2c;    /* Dark forest */
--grove-accent: #34d399;       /* Light green */
--grove-bg: #f8fafc;           /* Light gray */
--grove-card: #ffffff;
--grove-text: #1e293b;
--grove-muted: #64748b;

/* Status colors */
--status-healthy: #22c55e;
--status-degraded: #f59e0b;
--status-down: #ef4444;
--status-unknown: #6b7280;

/* Severity colors */
--severity-critical: #dc2626;
--severity-warning: #f59e0b;
--severity-info: #3b82f6;
```

---

## 🔐 Environment Variables

### Collector Worker

```toml
# wrangler.toml for collector

[vars]
# Cloudflare API access (for analytics)
CF_API_TOKEN = "..." # Needs: Analytics:Read, D1:Read, R2:Read, Workers:Read
CF_ACCOUNT_ID = "..."

# Alerting
DISCORD_WEBHOOK_URL = "..."
ALERT_ENABLED = "true"

# Collection interval
COLLECTION_INTERVAL_MINUTES = "5"
```

### API Worker

```toml
# wrangler.toml for api

[vars]
# Optional: Protect dashboard with password
DASHBOARD_PASSWORD = "..."  # Leave empty for public access
```

---

## 📡 API Endpoints

### Collector (internal, cron-triggered)

```
POST /collect          # Manually trigger collection
GET  /status           # Collector health
```

### API (for dashboard)

```
# Overview
GET  /api/overview                    # System summary
GET  /api/services                    # All services list

# Metrics
GET  /api/metrics/:service            # Metrics for specific service
GET  /api/metrics/:service/history    # Historical data
     ?metric=requests&period=24h

# Health
GET  /api/health                      # All health checks
GET  /api/health/:endpoint            # Specific endpoint history

# D1
GET  /api/d1                          # All D1 stats
GET  /api/d1/:database                # Specific database

# R2
GET  /api/r2                          # All R2 stats
GET  /api/r2/:bucket                  # Specific bucket

# KV
GET  /api/kv                          # All KV stats

# Alerts
GET  /api/alerts                      # Active alerts
GET  /api/alerts/history              # Past alerts
POST /api/alerts/acknowledge/:id      # Acknowledge alert
GET  /api/alerts/thresholds           # Get thresholds
PUT  /api/alerts/thresholds/:id       # Update threshold

# Costs
GET  /api/costs/daily                 # Daily breakdown
GET  /api/costs/monthly               # Monthly summary
GET  /api/costs/projection            # Future projection
```

---

## 🚀 Deployment

### GitHub Actions Workflow

```yaml
name: Deploy GroveMonitor

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
  CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm typecheck
      
      # Deploy collector
      - name: Deploy Collector
        run: |
          cd packages/collector
          pnpm wrangler deploy
      
      # Deploy API
      - name: Deploy API
        run: |
          cd packages/api
          pnpm wrangler deploy
      
      # Deploy Dashboard
      - name: Deploy Dashboard
        run: |
          cd packages/dashboard
          pnpm build
          pnpm wrangler pages deploy .svelte-kit/cloudflare --project-name=grove-monitor
```

### DNS Setup

```
monitor.grove.place  CNAME  grove-monitor.pages.dev
```

---

## 📋 Implementation Phases

### Phase 1: Core Infrastructure (Week 1)
- [ ] Create D1 database `grove-monitor-db`
- [ ] Create KV namespace `MONITOR_KV`
- [ ] Set up monorepo structure
- [ ] Implement collector worker with health checks
- [ ] Basic metrics storage

### Phase 2: Data Collection (Week 1-2)
- [ ] Cloudflare Analytics API integration
- [ ] D1 metrics collection
- [ ] R2 metrics collection
- [ ] KV metrics collection
- [ ] Cron scheduling (every 5 min)

### Phase 3: API Layer (Week 2)
- [ ] Implement all API endpoints
- [ ] Add caching with KV
- [ ] Historical data queries
- [ ] Cost calculation logic

### Phase 4: Dashboard UI (Week 2-3)
- [ ] Overview page with service grid
- [ ] Workers detail pages
- [ ] Databases page
- [ ] Storage page
- [ ] Charts and visualizations

### Phase 5: Alerting (Week 3)
- [ ] Threshold configuration
- [ ] Discord webhook integration
- [ ] Alert history tracking
- [ ] Incident management UI

### Phase 6: Polish (Week 3-4)
- [ ] Cost tracking page
- [ ] Health/uptime page
- [ ] Mobile responsive design
- [ ] Performance optimization
- [ ] Documentation

---

## 🔧 Development Commands

```bash
# Install dependencies
pnpm install

# Run collector locally
cd packages/collector && pnpm dev

# Run API locally
cd packages/api && pnpm dev

# Run dashboard locally
cd packages/dashboard && pnpm dev

# Deploy all
pnpm deploy:all

# Run migrations
pnpm db:migrate

# Tail logs
pnpm logs:collector
pnpm logs:api
```

---

## 📚 External Dependencies

```json
{
  "dependencies": {
    "@sveltejs/kit": "^2.0.0",
    "@sveltejs/adapter-cloudflare": "^4.0.0",
    "chart.js": "^4.4.0",
    "date-fns": "^3.0.0"
  },
  "devDependencies": {
    "@cloudflare/workers-types": "^4.20241205.0",
    "typescript": "^5.3.0",
    "wrangler": "^3.93.0",
    "tailwindcss": "^3.4.0"
  }
}
```

---

## 🎯 Success Metrics

- Dashboard loads in < 2 seconds
- Metrics collected every 5 minutes without gaps
- Alerts delivered within 1 minute of threshold breach
- 99.9% uptime for monitor itself
- All historical data queryable for 90 days

---

## 📝 Notes for Claude Code

1. **Start with collector** - it's the foundation
2. **Add /health endpoints to existing workers** - they need to be health-checkable
3. **Use Chart.js for visualizations** - it's already available in the artifact system
4. **Keep the dashboard simple initially** - we can add features iteratively
5. **Test alerting early** - set up a test Discord webhook
6. **Use the real database IDs** listed in this spec - they're from the production account

---

## 🔗 Related Resources

- [Cloudflare Analytics API](https://developers.cloudflare.com/analytics/graphql-api/)
- [D1 HTTP API](https://developers.cloudflare.com/api/operations/cloudflare-d1-list-databases)
- [R2 API](https://developers.cloudflare.com/r2/api/workers/)
- [Workers Cron Triggers](https://developers.cloudflare.com/workers/configuration/cron-triggers/)
