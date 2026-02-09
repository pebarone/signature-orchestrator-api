// Workflow Service - OTCS workflow operations
const axios = require("axios");
const qs = require("qs");
const config = require("../config");
const { ensureTicket } = require("./otcs.service");
const logger = require("../utils/logger");

/**
 * Send a workflow task forward (SendOn).
 * @param {Object} options - Workflow options
 * @param {string} options.workflowId - Main workflow ID
 * @param {string} options.subworkflowId - Subprocess ID
 * @param {number} options.taskId - Task ID (default: 2)
 * @param {string} options.disposition - Custom action/disposition
 * @param {string} options.comment - Task comment
 * @returns {Promise<Object>} OTCS API response
 */
async function sendOnWorkflow({
  workflowId,
  subworkflowId,
  taskId = 2,
  disposition = "",
  comment = "",
}) {
  const tck = await ensureTicket();
  const url = `${config.otcs.baseUrl}/v2/processes/${workflowId}/subprocesses/${subworkflowId}/tasks/${taskId}`;

  let dataObj;
  if (disposition) {
    dataObj = {
      custom_action: disposition,
      ...(comment && { comment }),
    };
  } else {
    dataObj = {
      action: "sendon",
      ...(comment && { comment }),
    };
  }
  const data = qs.stringify(dataObj);

  const rsp = await axios.put(url, data, {
    headers: {
      OTCSTicket: tck,
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });
  return rsp.data;
}

/**
 * Trigger workflow disposition based on agreement status.
 * @param {Object} agreementInfo - Agreement metadata from MAP
 * @param {string} disposition - Disposition value (e.g., 'Firmado', 'Rechazado')
 */
async function triggerDisposition(agreementInfo, disposition) {
  if (!agreementInfo || !agreementInfo.workflowId) {
    logger.warn("No workflowId stored; disposition skipped");
    return;
  }

  try {
    await sendOnWorkflow({
      workflowId: agreementInfo.workflowId,
      subworkflowId: agreementInfo.subworkflowId || agreementInfo.workflowId,
      taskId: 3,
      disposition,
      comment: `Documento ${disposition.toLowerCase()} via webhook`,
    });
    logger.info(
      `SendOn task 3 (${disposition}) done for workflow ${agreementInfo.workflowId}`,
    );
    return true;
  } catch (e) {
    logger.error(`SendOn task 3 failed: ${e.message}`);
    return false;
  }
}

module.exports = { sendOnWorkflow, triggerDisposition };
