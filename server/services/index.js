// Services Index - Barrel export
const tokenService = require("./token.service");
const otcsService = require("./otcs.service");
const workflowService = require("./workflow.service");
const adobeSignService = require("./adobeSign.service");
const agreementsService = require("./agreements.service");

module.exports = {
  tokenService,
  otcsService,
  workflowService,
  adobeSignService,
  agreementsService,
};
