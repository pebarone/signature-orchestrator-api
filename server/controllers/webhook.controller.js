// Webhook Controller - Adobe Sign webhook handlers
const fs = require("fs");
const config = require("../config");
const { PDF_EVENTS, FINAL_OK_EVENTS } = require("../config/constants");
const {
  agreementsService,
  adobeSignService,
  otcsService,
  workflowService,
} = require("../services");
const logger = require("../utils/logger");

/**
 * Handle webhook handshake (HEAD request).
 * Required by Adobe for webhook validation.
 */
function handleHead(req, res) {
  res.setHeader("X-AdobeSign-ClientId", config.adobe.clientId);
  res.setHeader("Content-Type", "application/json");
  res.status(200).end();
}

/**
 * Handle webhook challenge (GET request).
 */
function handleChallenge(req, res) {
  const cid = req.headers["x-adobesign-clientid"] || config.adobe.clientId;

  if (req.query.challenge) {
    res.setHeader("X-AdobeSign-ClientId", cid);
    res.setHeader("Content-Type", "text/plain");
    return res.status(200).send(`${req.query.challenge}`);
  }

  res.setHeader("X-AdobeSign-ClientId", cid);
  res.setHeader("Content-Type", "application/json");
  return res.status(200).json({ status: "pong" });
}

/**
 * Handle webhook event notification (POST request).
 * Processes signature events from Adobe Sign.
 */
async function handleEvent(req, res) {
  const cid =
    req.headers["x-adobesign-clientid"] ||
    req.headers["x-adobesign-client-id"] ||
    config.adobe.clientId;
  res.setHeader("X-AdobeSign-ClientId", cid);

  // Parse payload
  let payload = {};
  try {
    payload =
      typeof req.body === "object" ? req.body : JSON.parse(req.body.toString());
  } catch (err) {
    logger.error(`Webhook parse error: ${err.message}`);
    return res.status(400).send("Invalid webhook payload");
  }

  // Extract event info
  const agreementId =
    payload.event?.agreementId || payload.agreement?.id || payload.agreementId;
  const evt =
    payload.event?.eventType ||
    payload.event ||
    payload.type ||
    "UNKNOWN_EVENT";
  const participant =
    payload.event?.participantUserEmail ||
    payload.participantUserEmail ||
    "unknown";
  const timestamp = payload.event?.eventDate || new Date().toISOString();

  logger.info(
    `Webhook received\n` +
      `  → Event: ${evt}\n` +
      `  → Agreement ID: ${agreementId}\n` +
      `  → Participant: ${participant}\n` +
      `  → Date: ${timestamp}`,
  );

  // Get agreement info
  const info = agreementsService.getById(agreementId);

  // Process PDF events
  if (PDF_EVENTS.includes(evt) && info) {
    try {
      await processSignatureEvent(agreementId, info, evt);
    } catch (err) {
      logger.error(`Erro durante PDF+SendOn: ${err.message}`);
    }
    return res.status(200).send("OK");
  }

  res.status(200).send("OK");
}

/**
 * Process signature event - download PDF and trigger workflow.
 */
async function processSignatureEvent(agreementId, info, evt) {
  const fileName = info.fileName?.trim() || `node_${info.nodeId}.pdf`;

  // Download signed PDF
  const filePath = await adobeSignService.downloadSignedDocumentWithRetry(
    agreementId,
    fileName,
  );

  if (filePath) {
    logger.info(`PDF Overwritten: ${filePath}`);

    // Upload to OTCS folder
    const fileBuffer = fs.readFileSync(filePath);
    await otcsService.uploadToFolder(info.attachId, fileBuffer, fileName);
    logger.info(`Sent to folder ${info.attachId} on Content Server`);
  }

  // Trigger workflow disposition if not already done
  if (!info.sendonDone) {
    if (evt === "AGREEMENT_REJECTED") {
      const success = await workflowService.triggerDisposition(
        info,
        "Rechazado",
      );
      if (success) agreementsService.markSendOnDone(agreementId);
    } else if (FINAL_OK_EVENTS.includes(evt)) {
      const success = await workflowService.triggerDisposition(info, "Firmado");
      if (success) agreementsService.markSendOnDone(agreementId);
    }
  }
}

module.exports = {
  handleHead,
  handleChallenge,
  handleEvent,
};
