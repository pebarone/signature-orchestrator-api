// Health Controller - Health check handler
const { success } = require("../utils/response");

/**
 * Simple health check endpoint.
 */
function getHealth(req, res) {
  success(res, { status: "ok" });
}

module.exports = {
  getHealth,
};
