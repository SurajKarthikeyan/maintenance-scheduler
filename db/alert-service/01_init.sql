-- ─────────────────────────────────────────
-- alerts_db schema
-- ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS alerts (
  alert_id     INT           NOT NULL AUTO_INCREMENT,
  machine_id   INT           NOT NULL,
  machine_name VARCHAR(100)  NOT NULL,
  alert_type   ENUM('Overdue','Due Soon','Critical') NOT NULL DEFAULT 'Overdue',
  message      VARCHAR(255)  NOT NULL,
  days_overdue INT           NOT NULL DEFAULT 0,
  resolved     BOOLEAN       NOT NULL DEFAULT FALSE,
  resolved_at  TIMESTAMP     DEFAULT NULL,
  created_at   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (alert_id),
  INDEX idx_machine_id (machine_id),
  INDEX idx_resolved (resolved),
  INDEX idx_alert_type (alert_type)
);
