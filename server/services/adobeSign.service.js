// Adobe Sign Service - Adobe Sign API operations
const axios = require("axios");
const fs = require("fs");
const FormData = require("form-data");
const { pipeline } = require("stream");
const { promisify } = require("util");
const path = require("path");

const config = require("../config");
const paths = require("../config/paths");
const {
  MAX_FILE_SIZE_MB,
  PDF_DOWNLOAD_MAX_RETRIES,
  PDF_DOWNLOAD_RETRY_DELAY_MS,
} = require("../config/constants");
const { ensureToken } = require("./token.service");
const logger = require("../utils/logger");

const streamPipeline = promisify(pipeline);

/**
 * Upload a document to Adobe Sign as a transient document.
 * @param {string} filePath - Local file path
 * @param {string} fileName - Display name for the file
 * @returns {Promise<string>} Transient document ID
 */
async function uploadTransientDocument(filePath, fileName) {
  const token = await ensureToken();
  const fd = new FormData();
  fd.append("File", fs.createReadStream(filePath), {
    filename: fileName,
    contentType: "application/pdf",
  });

  const response = await axios.post(
    `${config.adobe.apiBase}/api/rest/v6/transientDocuments`,
    fd,
    { headers: { Authorization: `Bearer ${token}`, ...fd.getHeaders() } },
  );

  return response.data.transientDocumentId;
}

/**
 * Create an agreement (envelope) on Adobe Sign.
 * @param {string} transientDocId - Transient document ID
 * @param {string} name - Agreement name
 * @param {string[]} emails - Signer email addresses
 * @returns {Promise<Object>} Agreement creation response
 */
async function createAgreement(transientDocId, name, emails) {
  const token = await ensureToken();

  const response = await axios.post(
    `${config.adobe.apiBase}/api/rest/v6/agreements`,
    {
      name: `Documento ${name}`,
      fileInfos: [{ transientDocumentId: transientDocId }],
      participantSetsInfo: emails.map((email) => ({
        role: "SIGNER",
        order: 1,
        memberInfos: [{ email }],
      })),
      signatureType: "ESIGN",
      state: "IN_PROCESS",
    },
    { headers: { Authorization: `Bearer ${token}` } },
  );

  return response.data;
}

/**
 * Download signed document with audit report from Adobe Sign.
 * @param {string} agreementId - Adobe Sign agreement ID
 * @param {string} fileName - Target file name
 * @returns {Promise<string>} Path to downloaded file
 */
async function downloadSignedDocument(agreementId, fileName) {
  const token = await ensureToken();
  const filePath = path.join(paths.inProcess, fileName);

  const response = await axios.get(
    `${config.adobe.apiBase}/api/rest/v6/agreements/${agreementId}/combinedDocument?attachAuditReport=true`,
    {
      responseType: "stream",
      headers: { Authorization: `Bearer ${token}` },
      maxContentLength: MAX_FILE_SIZE_MB * 1024 * 1024,
    },
  );

  await streamPipeline(response.data, fs.createWriteStream(filePath));
  return filePath;
}

/**
 * Download signed document with retry logic for Adobe race conditions.
 * @param {string} agreementId - Agreement ID
 * @param {string} fileName - Target file name
 * @param {number} retryCount - Current retry attempt
 * @returns {Promise<string|null>} File path or null if failed after retries
 */
async function downloadSignedDocumentWithRetry(
  agreementId,
  fileName,
  retryCount = 0,
) {
  try {
    return await downloadSignedDocument(agreementId, fileName);
  } catch (e) {
    if (e.response?.status === 403 && retryCount < PDF_DOWNLOAD_MAX_RETRIES) {
      logger.info(
        `PDF download 403, retrying in ${PDF_DOWNLOAD_RETRY_DELAY_MS}ms (attempt ${retryCount + 1})`,
      );
      return new Promise((resolve) => {
        setTimeout(async () => {
          resolve(
            await downloadSignedDocumentWithRetry(
              agreementId,
              fileName,
              retryCount + 1,
            ),
          );
        }, PDF_DOWNLOAD_RETRY_DELAY_MS);
      });
    }
    logger.error(`PDF download failed: ${e.message}`);
    return null;
  }
}

module.exports = {
  uploadTransientDocument,
  createAgreement,
  downloadSignedDocument,
  downloadSignedDocumentWithRetry,
};
