const { getPool } = require("../../config/db");

// Helper: calculate next due date
function calcNextDueDate(lastMaintenanceDate, intervalDays) {
  const last = new Date(lastMaintenanceDate);
  last.setDate(last.getDate() + intervalDays);
  return last.toISOString().split("T")[0];
}

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

async function deleteMachine(id) {
  const pool = getPool();
  const [result] = await pool.query("DELETE FROM machines WHERE machine_id = ?", [id]);
  return result.affectedRows > 0;
}

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
