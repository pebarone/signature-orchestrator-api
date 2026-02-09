// Main Router - Aggregates all route modules
const authRoutes = require("./auth.routes");
const agreementsRoutes = require("./agreements.routes");
const webhookRoutes = require("./webhook.routes");
const logsRoutes = require("./logs.routes");
const healthRoutes = require("./health.routes");

/**
 * Register all routes to the Express app.
 * @param {import('express').Application} app - Express application
 */
function registerRoutes(app) {
  app.use(authRoutes);
  app.use(agreementsRoutes);
  app.use(webhookRoutes);
  app.use(logsRoutes);
  app.use(healthRoutes);
}

module.exports = { registerRoutes };
