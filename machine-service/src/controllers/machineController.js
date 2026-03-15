const Machine = require("../models/Machine");

async function listMachines(req, res, next) {
  try {
    const { status } = req.query;
    const machines = status
      ? await Machine.getMachinesByStatus(status)
      : await Machine.getAllMachines();
    res.json({ success: true, count: machines.length, data: machines });
  } catch (err) {
    next(err);
  }
}

async function getMachine(req, res, next) {
  try {
    const machine = await Machine.getMachineById(req.params.id);
    if (!machine) return res.status(404).json({ success: false, error: "Machine not found" });
    res.json({ success: true, data: machine });
  } catch (err) {
    next(err);
  }
}

async function createMachine(req, res, next) {
  try {
    const { name, location, last_maintenance_date, maintenance_interval_days, status } = req.body;
    if (!name || !location || !last_maintenance_date) {
      return res.status(400).json({
        success: false,
        error: "name, location, and last_maintenance_date are required",
      });
    }
    const machine = await Machine.createMachine(req.body);
    res.status(201).json({ success: true, data: machine });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ success: false, error: 'A machine with that name already exists' });
    }
    next(err);
  }
}

async function updateMachine(req, res, next) {
  try {
    const machine = await Machine.getMachineById(req.params.id);
    if (!machine) return res.status(404).json({ success: false, error: "Machine not found" });

    const updated = await Machine.updateMachine(req.params.id, req.body);
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
}

async function deleteMachine(req, res, next) {
  try {
    const deleted = await Machine.deleteMachine(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, error: "Machine not found" });
    res.json({ success: true, message: "Machine deleted" });
  } catch (err) {
    next(err);
  }
}

async function getOverdueMachines(req, res, next) {
  try {
    const machines = await Machine.getOverdueMachines();
    res.json({ success: true, count: machines.length, data: machines });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listMachines,
  getMachine,
  createMachine,
  updateMachine,
  deleteMachine,
  getOverdueMachines,
};
