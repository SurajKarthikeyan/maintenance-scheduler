-- ─────────────────────────────────────────
-- tasks_db schema + seed data
-- ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS maintenance_tasks (
  task_id          INT           NOT NULL AUTO_INCREMENT,
  machine_id       INT           NOT NULL,
  task_description VARCHAR(255)  NOT NULL,
  scheduled_date   DATE          NOT NULL,
  status           ENUM('Scheduled','Pending','In Progress','Completed') NOT NULL DEFAULT 'Scheduled',
  completed_on     DATE          DEFAULT NULL,
  created_at       TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (task_id),
  INDEX idx_machine_id (machine_id),
  INDEX idx_status (status),
  INDEX idx_scheduled_date (scheduled_date)
);

-- Seed data (from case study Excel)
INSERT INTO maintenance_tasks (task_id, machine_id, task_description, scheduled_date, status, completed_on) VALUES
  (1,  1, 'Replace hydraulic oil',     '2025-09-30', 'Completed',   '2025-10-01'),
  (2,  1, 'General inspection',        '2025-12-01', 'Completed',   '2025-12-01'),
  (3,  1, 'Replace coolant filter',    '2026-01-05', 'Scheduled',   NULL),
  (4,  2, 'Lubrication check',         '2025-12-15', 'Pending',     NULL),
  (5,  2, 'Inspect safety guards',     '2025-09-15', 'Completed',   '2025-09-15'),
  (6,  3, 'Weekly belt alignment',     '2025-12-20', 'Completed',   '2025-12-20'),
  (7,  3, 'Motor temperature check',   '2025-12-27', 'Scheduled',   NULL),
  (8,  4, 'Replace valve seals',       '2025-12-21', 'In Progress', NULL),
  (9,  4, 'Pressure test',             '2025-06-01', 'Completed',   '2025-06-01'),
  (10, 5, 'Inspect generator coils',   '2025-07-01', 'Completed',   '2025-07-01'),
  (11, 5, 'Change oil filter',         '2026-01-15', 'Scheduled',   NULL);
