require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const taskRoutes = require("./routes/tasks");

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(morgan("dev"));
app.use(express.json());

/**
 * Health check endpoint
 */
app.get("/health", (req, res) => {
  res.json({ service: "scheduler-service", status: "ok", timestamp: new Date() });
});

/**
 * Task routes — handles scheduling, updates and inter-service sync
 * Updating a task status triggers a call to Machine Service
 */
app.use("/api/tasks", taskRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Internal server error", message: err.message });
});

app.listen(PORT, () => {
  console.log(`[scheduler-service] Running on port ${PORT}`);
});