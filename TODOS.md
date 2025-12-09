# GroveMonitor - Project TODOs

## ✅ Completed - Project Scaffolding
- [x] Create monorepo structure (packages/, migrations/, shared/, docs/)
- [x] Set up pnpm workspace configuration
- [x] Create package.json files for all packages
- [x] Configure TypeScript for all packages
- [x] Create wrangler.toml configs for workers
- [x] Write D1 migration SQL files
- [x] Define shared TypeScript types and constants
- [x] Set up secrets template with Resend API
- [x] Update AGENT.md with project details
- [x] Create GroveMonitor-specific README
- [x] Move spec to docs/SPEC.md

---

## 🚀 Phase 1: Core Infrastructure Setup

### Cloudflare Resources
- [ ] Create D1 database `grove-monitor-db`
  - [ ] Run: `wrangler d1 create grove-monitor-db`
  - [ ] Copy database_id to `packages/collector/wrangler.toml`
  - [ ] Copy database_id to `packages/api/wrangler.toml`
- [ ] Create KV namespace `MONITOR_KV`
  - [ ] Run: `wrangler kv:namespace create MONITOR_KV`
  - [ ] Copy id to both wrangler.toml files
- [ ] Create R2 bucket `grove-monitor-snapshots`
  - [ ] Run: `wrangler r2 bucket create grove-monitor-snapshots`

### Database Setup
- [ ] Run database migrations
  - [ ] Execute: `pnpm db:migrate`
  - [ ] Verify tables created in D1 dashboard

### Secrets Configuration
- [ ] Copy `secrets_template.json` to `secrets.json`
- [ ] Fill in Cloudflare API token (with Analytics:Read, D1:Read, R2:Read, Workers:Read)
- [ ] Fill in Cloudflare account ID
- [ ] Set up Resend account and get API key
- [ ] Configure alert email address
- [ ] Copy `.dev.vars.example` to `.dev.vars` for local development
- [ ] Set production secrets via wrangler:
  - [ ] `cd packages/collector && wrangler secret put CF_API_TOKEN`
  - [ ] `wrangler secret put CF_ACCOUNT_ID`
  - [ ] `wrangler secret put RESEND_API_KEY`
  - [ ] `wrangler secret put ALERT_EMAIL_TO`

### Dependencies
- [ ] Install root dependencies: `pnpm install`
- [ ] Verify all packages install correctly
- [ ] Run typecheck: `pnpm typecheck` (should pass)

---

## 📊 Phase 2: Data Collection (Collector Worker)

### Health Checks Module
- [ ] Implement `packages/collector/src/collectors/health-checks.ts`
  - [ ] Create `performHealthCheck()` function
  - [ ] Check all service endpoints from constants
  - [ ] Measure response time
  - [ ] Store results in `health_checks` table

### Cloudflare Analytics Collector
- [ ] Implement `packages/collector/src/collectors/cloudflare-analytics.ts`
  - [ ] Set up Cloudflare GraphQL API client
  - [ ] Fetch worker analytics (requests, errors, latency, CPU)
  - [ ] Parse and transform data
  - [ ] Store in `metrics` table

### D1 Metrics Collector
- [ ] Implement `packages/collector/src/collectors/d1-metrics.ts`
  - [ ] Query D1 API for database stats
  - [ ] Get size, rows_read, rows_written for each DB
  - [ ] Store in `d1_stats` table

### R2 Metrics Collector
- [ ] Implement `packages/collector/src/collectors/r2-metrics.ts`
  - [ ] Query R2 API for bucket stats
  - [ ] Get object_count and total_size_bytes
  - [ ] Store in `r2_stats` table

### KV Metrics Collector
- [ ] Implement `packages/collector/src/collectors/kv-metrics.ts`
  - [ ] Query KV API for namespace stats
  - [ ] Get read/write/delete counts
  - [ ] Store in `metrics` table

