// Logs Routes - Log streaming and download endpoints
const express = require("express");
const router = express.Router();
const { logsController } = require("../controllers");
const { basicAuth } = require("../middlewares");

// Stream logs via SSE (Basic Auth protected)
router.get("/logs/stream", basicAuth, logsController.streamLogs);

// Download log file (Basic Auth protected)
router.get("/logs", basicAuth, logsController.downloadLogs);

module.exports = router;
