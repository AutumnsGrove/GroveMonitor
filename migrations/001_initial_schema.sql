-- migrations/001_initial_schema.sql
-- Initial database schema for GroveMonitor

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
