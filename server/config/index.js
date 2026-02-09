// Configuration Module - Centralizes all environment variables
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

const config = {
  env: process.env.NODE_ENV || "development",
  port: process.env.PORT || 3000,
  isProduction: process.env.NODE_ENV === "production",

  adobe: {
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    apiBase: "https://api.na4.adobesign.com",
    authBase: "https://secure.na4.adobesign.com",
    scopes: [
      "agreement_send:account",
      "agreement_write:account",
      "agreement_read:account",
      "account_read:account",
      "account_write:account",
      "user_login:account",
    ],
  },

  otcs: {
    baseUrl: process.env.OTCS_BASE,
    username: process.env.OTCS_USER,
    password: process.env.OTCS_PASS,
  },

  security: {
    signatureSecret: process.env.SIGNATURE_SECRET,
    logUser: process.env.LOG_USER,
    logPass: process.env.LOG_PASS,
  },

  server: {
    ngrokHost: "https://signature-orchestrator-api-1.onrender.com",
    get redirectUri() {
      return `${this.ngrokHost}/admin/callback`;
    },
  },
};

// Validate required configuration
const validateConfig = () => {
  const required = [
    ["adobe.clientId", config.adobe.clientId],
    ["adobe.clientSecret", config.adobe.clientSecret],
    ["security.signatureSecret", config.security.signatureSecret],
  ];

  const missing = required.filter(([, value]) => !value).map(([key]) => key);

  if (missing.length > 0 && config.isProduction) {
    console.warn(`[CONFIG] Missing required env vars: ${missing.join(", ")}`);
  }
};

validateConfig();

module.exports = config;
