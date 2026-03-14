const { getPool } = require("../../config/db");

async function getAllTasks(filters = {}) {
  const pool = getPool();
  let query = "SELECT * FROM maintenance_tasks WHERE 1=1";
  const values = [];

  if (filters.machine_id) {
    query += " AND machine_id = ?";
    values.push(filters.machine_id);
  }
  if (filters.status) {
    query += " AND status = ?";
    values.push(filters.status);
  }

  query += " ORDER BY scheduled_date ASC";
  const [rows] = await pool.query(query, values);
  return rows;
}

async function getTaskById(id) {
  const pool = getPool();
  const [rows] = await pool.query(
    "SELECT * FROM maintenance_tasks WHERE task_id = ?",
    [id]
  );
  return rows[0] || null;
}

async function createTask(data) {
  const pool = getPool();
  const { machine_id, task_description, scheduled_date, status } = data;
  const [result] = await pool.query(
    `INSERT INTO maintenance_tasks (machine_id, task_description, scheduled_date, status)
     VALUES (?, ?, ?, ?)`,
    [machine_id, task_description, scheduled_date, status || "Scheduled"]
  );
  return getTaskById(result.insertId);
}

async function updateTask(id, data) {
  const pool = getPool();
  const fields = [];
  const values = [];

  const allowed = ["task_description", "scheduled_date", "status", "completed_on"];
  for (const key of allowed) {
    if (data[key] !== undefined) {
      fields.push(`${key} = ?`);
      values.push(data[key]);
    }
  }

  // Auto-set completed_on when status flips to Completed
  if (data.status === "Completed" && data.completed_on === undefined) {
    fields.push("completed_on = ?");
    values.push(new Date().toISOString().split("T")[0]);
  }

  if (fields.length === 0) return getTaskById(id);

  values.push(id);
  await pool.query(
    `UPDATE maintenance_tasks SET ${fields.join(", ")} WHERE task_id = ?`,
    values
  );
  return getTaskById(id);
}

async function deleteTask(id) {
  const pool = getPool();
  const [result] = await pool.query(
    "DELETE FROM maintenance_tasks WHERE task_id = ?",
    [id]
  );
  return result.affectedRows > 0;
}

async function getUpcomingTasks(days = 7) {
  const pool = getPool();
  const [rows] = await pool.query(
    `SELECT * FROM maintenance_tasks
     WHERE status IN ('Scheduled', 'Pending')
       AND scheduled_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL ? DAY)
     ORDER BY scheduled_date ASC`,
    [days]
  );
  return rows;
}

async function getOverdueTasks() {
  const pool = getPool();
  const [rows] = await pool.query(
    `SELECT *,
       DATEDIFF(CURDATE(), scheduled_date) AS days_overdue
     FROM maintenance_tasks
     WHERE status IN ('Scheduled', 'Pending')
       AND scheduled_date < CURDATE()
     ORDER BY days_overdue DESC`
  );
  return rows;
}

async function getTasksByMachine(machineId) {
  const pool = getPool();
  const [rows] = await pool.query(
    `SELECT * FROM maintenance_tasks WHERE machine_id = ? ORDER BY scheduled_date DESC`,
    [machineId]
  );
  return rows;
}

module.exports = {
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  getUpcomingTasks,
  getOverdueTasks,
  getTasksByMachine,
};
