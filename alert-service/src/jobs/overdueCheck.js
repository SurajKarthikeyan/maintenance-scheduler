const axios = require("axios");
const Alert = require("../models/Alert");

const MACHINE_SERVICE_URL = process.env.MACHINE_SERVICE_URL || "http://localhost:3001";

/**
 * Core cron job logic — runs every hour and on startup
 * Fetches all machines from Machine Service and evaluates each one:
 *
 * - days_overdue > 30  → Critical alert + set machine to Needs Maintenance
 * - days_overdue > 0   → Overdue alert + set machine to Needs Maintenance
 * - days_overdue >= -7 → Due Soon alert (within 7 days)
 * - days_overdue < -7  → Machine is fine, resolve any existing alerts
 *
 * Uses upsertAlert to avoid duplicate alerts for the same machine
 * Machine status is synced back via HTTP call to Machine Service
 */
async function runOverdueCheck() {
  try {
    // Fetch all machines from Machine Service
    const { data } = await axios.get(`${MACHINE_SERVICE_URL}/api/machines`, internalHeaders);
    const machines = data.data || [];

    for (const machine of machines) {
      const daysOverdue = machine.days_overdue || 0;

      if (daysOverdue > 0) {
        // Machine is overdue — determine severity
        let alertType = "Overdue";
        if (daysOverdue > 30) alertType = "Critical";

        const message = `${machine.name} is ${daysOverdue} day(s) overdue for maintenance. Last serviced: ${machine.last_maintenance_date}.`;

        // Create or update alert for this machine
        await Alert.upsertAlert(machine.machine_id, machine.name, alertType, message, daysOverdue);

        // Sync machine status — don't override if already Under Maintenance
        if (machine.status !== 'Under Maintenance') {
          await axios.patch(`${MACHINE_SERVICE_URL}/api/machines/${machine.machine_id}`, {
            status: 'Needs Maintenance'
          });
        }

        console.log(`[alert-service] Alert raised for machine ${machine.machine_id}: ${alertType}`);

      } else if (daysOverdue >= -7) {
        // Machine is due within 7 days — raise a Due Soon alert
        const dueSoonMessage = `${machine.name} is due for maintenance on ${machine.next_due_date}.`;
        await Alert.upsertAlert(machine.machine_id, machine.name, "Due Soon", dueSoonMessage, 0);
        console.log(`[alert-service] Due-soon alert for machine ${machine.machine_id}`);

      } else {
        // Machine is on schedule — resolve any existing alerts
        await Alert.resolveAlertsByMachine(machine.machine_id);

        // Reset status to Operational if it was flagged as Needs Maintenance
        if (machine.status === 'Needs Maintenance') {
          await axios.patch(`${MACHINE_SERVICE_URL}/api/machines/${machine.machine_id}`, {
            status: 'Operational'
          });
        }
      }
    }

    console.log(`[alert-service] Overdue check complete. Processed ${machines.length} machines.`);
  } catch (err) {
    console.error("[alert-service] Overdue check failed:", err.message);
  }
}

module.exports = { runOverdueCheck };