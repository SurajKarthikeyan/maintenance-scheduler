const express = require("express");
const router = express.Router();
const controller = require("../controllers/machineController");

// GET    /api/machines              - list all (optional ?status= filter)
// POST   /api/machines              - create a machine
// GET    /api/machines/overdue      - machines past their due date
// GET    /api/machines/:id          - single machine with next_due_date
// PATCH  /api/machines/:id          - update fields (incl. status)
// DELETE /api/machines/:id          - delete machine

router.get("/overdue", controller.getOverdueMachines);

router.route("/")
  .get(controller.listMachines)
  .post(controller.createMachine);

router.route("/:id")
  .get(controller.getMachine)
  .patch(controller.updateMachine)
  .delete(controller.deleteMachine);

module.exports = router;
