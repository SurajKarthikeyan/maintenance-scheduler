const express = require("express");
const router = express.Router();
const controller = require("../controllers/alertController");

// GET  /api/alerts                     - list all (optional ?resolved= ?machine_id= ?alert_type=)
// GET  /api/alerts/:id                 - single alert
// PATCH /api/alerts/:id/resolve        - mark alert as resolved
// POST /api/alerts/check               - manually trigger overdue check

router.post("/check",           controller.triggerCheck);

router.route("/")
  .get(controller.listAlerts);

router.route("/:id")
  .get(controller.getAlert);

router.patch("/:id/resolve",    controller.resolveAlert);

module.exports = router;
