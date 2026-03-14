const { getPool } = require("../../config/db");

async function getAllAlerts(filters = {}) {
  const pool = getPool();
  let query = "SELECT * FROM alerts WHERE 1=1";
  const values = [];

  if (filters.resolved !== undefined) {
    query += " AND resolved = ?";
    values.push(filters.resolved);
  }
  if (filters.machine_id) {
    query += " AND machine_id = ?";
    values.push(filters.machine_id);
  }
  if (filters.alert_type) {
    query += " AND alert_type = ?";
    values.push(filters.alert_type);
  }

  query += " ORDER BY created_at DESC";
  const [rows] = await pool.query(query, values);
  return rows;
}

async function getAlertById(id) {
  const pool = getPool();
  const [rows] = await pool.query("SELECT * FROM alerts WHERE alert_id = ?", [id]);
  return rows[0] || null;
}

async function upsertAlert(machineId, machineName, alertType, message, daysOverdue) {
  const pool = getPool();
  // Replace existing unresolved alert for this machine to avoid duplicates
  await pool.query(
    `DELETE FROM alerts WHERE machine_id = ? AND resolved = FALSE`,
    [machineId]
  );
  const [result] = await pool.query(
    `INSERT INTO alerts (machine_id, machine_name, alert_type, message, days_overdue)
     VALUES (?, ?, ?, ?, ?)`,
    [machineId, machineName, alertType, message, daysOverdue]
  );
  return getAlertById(result.insertId);
}

async function resolveAlert(id) {
  const pool = getPool();
  await pool.query(
    "UPDATE alerts SET resolved = TRUE, resolved_at = NOW() WHERE alert_id = ?",
    [id]
  );
  return getAlertById(id);
}

async function resolveAlertsByMachine(machineId) {
  const pool = getPool();
  await pool.query(
    "UPDATE alerts SET resolved = TRUE, resolved_at = NOW() WHERE machine_id = ? AND resolved = FALSE",
    [machineId]
  );
}

module.exports = {
  getAllAlerts,
  getAlertById,
  upsertAlert,
  resolveAlert,
  resolveAlertsByMachine,
};
