// Agreements Routes - Signature workflow endpoints
const express = require("express");
const router = express.Router();
const { agreementsController } = require("../controllers");
const { verifySignature } = require("../middlewares");

// Start signature workflow (HMAC protected)
// POST /start - for backward compatibility
router.post("/start", verifySignature, agreementsController.startSignature);

// RESTful alternative: POST /agreements
router.post(
  "/agreements",
  verifySignature,
  agreementsController.startSignature,
);

module.exports = router;
