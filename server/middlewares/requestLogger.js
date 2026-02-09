// Request Logger Middleware
const logger = require("../utils/logger");

let lastRouteGroup = null;

/**
 * Middleware that logs all incoming requests.
 * Special handling for /start endpoint to log document details.
 */
function requestLogger(req, res, next) {
  const currentGroup = `${req.method} ${req.path}`;

  // Visual grouping for console output
  if (lastRouteGroup && lastRouteGroup !== currentGroup) {
    console.log("");
  }
  lastRouteGroup = currentGroup;

  // Enhanced logging for signature requests
  if (req.method === "POST" && req.path === "/start") {
    const { userEmail1, userEmail2, nodeId, attachId, docName } = req.body;
    const emails = [userEmail1, userEmail2].filter(Boolean).join(", ");
    logger.info(
      `Signature request initiated\n` +
        `  → Document: ${decodeURIComponent(docName || "?")}\n` +
        `  → Node ID: ${nodeId}\n` +
        `  → Target Folder ID: ${attachId}\n` +
        `  → Recipients: ${emails}`,
    );
  }

  next();
}

module.exports = requestLogger;
