require("dotenv").config();
const express = require("express");
const proxy = require("express-http-proxy");
const cors = require("cors");
const morgan = require("morgan");

const app = express();
const PORT = process.env.PORT || 8080;

const MACHINE_SERVICE_URL   = process.env.MACHINE_SERVICE_URL   || "http://localhost:3001";
const SCHEDULER_SERVICE_URL = process.env.SCHEDULER_SERVICE_URL || "http://localhost:3002";
const ALERT_SERVICE_URL     = process.env.ALERT_SERVICE_URL     || "http://localhost:3003";

app.options('*', cors());
app.use(cors());
app.use(morgan("dev"));

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

// Auth routes — proxy to machine-service, public
app.use("/api/auth", proxy(MACHINE_SERVICE_URL, {
  proxyReqPathResolver: (req) => `/api/auth${req.url}`,
  proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
    proxyReqOpts.headers['Access-Control-Allow-Origin'] = '*';
    return proxyReqOpts;
  }
}));

// Machine routes
app.use("/api/machines", proxy(MACHINE_SERVICE_URL, {
  proxyReqPathResolver: (req) => `/api/machines${req.url === '/' ? '' : req.url}`,
  proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
    if (srcReq.headers.authorization) {
      proxyReqOpts.headers['Authorization'] = srcReq.headers.authorization;
    }
    return proxyReqOpts;
  }
}));

// Task routes
app.use("/api/tasks", proxy(SCHEDULER_SERVICE_URL, {
  proxyReqPathResolver: (req) => `/api/tasks${req.url === '/' ? '' : req.url}`,
  proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
    if (srcReq.headers.authorization) {
      proxyReqOpts.headers['Authorization'] = srcReq.headers.authorization;
    }
    return proxyReqOpts;
  }
}));

// Alert routes
app.use("/api/alerts", proxy(ALERT_SERVICE_URL, {
  proxyReqPathResolver: (req) => `/api/alerts${req.url === '/' ? '' : req.url}`,
  proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
    if (srcReq.headers.authorization) {
      proxyReqOpts.headers['Authorization'] = srcReq.headers.authorization;
    }
    return proxyReqOpts;
  }
}));

app.use((req, res) => {
  res.status(404).json({ error: "No matching gateway route" });
});

app.listen(PORT, () => {
  console.log(`[gateway] Running on port ${PORT}`);
});