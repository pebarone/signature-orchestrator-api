// OTCS Service - OpenText Content Server operations
const axios = require("axios");
const FormData = require("form-data");
const config = require("../config");

let ticket = "";
let expiresAt = 0;

/**
 * Ensure we have a valid OTCS ticket, authenticating if needed.
 * @returns {Promise<string>} Valid OTCS ticket
 */
async function ensureTicket() {
  if (ticket && Date.now() < expiresAt - 30000) return ticket;

  const rsp = await axios.post(
    `${config.otcs.baseUrl}/v1/auth`,
    { username: config.otcs.username, password: config.otcs.password },
    { headers: { "Content-Type": "application/json" } },
  );

  ticket = rsp.data.ticket || rsp.data.otdsToken;
  const ttl = rsp.data.validFor || 1800;
  expiresAt = Date.now() + ttl * 1000;
  return ticket;
}

/**
 * Download a document from OTCS.
 * @param {string|number} nodeId - OTCS node ID
 * @param {number} version - Document version (default: 1)
 * @returns {Promise<Buffer>} Document buffer
 */
async function downloadNode(nodeId, version = 1) {
  const tck = await ensureTicket();
  const url = `${config.otcs.baseUrl}/v1/nodes/${nodeId}/versions/${version}/content`;

  const rsp = await axios.get(url, {
    responseType: "arraybuffer",
    headers: { OTCSTicket: tck },
  });

  return rsp.data;
}

/**
 * Upload a document to an OTCS folder.
 * Creates new version if document exists, otherwise creates new document.
 * @param {string|number} folderId - Target folder ID
 * @param {Buffer} buffer - Document content
 * @param {string} fileName - Document name
 * @returns {Promise<Object>} OTCS API response
 */
async function uploadToFolder(folderId, buffer, fileName) {
  const tck = await ensureTicket();

  // Check if document already exists in folder
  const searchUrl = `${config.otcs.baseUrl}/v1/nodes/${folderId}/nodes?where_name=${encodeURIComponent(fileName)}`;
  const existing = await axios.get(searchUrl, {
    headers: { OTCSTicket: tck },
  });

  const existingDoc = existing.data?.data?.find(
    (n) => n.name === fileName && n.type === 144,
  );

  const fd = new FormData();
  fd.append("file", buffer, {
    filename: fileName,
    contentType: "application/pdf",
  });

  if (existingDoc) {
    // Add as new version
    const versionUrl = `${config.otcs.baseUrl}/v1/nodes/${existingDoc.id}/versions`;
    const rsp = await axios.post(versionUrl, fd, {
      headers: {
        ...fd.getHeaders(),
        OTCSTicket: tck,
      },
    });
    return rsp.data;
  } else {
    // Create new document
    fd.append("parent_id", folderId);
    fd.append("type", "144");
    fd.append("name", fileName);
    fd.append("resource", JSON.stringify({ name: fileName }));

    const rsp = await axios.post(`${config.otcs.baseUrl}/v1/nodes`, fd, {
      headers: {
        ...fd.getHeaders(),
        OTCSTicket: tck,
      },
    });
    return rsp.data;
  }
}

module.exports = { downloadNode, uploadToFolder, ensureTicket };
