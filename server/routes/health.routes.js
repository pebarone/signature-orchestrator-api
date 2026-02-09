// Health Routes - Health check endpoint
const express = require("express");
const router = express.Router();
const { healthController } = require("../controllers");

// Health check
router.get("/health", healthController.getHealth);

module.exports = router;
