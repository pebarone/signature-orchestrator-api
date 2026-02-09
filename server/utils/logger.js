// Logger Utility - Winston-based logging
const { createLogger, format, transports } = require("winston");
const paths = require("../config/paths");

const logFormat = format.printf(({ timestamp, level, message }) => {
  return `[${timestamp}] ${level.toUpperCase()}: ${message}`;
});

const logger = createLogger({
  level: "info",
  format: format.combine(
    format.timestamp({
      format: () => new Date().toISOString().replace("Z", " UTC"),
    }),
    format.errors({ stack: true }),
    format.splat(),
    format.json(),
  ),
  transports: [
    new transports.File({
      filename: paths.logs.error,
      level: "error",
      format: format.combine(format.timestamp(), logFormat),
    }),
    new transports.File({
      filename: paths.logs.audit,
      level: "info",
      format: format.combine(format.timestamp(), logFormat),
    }),
    // Console output for all environments
    new transports.Console({
      format: format.combine(format.colorize(), logFormat),
    }),
  ],
});

module.exports = logger;
