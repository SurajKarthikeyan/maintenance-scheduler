require("dotenv").config();
const express = require("express");
const proxy = require("express-http-proxy");
const cors = require("cors");
const morgan = require("morgan");

const app = express();
const PORT = process.env.PORT || 8080;

const MACHINE_SERVICE_URL  = process.env.MACHINE_SERVICE_URL  || "http://localhost:3001";
const SCHEDULER_SERVICE_URL = process.env.SCHEDULER_SERVICE_URL || "http://localhost:3002";
const ALERT_SERVICE_URL    = process.env.ALERT_SERVICE_URL    || "http://localhost:3003";

app.use(cors());
app.use(morgan("dev"));

// Gateway health check
app.get("/health", (req, res) => {
  res.json({
    service: "gateway",
    status: "ok",
    timestamp: new Date(),
    upstreams: {
      machines: MACHINE_SERVICE_URL,
      scheduler: SCHEDULER_SERVICE_URL,
      alerts: ALERT_SERVICE_URL,
    },
  });
});

// Route: /api/machines -> machine-service
app.use("/api/machines", proxy(MACHINE_SERVICE_URL, {
  proxyReqPathResolver: (req) => {
    const path = `/api/machines${req.url}`
    return path.endsWith('/') ? path.slice(0, -1) : path
  },
}))

// Route: /api/tasks -> scheduler-service
app.use("/api/tasks", proxy(SCHEDULER_SERVICE_URL, {
  proxyReqPathResolver: (req) => {
    const path = `/api/tasks${req.url}`
    return path.endsWith('/') ? path.slice(0, -1) : path
  },
}))

// Route: /api/alerts -> alert-service
app.use("/api/alerts", proxy(ALERT_SERVICE_URL, {
  proxyReqPathResolver: (req) => {
    const path = `/api/alerts${req.url}`
    return path.endsWith('/') ? path.slice(0, -1) : path
  },
}))

app.use((req, res) => {
  res.status(404).json({ error: "No matching gateway route" });
});

app.listen(PORT, () => {
  console.log(`[gateway] Running on port ${PORT}`);
});
