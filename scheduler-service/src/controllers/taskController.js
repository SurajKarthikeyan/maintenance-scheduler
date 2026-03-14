const axios = require("axios");
const Task = require("../models/Task");

const MACHINE_SERVICE_URL = process.env.MACHINE_SERVICE_URL || "http://localhost:3001";

/**
 * Maps task status changes to machine status updates
 * When a task moves to In Progress, the machine goes Under Maintenance
 * When a task is Completed, the machine returns to Operational
 * Scheduled and Pending tasks don't trigger a machine status change
 */
const TASK_TO_MACHINE_STATUS = {
  "In Progress": "Under Maintenance",
  "Completed":   "Operational",
  "Scheduled":   null,
  "Pending":     null,
};

/**
 * Inter-service communication: notify Machine Service of status change
 * Also updates last_maintenance_date when a task is completed
 * Failures are logged but don't break the task update
 */
async function syncMachineStatus(machineId, taskStatus) {
  const machineStatus = TASK_TO_MACHINE_STATUS[taskStatus];
  if (!machineStatus) return;
  try {
    await axios.patch(`${MACHINE_SERVICE_URL}/api/machines/${machineId}`, {
      status: machineStatus,
      // When completed, update last maintenance date to today
      ...(taskStatus === "Completed" && {
        last_maintenance_date: new Date().toISOString().split("T")[0],
      }),
    });
  } catch (err) {
    console.error(`[scheduler] Failed to sync machine ${machineId} status:`, err.message);
  }
}

/**
 * GET /api/tasks
 * List all tasks with optional filters: machine_id, status
 */
async function listTasks(req, res, next) {
  try {
    const filters = {};
    if (req.query.machine_id) filters.machine_id = req.query.machine_id;
    if (req.query.status)     filters.status     = req.query.status;
    const tasks = await Task.getAllTasks(filters);
    res.json({ success: true, count: tasks.length, data: tasks });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/tasks/:id
 * Get a single task by ID
 */
async function getTask(req, res, next) {
  try {
    const task = await Task.getTaskById(req.params.id);
    if (!task) return res.status(404).json({ success: false, error: "Task not found" });
    res.json({ success: true, data: task });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/tasks
 * Create a new maintenance task
 * Required fields: machine_id, task_description, scheduled_date
 */
async function createTask(req, res, next) {
  try {
    const { machine_id, task_description, scheduled_date } = req.body;
    if (!machine_id || !task_description || !scheduled_date) {
      return res.status(400).json({
        success: false,
        error: "machine_id, task_description, and scheduled_date are required",
      });
    }
    const task = await Task.createTask(req.body);
    res.status(201).json({ success: true, data: task });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/tasks/:id
 * Update a task — if status changes, triggers machine status sync
 * This is the core inter-service communication trigger
 */
async function updateTask(req, res, next) {
  try {
    const existing = await Task.getTaskById(req.params.id);
    if (!existing) return res.status(404).json({ success: false, error: "Task not found" });

    const updated = await Task.updateTask(req.params.id, req.body);

    // Only sync if status actually changed
    if (req.body.status && req.body.status !== existing.status) {
      await syncMachineStatus(existing.machine_id, req.body.status);
    }

    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/tasks/:id
 * Delete a task by ID
 */
async function deleteTask(req, res, next) {
  try {
    const deleted = await Task.deleteTask(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, error: "Task not found" });
    res.json({ success: true, message: "Task deleted" });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/tasks/upcoming?days=7
 * Get tasks due within the next N days (default 7)
 * Only returns Scheduled and Pending tasks
 */
async function getUpcomingTasks(req, res, next) {
  try {
    const days = parseInt(req.query.days) || 7;
    const tasks = await Task.getUpcomingTasks(days);
    res.json({ success: true, count: tasks.length, days_ahead: days, data: tasks });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/tasks/overdue
 * Get tasks past their scheduled date that are not yet completed
 */
async function getOverdueTasks(req, res, next) {
  try {
    const tasks = await Task.getOverdueTasks();
    res.json({ success: true, count: tasks.length, data: tasks });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/tasks/machine/:machineId
 * Get all tasks for a specific machine ordered by scheduled date
 */
async function getTasksByMachine(req, res, next) {
  try {
    const tasks = await Task.getTasksByMachine(req.params.machineId);
    res.json({ success: true, count: tasks.length, data: tasks });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  getUpcomingTasks,
  getOverdueTasks,
  getTasksByMachine,
};