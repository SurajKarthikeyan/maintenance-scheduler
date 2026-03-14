const Alert = require("../models/Alert");
const { runOverdueCheck } = require("../jobs/overdueCheck");

async function listAlerts(req, res, next) {
  try {
    const filters = {};
    if (req.query.resolved !== undefined) filters.resolved = req.query.resolved === "true";
    if (req.query.machine_id)  filters.machine_id  = req.query.machine_id;
    if (req.query.alert_type)  filters.alert_type  = req.query.alert_type;
    const alerts = await Alert.getAllAlerts(filters);
    res.json({ success: true, count: alerts.length, data: alerts });
  } catch (err) {
    next(err);
  }
}

async function getAlert(req, res, next) {
  try {
    const alert = await Alert.getAlertById(req.params.id);
    if (!alert) return res.status(404).json({ success: false, error: "Alert not found" });
    res.json({ success: true, data: alert });
  } catch (err) {
    next(err);
  }
}

async function resolveAlert(req, res, next) {
  try {
    const alert = await Alert.getAlertById(req.params.id);
    if (!alert) return res.status(404).json({ success: false, error: "Alert not found" });
    const updated = await Alert.resolveAlert(req.params.id);
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
}

async function triggerCheck(req, res, next) {
  try {
    await runOverdueCheck();
    res.json({ success: true, message: "Overdue check triggered successfully" });
  } catch (err) {
    next(err);
  }
}

module.exports = { listAlerts, getAlert, resolveAlert, triggerCheck };
