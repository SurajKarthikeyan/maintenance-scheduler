require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const machineRoutes = require("./routes/machines");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(morgan("dev"));
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ service: "machine-service", status: "ok", timestamp: new Date() });
});

app.use("/api/machines", machineRoutes);

app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Internal server error", message: err.message });
});

app.listen(PORT, () => {
  console.log(`[machine-service] Running on port ${PORT}`);
});