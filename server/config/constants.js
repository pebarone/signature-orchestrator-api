// Application Constants
module.exports = {
  // Adobe Sign webhook events that trigger PDF download
  PDF_EVENTS: [
    "DOCUMENT_SIGNED",
    "PARTICIPANT_COMPLETED",
    "PARTICIPANT_SIGNED",
    "AGREEMENT_COMPLETED",
    "AGREEMENT_SIGNED",
    "AGREEMENT_ACTION_COMPLETED",
    "AGREEMENT_WORKFLOW_COMPLETED",
    "AGREEMENT_REJECTED",
  ],

  // Final success events (trigger "Firmado" disposition)
  FINAL_OK_EVENTS: [
    "AGREEMENT_COMPLETED",
    "AGREEMENT_SIGNED",
    "AGREEMENT_WORKFLOW_COMPLETED",
  ],

  // Duplicate submission prevention
  DUPLICATE_THRESHOLD_MS: 15 * 60 * 1000, // 15 minutes

  // Signature verification
  SIGNATURE_MAX_AGE_MS: 2 * 60 * 1000, // 2 minutes

  // File size limits
  MAX_FILE_SIZE_MB: 20,
  JSON_BODY_LIMIT: "10mb",

  // Retry configuration
  PDF_DOWNLOAD_MAX_RETRIES: 50,
  PDF_DOWNLOAD_RETRY_DELAY_MS: 3000,

  // Keepalive interval (production only)
  KEEPALIVE_INTERVAL_MS: 10 * 60 * 1000, // 10 minutes
};
