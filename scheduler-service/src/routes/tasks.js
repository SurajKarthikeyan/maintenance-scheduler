const express = require("express");
const router = express.Router();
const controller = require("../controllers/taskController");

// GET  /api/tasks                          - list all (optional ?machine_id= ?status= filters)
// POST /api/tasks                          - create a task
// GET  /api/tasks/upcoming?days=7          - tasks due within N days
// GET  /api/tasks/overdue                  - tasks past their scheduled date
// GET  /api/tasks/machine/:machineId       - all tasks for a specific machine
// GET  /api/tasks/:id                      - single task
// PATCH /api/tasks/:id                     - update task (triggers machine status sync)
// DELETE /api/tasks/:id                    - delete task

router.get("/upcoming",              controller.getUpcomingTasks);
router.get("/overdue",               controller.getOverdueTasks);
router.get("/machine/:machineId",    controller.getTasksByMachine);

router.route("/")
  .get(controller.listTasks)
  .post(controller.createTask);

router.route("/:id")
  .get(controller.getTask)
  .patch(controller.updateTask)
  .delete(controller.deleteTask);

module.exports = router;
