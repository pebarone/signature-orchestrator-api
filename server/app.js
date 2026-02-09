// app.js - Main Application Entry Point (Refactored)
// =====================================================
// This is the slim entry point for the signature orchestrator API.
// All business logic has been moved to services, controllers, and routes.

const express = require("express");
const cors = require("cors");
const path = require("path");
const axios = require("axios");

// Configuration
const config = require("./config");
const paths = require("./config/paths");
const {
  JSON_BODY_LIMIT,
  KEEPALIVE_INTERVAL_MS,
} = require("./config/constants");

// Middlewares
const {
  requestLogger,
  notFoundHandler,
  errorHandler,
} = require("./middlewares");

// Routes
const { registerRoutes } = require("./routes");

// Logger
const logger = require("./utils/logger");

// ===== Initialize Express =====
const app = express();

// ===== Global Middlewares =====
app.use(cors());
app.use(express.json({ limit: JSON_BODY_LIMIT }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(paths.static));

// Request logging
app.use(requestLogger);

// ===== Register Routes =====
registerRoutes(app);

// ===== Error Handlers =====
app.use(notFoundHandler);
app.use(errorHandler);

// ===== Keepalive (Production Only) =====
if (config.isProduction) {
  setInterval(() => {
    axios
      .get(`${config.server.ngrokHost}/health`)
      .then(() => console.log("[KEEPALIVE] Internal ping OK"))
      .catch((err) =>
        console.log(`[KEEPALIVE] Internal ping failed: ${err.message}`),
      );
  }, KEEPALIVE_INTERVAL_MS);
}

// ===== Server Startup =====
app.listen(config.port, () => {
  logger.info(
    `Server started successfully\n` +
      `  → Local:  http://localhost:${config.port}\n` +
      `  → Ngrok:  ${config.server.ngrokHost}\n\n`,
  );
});

// ===== Graceful Shutdown =====
process.on("SIGTERM", () => {
  logger.info("SIGTERM signal received: closing HTTP server");
  process.exit(0);
});

process.on("SIGINT", () => {
  logger.info("SIGINT signal received: closing HTTP server");
  process.exit(0);
});
