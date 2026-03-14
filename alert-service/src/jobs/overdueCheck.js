const axios = require("axios");
const Alert = require("../models/Alert");

const MACHINE_SERVICE_URL = process.env.MACHINE_SERVICE_URL || "http://localhost:3001";

async function runOverdueCheck() {
  try {
    const { data } = await axios.get(`${MACHINE_SERVICE_URL}/api/machines`);
    const machines = data.data || [];

    for (const machine of machines) {
      const daysOverdue = machine.days_overdue || 0;

      if (daysOverdue > 0) {
        let alertType = "Overdue";
        if (daysOverdue > 30) alertType = "Critical";

        const message = `${machine.name} is ${daysOverdue} day(s) overdue for maintenance. Last serviced: ${machine.last_maintenance_date}.`;
        await Alert.upsertAlert(machine.machine_id, machine.name, alertType, message, daysOverdue);
        console.log(`[alert-service] Alert raised for machine ${machine.machine_id}: ${alertType}`);
      } else if (daysOverdue >= -7) {
        // Due within 7 days
        const dueSoonMessage = `${machine.name} is due for maintenance on ${machine.next_due_date}.`;
        await Alert.upsertAlert(machine.machine_id, machine.name, "Due Soon", dueSoonMessage, 0);
        console.log(`[alert-service] Due-soon alert for machine ${machine.machine_id}`);
      } else {
        // Machine is fine — resolve any existing alerts
        await Alert.resolveAlertsByMachine(machine.machine_id);
      }
    }

    console.log(`[alert-service] Overdue check complete. Processed ${machines.length} machines.`);
  } catch (err) {
    console.error("[alert-service] Overdue check failed:", err.message);
  }
}

module.exports = { runOverdueCheck };
