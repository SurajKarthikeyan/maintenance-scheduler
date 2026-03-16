const axios = require("axios");
const Alert = require("../models/Alert");
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY;

const internalHeaders = {
  headers: { "x-internal-key": INTERNAL_API_KEY }
};

const MACHINE_SERVICE_URL = process.env.MACHINE_SERVICE_URL || "http://localhost:3001";
const SCHEDULER_SERVICE_URL = process.env.SCHEDULER_SERVICE_URL || "http://localhost:3002";

async function hasActiveInProgressTask(machineId) {
  try {
    const { data } = await axios.get(
      `${SCHEDULER_SERVICE_URL}/api/tasks/machine/${machineId}`,
      internalHeaders
    );
    const tasks = data.data || [];
    return tasks.some(t => t.status === "In Progress");
  } catch (err) {
    console.error(`[alert-service] Could not fetch tasks for machine ${machineId}:`, err.message);
    return false;
  }
}

async function runOverdueCheck() {
  try {
    const { data } = await axios.get(`${MACHINE_SERVICE_URL}/api/machines`, internalHeaders);
    const machines = data.data || [];

    for (const machine of machines) {
      const daysOverdue = machine.days_overdue || 0;

      if (daysOverdue > 0) {
        let alertType = "Overdue";
        if (daysOverdue > 30) alertType = "Critical";

        const message = `${machine.name} is ${daysOverdue} day(s) overdue for maintenance. Last serviced: ${machine.last_maintenance_date}.`;

        await Alert.upsertAlert(machine.machine_id, machine.name, alertType, message, daysOverdue);

        // Only respect Under Maintenance if there is actually an In Progress task
        if (machine.status === 'Under Maintenance') {
          const activeTask = await hasActiveInProgressTask(machine.machine_id);
          if (!activeTask) {
            await axios.patch(
              `${MACHINE_SERVICE_URL}/api/machines/${machine.machine_id}`,
              { status: 'Needs Maintenance' },
              internalHeaders
            );
          }
        } else {
          await axios.patch(
            `${MACHINE_SERVICE_URL}/api/machines/${machine.machine_id}`,
            { status: 'Needs Maintenance' },
            internalHeaders
          );
        }

        console.log(`[alert-service] Alert raised for machine ${machine.machine_id}: ${alertType}`);

      } else if (daysOverdue >= -7) {
        const dueSoonMessage = `${machine.name} is due for maintenance on ${machine.next_due_date}.`;
        await Alert.upsertAlert(machine.machine_id, machine.name, "Due Soon", dueSoonMessage, 0);
        console.log(`[alert-service] Due-soon alert for machine ${machine.machine_id}`);

      } else {
        await Alert.resolveAlertsByMachine(machine.machine_id);

        if (machine.status === 'Needs Maintenance') {
          await axios.patch(
            `${MACHINE_SERVICE_URL}/api/machines/${machine.machine_id}`,
            { status: 'Operational' },
            internalHeaders
          );
        }

        // If Under Maintenance but no active tasks, reset to Operational
        if (machine.status === 'Under Maintenance') {
          const activeTask = await hasActiveInProgressTask(machine.machine_id);
          if (!activeTask) {
            await axios.patch(
              `${MACHINE_SERVICE_URL}/api/machines/${machine.machine_id}`,
              { status: 'Operational' },
              internalHeaders
            );
          }
        }
      }
    }

    console.log(`[alert-service] Overdue check complete. Processed ${machines.length} machines.`);
  } catch (err) {
    console.error("[alert-service] Overdue check failed:", err.message);
  }
}

module.exports = { runOverdueCheck };