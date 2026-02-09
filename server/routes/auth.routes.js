// Auth Routes - OAuth and authentication endpoints
const express = require("express");
const router = express.Router();
const { authController } = require("../controllers");
const { basicAuth } = require("../middlewares");

// OAuth flow
router.get("/admin/login", authController.login);
router.get("/admin/callback", authController.callback);

// HMAC signature endpoint (protected)
router.get("/auth", basicAuth, authController.getSignature);

module.exports = router;
