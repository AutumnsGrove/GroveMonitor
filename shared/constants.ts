// Shared constants for GroveMonitor

// Services to monitor
export const MONITORED_SERVICES = [
  {
    name: "groveauth",
    endpoint: "https://auth.grove.place",
    healthPath: "/health",
  },
  {
    name: "scout",
    endpoint: "https://scout.grove.place",
    healthPath: "/health",
  },
  {
    name: "grove-domain-tool",
    endpoint: "https://domains.grove.place",
    healthPath: "/health",
  },
  {
    name: "autumnsgrove",
    endpoint: "https://autumnsgrove.dev",
    healthPath: "/",
  },
  {
    name: "library-enhancer-api",
    endpoint: "https://library-enhancer-api.grove.place",
    healthPath: "/health",
  },
  {
    name: "grove-backup-worker",
    endpoint: "https://backup.grove.place",
    healthPath: "/status",
  },
] as const;

// D1 Databases to monitor
export const MONITORED_DATABASES = [
  { name: "groveauth", id: "45eae4c7-8ae7-4078-9218-8e1677a4360f" },
  { name: "scout-db", id: "6a289378-c662-4c6a-9f1b-fa5296e03fa2" },
  { name: "grove-engine-db", id: "a6394da2-b7a6-48ce-b7fe-b1eb3e730e68" },
  { name: "grovemusic-db", id: "e1e31ed2-3b1f-4dbd-9435-c9105dadcfa2" },
  { name: "library-enhancer-db", id: "afd1ce4c-618a-430a-bf0f-0a57647a388d" },
  { name: "autumnsgrove-posts", id: "510badf3-457a-4892-bf2a-45d4bfd7a7bb" },
  {
    name: "autumnsgrove-git-stats",
    id: "0ca4036f-93f7-4c8a-98a5-5353263acd44",
  },
  { name: "grove-domain-jobs", id: "cd493112-a901-4f6d-aadf-a5ca78929557" },
  { name: "your-site-posts", id: "86342742-7d34-486f-97f0-928136555e1a" },
] as const;

// R2 Buckets to monitor
export const MONITORED_R2_BUCKETS = [
  { name: "grove-cdn", purpose: "CDN assets" },
  { name: "grove-media", purpose: "User uploads" },
  { name: "scout-results", purpose: "Search cache" },
  { name: "grovemusic-storage", purpose: "Audio files" },
  { name: "autumnsgrove-images", purpose: "Blog images" },
  { name: "library-enhancer-images", purpose: "Library assets" },
] as const;

// KV Namespaces to monitor
export const MONITORED_KV_NAMESPACES = [
  { name: "SCOUT_CACHE", id: "31eb5622c7fd41ec8fc8c8f939f5099b" },
  { name: "SESSIONS", id: "46c5fb1dd2d04385a7e624b2e4730ad6" },
  { name: "grove-cache", id: "514e91e81cc44d128a82ec6f668303e4" },
  { name: "CONFIG", id: "6488be12cf90402caf6ced7bf156ad6c" },
  { name: "CACHE", id: "677a09cfeb5c4afe9bac24240c1fcc6d" },
  { name: "autumnsgrove-CACHE_KV", id: "6bc72b16c721401e8b9a848a7ae4e0ca" },
  { name: "RATE_LIMITS", id: "d5c976093f344aba948f77f37d29194a" },
] as const;

// Default alert thresholds
export const DEFAULT_THRESHOLDS = [
  // Error rate alerts
  {
    metric: "error_rate",
    operator: "gt" as const,
    value: 5,
    severity: "warning" as const,
  },
  {
    metric: "error_rate",
    operator: "gt" as const,
    value: 10,
    severity: "critical" as const,
  },

  // Latency alerts
  {
    metric: "latency_p95",
    operator: "gt" as const,
    value: 500,
    severity: "warning" as const,
  },
  {
    metric: "latency_p95",
    operator: "gt" as const,
    value: 1000,
    severity: "critical" as const,
  },

  // Health check alerts
  {
    metric: "health_check",
    operator: "eq" as const,
    value: 0,
    severity: "critical" as const,
  },

  // D1 size alerts (approaching 10GB limit)
  {
    metric: "d1_size_bytes",
    operator: "gt" as const,
    value: 8_000_000_000,
    severity: "warning" as const,
  },
  {
    metric: "d1_size_bytes",
    operator: "gt" as const,
    value: 9_500_000_000,
    severity: "critical" as const,
  },

  // Cost alerts
  {
    metric: "daily_cost_usd",
    operator: "gt" as const,
    value: 5,
    severity: "warning" as const,
  },
  {
    metric: "daily_cost_usd",
    operator: "gt" as const,
    value: 10,
    severity: "critical" as const,
  },
] as const;

// KV key patterns
export const KV_KEYS = {
  serviceStatus: (service: string) => `status:${service}`,
  latestMetrics: (service: string) => `metrics:latest:${service}`,
  activeIncidents: "incidents:active",
  systemOverview: "overview:current",
} as const;

// TTL values (in seconds)
export const KV_TTL = {
  serviceStatus: 600, // 10 minutes
  latestMetrics: 600, // 10 minutes
  systemOverview: 300, // 5 minutes
  // activeIncidents has no TTL - manually managed
} as const;
