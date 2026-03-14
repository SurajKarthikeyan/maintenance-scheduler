require("dotenv").config();
const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const cors = require("cors");
const morgan = require("morgan");

const app = express();
const PORT = process.env.PORT || 8080;

/**
 * Downstream service URLs — injected via environment variables
 * Allows different URLs for local development vs production (Railway)
 */
const MACHINE_SERVICE_URL   = process.env.MACHINE_SERVICE_URL   || "http://localhost:3001";
const SCHEDULER_SERVICE_URL = process.env.SCHEDULER_SERVICE_URL || "http://localhost:3002";
const ALERT_SERVICE_URL     = process.env.ALERT_SERVICE_URL     || "http://localhost:3003";

// Handle CORS preflight requests before any routes
app.options('*', cors());
app.use(cors());
app.use(morgan("dev"));

/**
 * Health check endpoint — returns gateway status and upstream URLs
 * Useful for verifying all services are correctly wired up
 */
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

/**
 * Proxy /api/machines/* → Machine Service
 * Handles machine registry, status, and due date queries
 */
app.use("/api/machines", createProxyMiddleware({
  target: MACHINE_SERVICE_URL,
  changeOrigin: true,
  on: {
    proxyRes: (proxyRes) => {
      proxyRes.headers['Access-Control-Allow-Origin'] = '*'
    }
  }
}));

/**
 * Proxy /api/tasks/* → Scheduler Service
 * Handles task scheduling, updates, and inter-service status sync
 */
app.use("/api/tasks", createProxyMiddleware({
  target: SCHEDULER_SERVICE_URL,
  changeOrigin: true,
  on: {
    proxyRes: (proxyRes) => {
      proxyRes.headers['Access-Control-Allow-Origin'] = '*'
    }
  }
}));

/**
 * Proxy /api/alerts/* → Alert Service
 * Handles overdue alerts, manual checks, and alert resolution
 */
app.use("/api/alerts", createProxyMiddleware({
  target: ALERT_SERVICE_URL,
  changeOrigin: true,
  on: {
    proxyRes: (proxyRes) => {
      proxyRes.headers['Access-Control-Allow-Origin'] = '*'
    }
  }
}));

// 404 handler for unmatched routes
app.use((req, res) => {
  res.status(404).json({ error: "No matching gateway route" });
});

app.listen(PORT, () => {
  console.log(`[gateway] Running on port ${PORT}`);
});