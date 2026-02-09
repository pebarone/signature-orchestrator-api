// Middleware Index - Barrel export
const verifySignature = require("./auth");
const basicAuth = require("./basicAuth");
const requestLogger = require("./requestLogger");
const { errorHandler, notFoundHandler } = require("./errorHandler");

module.exports = {
  verifySignature,
  basicAuth,
  requestLogger,
  errorHandler,
  notFoundHandler,
};
