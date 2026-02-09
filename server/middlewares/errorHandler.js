// Global Error Handler Middleware
const logger = require("../utils/logger");
const config = require("../config");

/**
 * Global error handler for unhandled errors.
 * Ensures consistent error response format.
 */
function errorHandler(err, req, res, next) {
  // Log the error
  logger.error(`Unhandled error: ${err.message}`, {
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  // Determine status code
  const statusCode = err.statusCode || err.status || 500;

  // Build error response
  const response = {
    success: false,
    error: err.message || "Internal server error",
  };

  // Include stack trace only in development
  if (!config.isProduction && err.stack) {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
}

/**
 * 404 handler for unknown endpoints.
 */
function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    error: "Endpoint not found",
  });
}

module.exports = { errorHandler, notFoundHandler };