### Main Collector
- [ ] Implement `packages/collector/src/index.ts`
  - [ ] Create scheduled event handler (runs every 5 min)
  - [ ] Orchestrate all collectors
  - [ ] Update KV with real-time data
  - [ ] Calculate system overview
  - [ ] Handle errors gracefully

### Testing
- [ ] Test collector locally: `pnpm dev:collector`
- [ ] Trigger manual collection
- [ ] Verify data in D1 and KV
- [ ] Deploy collector: `pnpm deploy:collector`

---

## 🔔 Phase 3: Alerting System

### Alert Thresholds
- [ ] Implement `packages/collector/src/alerting/thresholds.ts`
  - [ ] Load thresholds from `alert_thresholds` table
  - [ ] Check metrics against thresholds
  - [ ] Determine if alert should be triggered

### Resend Email Integration
- [ ] Implement `packages/collector/src/alerting/webhook.ts`
  - [ ] Create email template for alerts
  - [ ] Send email via Resend API
  - [ ] Format alert details (service, metric, value, threshold)
  - [ ] Include link to dashboard

### Alert Management
- [ ] Create incidents when thresholds breached
  - [ ] Insert into `incidents` table
  - [ ] Update KV active incidents
- [ ] Implement alert deduplication (don't spam)
- [ ] Test alerting with low thresholds
- [ ] Verify emails received via Resend

---

## 🔌 Phase 4: API Worker

### Core API Setup
- [ ] Implement `packages/api/src/index.ts`
  - [ ] Set up router for API endpoints
  - [ ] Add CORS middleware
  - [ ] Add optional auth middleware

### Metrics Endpoints
- [ ] Implement `packages/api/src/routes/metrics.ts`
  - [ ] `GET /api/overview` - System summary
  - [ ] `GET /api/services` - All services list
  - [ ] `GET /api/metrics/:service` - Service metrics
  - [ ] `GET /api/metrics/:service/history` - Historical data

### Health Endpoints
- [ ] Implement `packages/api/src/routes/health.ts`
  - [ ] `GET /api/health` - All health checks
  - [ ] `GET /api/health/:endpoint` - Specific endpoint history

### Database Endpoints
- [ ] Implement `packages/api/src/routes/databases.ts`
  - [ ] `GET /api/d1` - All D1 stats
  - [ ] `GET /api/d1/:database` - Specific database
  - [ ] `GET /api/r2` - All R2 stats
  - [ ] `GET /api/r2/:bucket` - Specific bucket
  - [ ] `GET /api/kv` - All KV stats

### Alerts Endpoints
- [ ] Implement `packages/api/src/routes/alerts.ts`
  - [ ] `GET /api/alerts` - Active alerts
  - [ ] `GET /api/alerts/history` - Past alerts
  - [ ] `POST /api/alerts/acknowledge/:id` - Acknowledge alert
  - [ ] `GET /api/alerts/thresholds` - Get thresholds
  - [ ] `PUT /api/alerts/thresholds/:id` - Update threshold

### Cost Endpoints
- [ ] Implement `packages/api/src/routes/costs.ts`
  - [ ] `GET /api/costs/daily` - Daily breakdown
  - [ ] `GET /api/costs/monthly` - Monthly summary
  - [ ] `GET /api/costs/projection` - Future projection

### Testing & Deployment
- [ ] Test API locally: `pnpm dev:api`
- [ ] Verify all endpoints return data
- [ ] Test CORS from dashboard origin
- [ ] Deploy API: `pnpm deploy:api`

---

## 🎨 Phase 5: Dashboard UI (SvelteKit)

### SvelteKit Setup
- [ ] Initialize SvelteKit in `packages/dashboard/`
  - [ ] Create `src/routes/+layout.svelte` with nav
  - [ ] Set up TailwindCSS configuration
  - [ ] Create `src/lib/api.ts` for API client
  - [ ] Create reusable components in `src/lib/components/`

### Components Library
- [ ] Create `MetricCard.svelte` - Display single metric
- [ ] Create `StatusBadge.svelte` - Service status indicator
- [ ] Create `SparklineChart.svelte` - Mini trend chart
- [ ] Create `TimeSeriesChart.svelte` - Full Chart.js chart
- [ ] Create `ServiceGrid.svelte` - Grid of service cards

### Overview Page (`/`)
- [ ] Create `src/routes/+page.svelte`
  - [ ] Hero stats (total services, healthy/degraded/down)
  - [ ] Service grid with status badges
  - [ ] Active incidents list
  - [ ] 24h summary (requests, errors, costs)

### Workers Page (`/workers`)
- [ ] Create `src/routes/workers/+page.svelte`
  - [ ] Table view of all workers
  - [ ] Sortable columns
- [ ] Create `src/routes/workers/[name]/+page.svelte`
  - [ ] Request volume chart (24h/7d/30d toggles)
  - [ ] Error rate chart
  - [ ] Latency distribution
  - [ ] CPU time breakdown

### Databases Page (`/databases`)
- [ ] Create `src/routes/databases/+page.svelte`
  - [ ] D1 overview table
- [ ] Create `src/routes/databases/[name]/+page.svelte`
  - [ ] Size over time chart
  - [ ] Read/write trends

### Storage Page (`/storage`)
- [ ] Create `src/routes/storage/+page.svelte`
  - [ ] R2 buckets table (object count, size)
  - [ ] KV namespaces table (read/write patterns)
  - [ ] Combined storage cost estimate

### Health Page (`/health`)
- [ ] Create `src/routes/health/+page.svelte`
  - [ ] 90-day uptime grid (GitHub-style)
  - [ ] Response time history chart
  - [ ] Recent incidents timeline

### Alerts Page (`/alerts`)
- [ ] Create `src/routes/alerts/+page.svelte`
  - [ ] Active alerts list
  - [ ] Alert history with resolution time
  - [ ] Threshold configuration UI
  - [ ] Webhook/email setup form

### Costs Page (`/costs`)
- [ ] Create `src/routes/costs/+page.svelte`
  - [ ] Daily cost breakdown (stacked bar chart)
  - [ ] Monthly projection
  - [ ] Per-service costs
  - [ ] Optimization tips

### Testing & Deployment
- [ ] Test dashboard locally: `pnpm dev:dashboard`
- [ ] Verify all pages load
- [ ] Test responsiveness (mobile/tablet)
- [ ] Deploy dashboard: `pnpm deploy:dashboard`
- [ ] Configure custom domain `monitor.grove.place`

---

## 🎯 Phase 6: Polish & Launch

### Performance
- [ ] Optimize Chart.js bundle size
- [ ] Add loading skeletons for charts
- [ ] Implement data caching in dashboard
- [ ] Ensure dashboard loads < 2 seconds

### Mobile Responsiveness
- [ ] Test all pages on mobile
- [ ] Adjust layouts for small screens
- [ ] Make charts responsive

### Documentation
- [ ] Add inline code comments
- [ ] Document API endpoints (OpenAPI spec?)
- [ ] Create deployment guide
- [ ] Add troubleshooting section to README

### Monitoring the Monitor
- [ ] Add health endpoint to collector
- [ ] Add health endpoint to API worker
- [ ] Set up alerting for GroveMonitor itself

### Launch Checklist
- [ ] All workers deployed and running
- [ ] Cron schedule active (every 5 min)
- [ ] Custom domain configured
- [ ] Secrets set in production
- [ ] Test email alert received
- [ ] Verify data flowing through all services
- [ ] Monitor for 24h to ensure stability

---

## 🔮 Future Enhancements (Post-Launch)

- [ ] Add Slack integration (in addition to email)
- [ ] Implement dashboard authentication
- [ ] Add anomaly detection (ML-based)
- [ ] Create mobile app (PWA)
- [ ] Add cost optimization recommendations
- [ ] Implement incident post-mortems
- [ ] Add custom metric tracking
- [ ] Create public status page
- [ ] Add webhook callbacks for external integrations
- [ ] Implement SLO tracking

---

**Last updated**: 2024-12-09
**Current Phase**: Phase 1 (Setup Complete, Ready for Development)
