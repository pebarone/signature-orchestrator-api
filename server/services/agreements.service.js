// Agreements Service - Agreement persistence and business logic
const fs = require("fs");
const paths = require("../config/paths");
const { DUPLICATE_THRESHOLD_MS } = require("../config/constants");
const logger = require("../utils/logger");

// In-memory agreements map
let MAP = {};

/**
 * Load agreements from persistent storage.
 */
function loadAgreements() {
  if (fs.existsSync(paths.agreementsMap)) {
    try {
      MAP = JSON.parse(fs.readFileSync(paths.agreementsMap, "utf8"));
    } catch (err) {
      logger.error("Failed to load agreements.json:", err.message);
      MAP = {};
    }
  }
  return MAP;
}

/**
 * Save agreements to persistent storage.
 */
function saveAgreements() {
  fs.writeFileSync(paths.agreementsMap, JSON.stringify(MAP, null, 2));
}

/**
 * Get all agreements.
 * @returns {Object} Agreements map
 */
function getAll() {
  return MAP;
}

/**
 * Get a specific agreement by ID.
 * @param {string} agreementId - Adobe Sign agreement ID
 * @returns {Object|null} Agreement info or null
 */
function getById(agreementId) {
  return MAP[agreementId] || null;
}

/**
 * Check if a duplicate submission exists within the threshold window.
 * @param {string} nodeId - OTCS node ID
 * @param {string[]} emails - Recipient emails
 * @returns {boolean} True if duplicate exists
 */
function isDuplicate(nodeId, emails) {
  const now = Date.now();
  const newKey = [...emails].sort().join("|");

  return Object.values(MAP).some((info) => {
    if (String(info.nodeId) !== String(nodeId)) return false;
    if (!Array.isArray(info.emails) || info.emails.length !== emails.length)
      return false;
    const infoKey = [...info.emails].sort().join("|");
    if (infoKey !== newKey) return false;
    if (!info.createdAt) return false;
    return now - new Date(info.createdAt).getTime() < DUPLICATE_THRESHOLD_MS;
  });
}

/**
 * Create a new agreement entry.
 * @param {string} agreementId - Adobe Sign agreement ID
 * @param {Object} data - Agreement metadata
 */
function create(agreementId, data) {
  MAP[agreementId] = {
    nodeId: String(data.nodeId),
    attachId: String(data.attachId),
    fileName: data.fileName,
    workflowId: String(data.workflowId || ""),
    subworkflowId: String(data.subworkflowId || data.workflowId || ""),
    sendonDone: false,
    emails: data.emails,
    createdAt: new Date().toISOString(),
  };
  saveAgreements();
  return MAP[agreementId];
}

/**
 * Update an agreement entry.
 * @param {string} agreementId - Agreement ID
 * @param {Object} updates - Fields to update
 */
function update(agreementId, updates) {
  if (MAP[agreementId]) {
    MAP[agreementId] = { ...MAP[agreementId], ...updates };
    saveAgreements();
  }
  return MAP[agreementId];
}

/**
 * Mark agreement as having completed workflow disposition.
 * @param {string} agreementId - Agreement ID
 */
function markSendOnDone(agreementId) {
  return update(agreementId, { sendonDone: true });
}

// Load agreements on module initialization
loadAgreements();

module.exports = {
  loadAgreements,
  saveAgreements,
  getAll,
  getById,
  isDuplicate,
  create,
  update,
  markSendOnDone,
};
