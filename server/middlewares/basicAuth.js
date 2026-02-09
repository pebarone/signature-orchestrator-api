// Basic Authentication Middleware
const config = require("../config");

/**
 * Basic Auth middleware for protected endpoints like /logs and /auth.
 * Validates credentials against LOG_USER and LOG_PASS env vars.
 */
function basicAuth(req, res, next) {
  const auth = req.headers.authorization;

  if (!auth || !auth.startsWith("Basic ")) {
    res.set("WWW-Authenticate", 'Basic realm="Logs"');
    return res.status(401).json({
      success: false,
      error: "Authentication required.",
    });
  }

  const credentials = Buffer.from(auth.split(" ")[1], "base64").toString();
  const [user, pass] = credentials.split(":");

  if (user !== config.security.logUser || pass !== config.security.logPass) {
    res.set("WWW-Authenticate", 'Basic realm="Logs"');
    return res.status(401).json({
      success: false,
      error: "Invalid credentials.",
    });
  }

  next();
}

module.exports = basicAuth;
