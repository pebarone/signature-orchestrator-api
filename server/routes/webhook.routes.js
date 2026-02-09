// Webhook Routes - Adobe Sign webhook endpoints
const express = require("express");
const router = express.Router();
const { webhookController } = require("../controllers");
const { JSON_BODY_LIMIT } = require("../config/constants");

// Webhook handshake (HEAD + GET)
router.head("/webhook", webhookController.handleHead);
router.get("/webhook", webhookController.handleChallenge);

// Webhook event notification (POST)
router.post(
  "/webhook",
  express.json({ limit: JSON_BODY_LIMIT }),
  webhookController.handleEvent,
);

module.exports = router;
