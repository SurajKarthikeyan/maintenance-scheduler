require("dotenv").config();
const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
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

app.use("/api/machines", createProxyMiddleware({
  target: MACHINE_SERVICE_URL,
  changeOrigin: true,
  on: {
    proxyRes: (proxyRes) => {
      proxyRes.headers['Access-Control-Allow-Origin'] = '*'
    }
  }
}));

app.use("/api/tasks", createProxyMiddleware({
  target: SCHEDULER_SERVICE_URL,
  changeOrigin: true,
  on: {
    proxyRes: (proxyRes) => {
      proxyRes.headers['Access-Control-Allow-Origin'] = '*'
    }
  }
}));

app.use("/api/alerts", createProxyMiddleware({
  target: ALERT_SERVICE_URL,
  changeOrigin: true,
  on: {
    proxyRes: (proxyRes) => {
      proxyRes.headers['Access-Control-Allow-Origin'] = '*'
    }
  }
}));

app.use((req, res) => {
  res.status(404).json({ error: "No matching gateway route" });
});

app.listen(PORT, () => {
  console.log(`[gateway] Running on port ${PORT}`);
});