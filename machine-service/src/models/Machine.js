const { getPool } = require("../../config/db");

/**
 * Helper: calculate next due date from last maintenance + interval
 * This is also computed in SQL for every query, but kept here for reference
 */
function calcNextDueDate(lastMaintenanceDate, intervalDays) {
  const last = new Date(lastMaintenanceDate);
  last.setDate(last.getDate() + intervalDays);
  return last.toISOString().split("T")[0];
}

/**
 * Fetch all machines with computed next_due_date and days_overdue
 * These are calculated live in SQL so they're always accurate
 */
async function getAllMachines() {
  const pool = getPool();
  const [rows] = await pool.query(`
    SELECT *,
      DATE_ADD(last_maintenance_date, INTERVAL maintenance_interval_days DAY) AS next_due_date,
      DATEDIFF(NOW(), DATE_ADD(last_maintenance_date, INTERVAL maintenance_interval_days DAY)) AS days_overdue
    FROM machines
    ORDER BY machine_id
  `);
  return rows;
}

/**
 * Fetch a single machine by ID with computed fields
 */
async function getMachineById(id) {
  const pool = getPool();
  const [rows] = await pool.query(
    `SELECT *,
      DATE_ADD(last_maintenance_date, INTERVAL maintenance_interval_days DAY) AS next_due_date,
      DATEDIFF(NOW(), DATE_ADD(last_maintenance_date, INTERVAL maintenance_interval_days DAY)) AS days_overdue
    FROM machines WHERE machine_id = ?`,
    [id]
  );
  return rows[0] || null;
}

/**
 * Create a new machine with default interval of 30 days and Operational status
 */
async function createMachine(data) {
  const pool = getPool();
  const { name, location, last_maintenance_date, maintenance_interval_days, status } = data;
  const [result] = await pool.query(
    `INSERT INTO machines (name, location, last_maintenance_date, maintenance_interval_days, status)
     VALUES (?, ?, ?, ?, ?)`,
    [name, location, last_maintenance_date, maintenance_interval_days || 30, status || "Operational"]
  );
  return getMachineById(result.insertId);
}

/**
 * Update machine fields dynamically — only updates fields that are provided
 * Allows partial updates (e.g. status only, or interval only)
 */
async function updateMachine(id, data) {
  const pool = getPool();
  const fields = [];
  const values = [];

  const allowed = ["name", "location", "last_maintenance_date", "maintenance_interval_days", "status"];
  for (const key of allowed) {
    if (data[key] !== undefined) {
      fields.push(`${key} = ?`);
      values.push(data[key]);
    }
  }

  if (fields.length === 0) return getMachineById(id);

  values.push(id);
  await pool.query(`UPDATE machines SET ${fields.join(", ")} WHERE machine_id = ?`, values);
  return getMachineById(id);
}

/**
 * Delete a machine by ID — returns true if deleted, false if not found
 */
async function deleteMachine(id) {
  const pool = getPool();
  const [result] = await pool.query("DELETE FROM machines WHERE machine_id = ?", [id]);
  return result.affectedRows > 0;
}

/**
 * Filter machines by status (Operational, Needs Maintenance, Under Maintenance)
 */
async function getMachinesByStatus(status) {
  const pool = getPool();
  const [rows] = await pool.query(
    `SELECT *,
      DATE_ADD(last_maintenance_date, INTERVAL maintenance_interval_days DAY) AS next_due_date,
      DATEDIFF(NOW(), DATE_ADD(last_maintenance_date, INTERVAL maintenance_interval_days DAY)) AS days_overdue
    FROM machines WHERE status = ?
    ORDER BY machine_id`,
    [status]
  );
  return rows;
}

/**
 * Get all machines where today is past their next due date
 * Ordered by most overdue first
 */
async function getOverdueMachines() {
  const pool = getPool();
  const [rows] = await pool.query(`
    SELECT *,
      DATE_ADD(last_maintenance_date, INTERVAL maintenance_interval_days DAY) AS next_due_date,
      DATEDIFF(NOW(), DATE_ADD(last_maintenance_date, INTERVAL maintenance_interval_days DAY)) AS days_overdue
    FROM machines
    WHERE DATE_ADD(last_maintenance_date, INTERVAL maintenance_interval_days DAY) < CURDATE()
    ORDER BY days_overdue DESC
  `);
  return rows;
}

module.exports = {
  getAllMachines,
  getMachineById,
  createMachine,
  updateMachine,
  deleteMachine,
  getMachinesByStatus,
  getOverdueMachines,
};