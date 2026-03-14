require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const machineRoutes = require("./routes/machines");
const authRoutes = require("./routes/auth");
const { requireAuth } = require("./middleware/auth");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(morgan("dev"));
app.use(express.json());

// Health check — public
app.get("/health", (req, res) => {
  res.json({ service: "machine-service", status: "ok", timestamp: new Date() });
});

// Auth routes — login is public, other auth routes handle their own protection
app.use("/api/auth", authRoutes);

// Machine routes — all protected, require valid JWT
app.use("/api/machines", requireAuth, machineRoutes);

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
  console.log(`[machine-service] Running on port ${PORT}`);
});