// Auth Controller - OAuth and HMAC handlers
const crypto = require("crypto");
const axios = require("axios");
const config = require("../config");
const { tokenService } = require("../services");
const logger = require("../utils/logger");
const { success, error } = require("../utils/response");

/**
 * Redirect to Adobe Sign OAuth consent page.
 */
function login(req, res) {
  const scopeParam = config.adobe.scopes.join("+");

  const url =
    `${config.adobe.authBase}/public/oauth/v2?` +
    `response_type=code` +
    `&client_id=${encodeURIComponent(config.adobe.clientId)}` +
    `&redirect_uri=${encodeURIComponent(config.server.redirectUri)}` +
    `&scope=${scopeParam}`;

  console.log("[Adobe OAuth URL]", url);
  res.redirect(url);
}

/**
 * Handle OAuth callback and exchange code for tokens.
 */
async function callback(req, res) {
  const { code } = req.query;

  try {
    const response = await axios.post(
      `${config.adobe.apiBase}/oauth/v2/token`,
      new URLSearchParams({
        grant_type: "authorization_code",
        code,
        client_id: config.adobe.clientId,
        client_secret: config.adobe.clientSecret,
        redirect_uri: config.server.redirectUri,
      }),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } },
    );

    tokenService.setToken(
      response.data.access_token,
      response.data.expires_in,
      response.data.refresh_token,
    );

    logger.info("Token saved successfully");
    res.send("<h1>Token saved</h1>");
  } catch (e) {
    const msg = e.response?.data?.error_description || e.message;
    logger.error(`OAUTH CALLBACK ERROR: ${msg}`);
    res.status(500).send(`<pre>${msg}</pre>`);
  }
}

/**
 * Generate HMAC signature for client requests.
 */
function getSignature(req, res) {
  const timestamp = Date.now().toString();
  const hmac = crypto
    .createHmac("sha256", config.security.signatureSecret)
    .update(timestamp)
    .digest("hex");

  success(res, { timestamp, signature: hmac });
}

module.exports = {
  login,
  callback,
  getSignature,
};
