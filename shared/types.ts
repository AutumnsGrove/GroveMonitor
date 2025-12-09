// Shared TypeScript types for GroveMonitor

// Service status types
export type ServiceStatus = "healthy" | "degraded" | "down" | "unknown";
export type Severity = "critical" | "warning" | "info";
export type AlertOperator = "gt" | "lt" | "eq";

// KV Schema - Real-time data structures

export interface ServiceStatusKV {
  service: string;
  status: ServiceStatus;
  lastCheck: number;
  latencyMs: number;
  errorRate: number;
  requestsPerMin: number;
}

export interface LatestMetrics {
  requests: number;
  errors: number;
  p50Latency: number;
  p95Latency: number;
  p99Latency: number;
  cpuTime: number;
  timestamp: number;
}

export interface ActiveIncident {
  id: number;
  service: string;
  severity: Severity;
  title: string;
  triggeredAt: number;
}

export interface ActiveIncidents {
  incidents: ActiveIncident[];
}

export interface SystemOverview {
  totalServices: number;
  healthyServices: number;
  degradedServices: number;
  downServices: number;
  totalRequestsToday: number;
  totalErrorsToday: number;
  activeIncidents: number;
  lastUpdated: number;
}

// Database types (matching D1 schema)

export interface Metric {
  id?: number;
  service_name: string;
  metric_type: string;
  value: number;
  unit?: string;
  recorded_at: number;
  metadata?: string; // JSON string
}

export interface HealthCheck {
  id?: number;
  endpoint: string;
  status_code?: number;
  response_time_ms?: number;
  is_healthy: number; // 0 or 1
  error_message?: string;
  checked_at: number;
}

export interface D1Stat {
  id?: number;
  database_name: string;
  database_id: string;
  size_bytes?: number;
  rows_read?: number;
  rows_written?: number;
  recorded_at: number;
}

export interface R2Stat {
  id?: number;
  bucket_name: string;
  object_count?: number;
  total_size_bytes?: number;
  recorded_at: number;
}

export interface Incident {
  id?: number;
  service_name: string;
  severity: Severity;
  title: string;
  description?: string;
  triggered_at: number;
  resolved_at?: number;
  acknowledged_by?: string;
}

export interface AlertThreshold {
  id?: number;
  service_name: string;
  metric_type: string;
  operator: AlertOperator;
  threshold_value: number;
  severity: Severity;
  enabled: number; // 0 or 1
  webhook_url?: string;
  created_at: number;
  updated_at: number;
}

export interface DailyAggregate {
  id?: number;
  date: string; // YYYY-MM-DD
  service_name: string;
  total_requests: number;
  total_errors: number;
  total_d1_reads: number;
  total_d1_writes: number;
  total_r2_reads: number;
  total_r2_writes: number;
  total_kv_reads: number;
  total_kv_writes: number;
  estimated_cost_usd: number;
}

// API Request/Response types

export interface AlertWebhookPayload {
  type: "alert";
  severity: Severity;
  service: string;
  metric: string;
  currentValue: number;
  threshold: number;
  title: string;
  description: string;
  timestamp: string;
  dashboardUrl: string;
}

// Cloudflare Worker Environment bindings

export interface Env {
  // D1 Database
  DB: D1Database;

  // KV Namespace
  MONITOR_KV: KVNamespace;

  // R2 Bucket (optional)
  SNAPSHOTS?: R2Bucket;

  // Environment variables
  CF_API_TOKEN?: string;
  CF_ACCOUNT_ID?: string;
  RESEND_API_KEY?: string;
  ALERT_EMAIL_TO?: string;
  ALERT_ENABLED?: string;
  COLLECTION_INTERVAL_MINUTES?: string;
  DASHBOARD_PASSWORD?: string;
  CORS_ALLOW_ORIGIN?: string;
}
