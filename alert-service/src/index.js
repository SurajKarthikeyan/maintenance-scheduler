require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const cron = require("node-cron");
const alertRoutes = require("./routes/alerts");
const { runOverdueCheck } = require("./jobs/overdueCheck");

const app = express();
const PORT = process.env.PORT || 3003;

app.use(cors());
app.use(morgan("dev"));
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ service: "alert-service", status: "ok", timestamp: new Date() });
});

app.use("/api/alerts", alertRoutes);

app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Internal server error", message: err.message });
});

// Cron: run overdue check every hour
cron.schedule("0 * * * *", () => {
  console.log("[alert-service] Running scheduled overdue check...");
  runOverdueCheck();
});

app.listen(PORT, () => {
  console.log(`[alert-service] Running on port ${PORT}`);
  // Run once on startup
  runOverdueCheck();
});
