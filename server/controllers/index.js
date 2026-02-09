// Controllers Index - Barrel export
const authController = require("./auth.controller");
const agreementsController = require("./agreements.controller");
const webhookController = require("./webhook.controller");
const logsController = require("./logs.controller");
const healthController = require("./health.controller");

module.exports = {
  authController,
  agreementsController,
  webhookController,
  logsController,
  healthController,
};
