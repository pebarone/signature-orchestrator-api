// File System Paths - Dev vs Production
const path = require("path");
const fs = require("fs");
const config = require("./index");

const paths = {
  // Temp file storage for documents in process
  inProcess: config.isProduction
    ? "/tmp/inprocess"
    : path.join(__dirname, "../inprocess"),

  // Agreement mapping file
  agreementsMap: config.isProduction
    ? "/tmp/agreements.json"
    : path.join(__dirname, "../serverModules/agreements.json"),

  // Token storage
  tokens: config.isProduction
    ? "/tmp/tokens.json"
    : path.resolve(__dirname, "../../tokens.json"),

  // Log files
  logs: {
    audit: config.isProduction
      ? "/tmp/audit.log"
      : path.join(__dirname, "../logs/audit.log"),
    error: config.isProduction
      ? "/tmp/error.log"
      : path.join(__dirname, "../logs/error.log"),
  },

  // Static files
  static: path.join(__dirname, "../../static"),
};

// Ensure directories exist
const ensureDirectories = () => {
  if (config.isProduction && !fs.existsSync("/tmp")) {
    fs.mkdirSync("/tmp", { recursive: true });
  }
  if (!fs.existsSync(paths.inProcess)) {
    fs.mkdirSync(paths.inProcess, { recursive: true });
  }
};

ensureDirectories();

module.exports = paths;
