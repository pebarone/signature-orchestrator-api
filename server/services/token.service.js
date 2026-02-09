// Token Service - Adobe Sign OAuth token management
const fs = require("fs");
const axios = require("axios");
const config = require("../config");
const paths = require("../config/paths");
const logger = require("../utils/logger");

let tok = { access_token: "", refresh_token: "", expires_at: 0 };

/**
 * Load tokens from persistent storage.
 */
function load() {
  if (fs.existsSync(paths.tokens)) {
    try {
      const content = fs.readFileSync(paths.tokens, "utf8");
      tok = JSON.parse(content);
    } catch (err) {
      logger.error("Failed to read tokens.json:", err.message);
    }
  } else {
    logger.warn("tokens.json NOT FOUND");
  }
}

/**
 * Save tokens to persistent storage.
 */
function save() {
  fs.writeFileSync(paths.tokens, JSON.stringify(tok, null, 2));
}

/**
 * Set new token values.
 * @param {string} accessToken - New access token
 * @param {number} expiresInSec - Token lifetime in seconds
 * @param {string} refreshToken - New refresh token (optional)
 */
function setToken(accessToken, expiresInSec, refreshToken) {
  tok.access_token = accessToken;
  tok.expires_at = Date.now() + expiresInSec * 1000;
  if (refreshToken) tok.refresh_token = refreshToken;
  save();
}

/**
 * Ensure we have a valid access token, refreshing if necessary.
 * @returns {Promise<string>} Valid access token
 * @throws {Error} If refresh fails or no refresh token available
 */
async function ensureToken() {
  const now = Date.now();

  // Return existing token if still valid (with 30s buffer)
  if (tok.access_token && now < tok.expires_at - 30000) {
    return tok.access_token;
  }

  if (!tok.refresh_token) {
    logger.error("Missing refresh token");
    throw new Error("REFRESH_TOKEN_MISSING");
  }

  try {
    const rsp = await axios.post(
      `${config.adobe.apiBase}/oauth/v2/refresh`,
      new URLSearchParams({
        grant_type: "refresh_token",
        client_id: config.adobe.clientId,
        client_secret: config.adobe.clientSecret,
        refresh_token: tok.refresh_token,
      }),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } },
    );
    setToken(
      rsp.data.access_token,
      rsp.data.expires_in,
      rsp.data.refresh_token,
    );
    return tok.access_token;
  } catch (err) {
    logger.error("Refresh failed:", err.response?.data || err.message);
    throw err;
  }
}

// Load tokens on module initialization
load();

module.exports = { setToken, ensureToken };
