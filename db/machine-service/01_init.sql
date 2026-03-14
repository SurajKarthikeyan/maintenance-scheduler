-- ─────────────────────────────────────────
-- machines_db schema + seed data
-- ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS machines (
  machine_id            INT           NOT NULL AUTO_INCREMENT,
  name                  VARCHAR(100)  NOT NULL,
  location              VARCHAR(150)  NOT NULL,
  last_maintenance_date DATE          NOT NULL,
  maintenance_interval_days INT       NOT NULL DEFAULT 30,
  status                ENUM('Operational','Needs Maintenance','Under Maintenance') NOT NULL DEFAULT 'Operational',
  created_at            TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at            TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (machine_id)
);

-- Seed data (from case study Excel)
INSERT INTO machines (machine_id, name, location, last_maintenance_date, maintenance_interval_days, status) VALUES
  (1, 'Press 101',        'Plant 1 - Section A',      '2025-12-01', 30,  'Operational'),
  (2, 'Press 102',        'Plant 1 - Section A',      '2025-09-15', 30,  'Needs Maintenance'),
  (3, 'Conveyor Line 3',  'Plant 2 - Packaging Area', '2025-12-20', 7,   'Operational'),
  (4, 'Pump X7',          'Plant 1 - Basement',       '2025-06-01', 90,  'Under Maintenance'),
  (5, 'Generator G1',     'Plant 2 - Power Room',     '2025-07-01', 180, 'Operational');


db/machine-service/01_init.sql