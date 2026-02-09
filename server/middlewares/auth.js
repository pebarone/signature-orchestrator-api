// HMAC Signature Verification Middleware
const crypto = require("crypto");
const config = require("../config");
const { SIGNATURE_MAX_AGE_MS } = require("../config/constants");

/**
 * Middleware that verifies HMAC signature and timestamp for sensitive requests.
 * Used for /start endpoint to ensure request authenticity.
 */
function verifySignature(req, res, next) {
  const { signature, timestamp } = req.body;

  // Check required fields
  if (!signature || !timestamp) {
    return res.status(401).json({
      success: false,
      error: "Missing signature or timestamp.",
    });
  }

  // Validate signature format (64-char hex)
  if (!/^[a-f0-9]{64}$/i.test(signature)) {
    return res.status(400).json({
      success: false,
      error: "Malformed signature.",
    });
  }

  // Check timestamp freshness (2 minutes window)
  const age = Math.abs(Date.now() - Number(timestamp));
  if (age > SIGNATURE_MAX_AGE_MS) {
    return res.status(403).json({
      success: false,
      error: "Timestamp expired.",
    });
  }

  // Timing-safe comparison of signatures
  const expected = crypto
    .createHmac("sha256", config.security.signatureSecret)
    .update(timestamp)
    .digest();
  const received = Buffer.from(signature, "hex");

  if (
    expected.length !== received.length ||
    !crypto.timingSafeEqual(expected, received)
  ) {
    return res.status(403).json({
      success: false,
      error: "Invalid signature.",
    });
  }

  next();
}

module.exports = verifySignature;
