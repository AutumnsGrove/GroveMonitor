-- migrations/002_alerts_config.sql
-- Alert configuration and daily aggregates

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
