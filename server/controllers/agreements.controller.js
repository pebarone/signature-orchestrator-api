// Agreements Controller - Signature workflow handlers
const fs = require("fs");
const path = require("path");
const paths = require("../config/paths");
const {
  tokenService,
  otcsService,
  adobeSignService,
  agreementsService,
  workflowService,
} = require("../services");
const logger = require("../utils/logger");
const { success, error, created, HttpStatus } = require("../utils/response");
const { parseEmails, isValidId } = require("../utils/validation");

/**
 * Start signature workflow.
 * Downloads document from OTCS, uploads to Adobe Sign, creates agreement.
 */
async function startSignature(req, res) {
  const {
    userEmail1,
    userEmail2,
    nodeId,
    attachId,
    workflowId,
    subworkflowId,
    taskId,
    docName,
  } = req.body;

  // Validate and parse emails
  const emails = parseEmails(userEmail1, userEmail2);
  if (!emails.length || !nodeId) {
    return error(
      res,
      "Node ID and Email are mandatory.",
      HttpStatus.BAD_REQUEST,
    );
  }
  if (!isValidId(attachId)) {
    return error(res, "attachId is mandatory.", HttpStatus.BAD_REQUEST);
  }

  // Check for duplicate submission
  if (agreementsService.isDuplicate(nodeId, emails)) {
    return error(
      res,
      "El documento ya he sido enviado recientemente a este destinatario.",
      HttpStatus.CONFLICT,
    );
  }

  // Ensure we have valid Adobe token
  let token;
  try {
    token = await tokenService.ensureToken();
  } catch {
    return error(res, "LOGIN_REQUIRED", HttpStatus.UNAUTHORIZED);
  }

  try {
    // Download PDF from OTCS
    const original = await otcsService.downloadNode(nodeId);
    const fileName = docName?.trim() || `document_${nodeId}.pdf`;
    const filePath = path.join(paths.inProcess, fileName);
    fs.writeFileSync(filePath, original);

    // Upload to Adobe Sign
    const transientDocId = await adobeSignService.uploadTransientDocument(
      filePath,
      fileName,
    );

    // Create agreement
    const agreement = await adobeSignService.createAgreement(
      transientDocId,
      fileName,
      emails,
    );

    // Store agreement metadata
    agreementsService.create(agreement.id, {
      nodeId,
      attachId,
      fileName,
      workflowId,
      subworkflowId,
      emails,
    });

    logger.info(`Signature requested: ${agreement.id}`);

    // Trigger sendOnWorkflow in background (non-blocking)
    if (workflowId) {
      workflowService
        .sendOnWorkflow({
          workflowId,
          subworkflowId: subworkflowId || workflowId,
          taskId: taskId || 2,
          comment: "Documento enviado para assinatura – etapa automatizada",
        })
        .then(() => {
          logger.info(
            `SendOn automático realizado para workflow ${workflowId}`,
          );
        })
        .catch((e) => {
          logger.error(
            `Falha no SendOn automático: ${e.message} | OTCS: ${JSON.stringify(e.response?.data)}`,
          );
        });
    }

    // Return success response
    success(res, { message: `Signature requested. ID: ${agreement.id}` });
  } catch (e) {
    const raw = e.response?.data;
    const errorMsg = Buffer.isBuffer(raw)
      ? raw.toString()
      : JSON.stringify(raw || e.message);
    logger.error(`[START ERROR] ${errorMsg}`);
    error(res, raw || e.message, HttpStatus.INTERNAL_ERROR);
  }
}

module.exports = {
  startSignature,
};
