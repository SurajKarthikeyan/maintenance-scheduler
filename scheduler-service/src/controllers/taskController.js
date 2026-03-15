const axios = require("axios");
const Task = require("../models/Task");

const MACHINE_SERVICE_URL = process.env.MACHINE_SERVICE_URL || "http://localhost:3001";
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY;

const TASK_TO_MACHINE_STATUS = {
  "In Progress": "Under Maintenance",
  "Completed":   "Operational",
  "Scheduled":   null,
  "Pending":     null,
};

async function syncMachineStatus(machineId, taskStatus) {
  const machineStatus = TASK_TO_MACHINE_STATUS[taskStatus];
  if (!machineStatus) return;
  console.log(`[scheduler] Syncing machine ${machineId} to status: ${machineStatus}`);
  try {
    const response = await axios.patch(`${MACHINE_SERVICE_URL}/api/machines/${machineId}`, {
      status: machineStatus,
      ...(taskStatus === "Completed" && {
        last_maintenance_date: new Date().toISOString().split("T")[0],
      }),
    }, {
      headers: {
        "Content-Type": "application/json",
        "x-internal-key": INTERNAL_API_KEY,
      },
    });
    console.log(`[scheduler] Sync response: ${response.status}`);
  } catch (err) {
    console.error(`[scheduler] Failed to sync machine ${machineId} status:`, err.message);
  }
}
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

async function getTask(req, res, next) {
  try {
    const task = await Task.getTaskById(req.params.id);
    if (!task) return res.status(404).json({ success: false, error: "Task not found" });
    res.json({ success: true, data: task });
  } catch (err) {
    next(err);
  }
}

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

async function updateTask(req, res, next) {
  try {
    const existing = await Task.getTaskById(req.params.id);
    if (!existing) return res.status(404).json({ success: false, error: "Task not found" });

    const updated = await Task.updateTask(req.params.id, req.body);

    if (req.body.status && req.body.status !== existing.status) {
      await syncMachineStatus(existing.machine_id, req.body.status);
    }

    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
}

async function deleteTask(req, res, next) {
  try {
    const deleted = await Task.deleteTask(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, error: "Task not found" });
    res.json({ success: true, message: "Task deleted" });
  } catch (err) {
    next(err);
  }
}

async function getUpcomingTasks(req, res, next) {
  try {
    const days = parseInt(req.query.days) || 7;
    const tasks = await Task.getUpcomingTasks(days);
    res.json({ success: true, count: tasks.length, days_ahead: days, data: tasks });
  } catch (err) {
    next(err);
  }
}

async function getOverdueTasks(req, res, next) {
  try {
    const tasks = await Task.getOverdueTasks();
    res.json({ success: true, count: tasks.length, data: tasks });
  } catch (err) {
    next(err);
  }
}

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