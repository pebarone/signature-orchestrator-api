// Logs Controller - Log streaming and download handlers
const fs = require("fs");
const paths = require("../config/paths");

/**
 * Stream logs via Server-Sent Events.
 */
function streamLogs(req, res) {
  const logFilePath = paths.logs.audit;

  if (!fs.existsSync(logFilePath)) {
    return res.status(404).send("Log file not found.");
  }

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });

  // Send existing log content
  const all = fs
    .readFileSync(logFilePath, "utf8")
    .split("\n")
    .filter((l) => l.trim() !== "");
  all.forEach((line) => res.write(`data: ${line}\n\n`));

  let lastLineCount = all.length;

  // Watch for new log entries
  const watcher = fs.watch(logFilePath, { encoding: "utf8" }, (evtType) => {
    if (evtType !== "change") return;

    const lines = fs.readFileSync(logFilePath, "utf8").trim().split("\n");

    const newLines = lines.slice(lastLineCount);
    newLines.forEach((line) => {
      if (line.trim()) res.write(`data: ${line}\n\n`);
    });

    lastLineCount = lines.length;
  });

  req.on("close", () => watcher.close());
}

/**
 * Download log file.
 */
function downloadLogs(req, res) {
  const logFilePath = paths.logs.audit;

  if (!fs.existsSync(logFilePath)) {
    return res.status(404).send("Log file not found.");
  }

  res.download(logFilePath, "server.log");
}

module.exports = {
  streamLogs,
  downloadLogs,
};
