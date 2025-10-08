import fs from "node:fs";
import path from "node:path";

// --- Log File Setup ---
const logDirectory = "logs";
const logFilePath = path.join(logDirectory, "server.log");

// Ensure log directory exists
if (!fs.existsSync(logDirectory)) {
  fs.mkdirSync(logDirectory);
}

// Create a writable stream for the log file
const logStream = fs.createWriteStream(logFilePath, { flags: "a" });

/**
 * Writes a structured log message to the log file.
 * @param level - The log level (e.g., INFO, WARN, ERROR).
 * @param message - The main log message.
 * @param data - Optional structured data to include.
 */
function writeToFile(level: string, message: string, data?: Record<string, unknown>) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...data,
  };
  logStream.write(`${JSON.stringify(logEntry)}\n`);
}

// --- Console Logging Configuration ---
const LOG_LEVELS = {
  info: "INFO",
  warn: "WARN",
  error: "ERROR",
};

const LOG_COLORS = {
  info: "\u001B[34m", // Blue
  warn: "\u001B[33m", // Yellow
  error: "\u001B[31m", // Red
  reset: "\u001B[0m",
};

/**
 * Generic log function for console output.
 * @param level - The log level.
 * @param message - The message to log.
 * @param data - Optional additional data.
 */
function log(level: "info" | "warn" | "error", message: string, data?: Record<string, unknown>) {
  const timestamp = new Date().toISOString();
  const color = LOG_COLORS[level];
  const levelString = LOG_LEVELS[level];

  console[level](
    `${color}[${timestamp}] [${levelString}] ${message}${LOG_COLORS.reset}`,
    ...(data ? [data] : []),
  );

  // Also write to the file
  writeToFile(levelString, message, data);
}

// --- Public Logging Functions ---
export function logInfo(message: string, data?: Record<string, unknown>) {
  log("info", message, data);
}

export function logWarn(message: string, data?: Record<string, unknown>) {
  log("warn", message, data);
}

export function logError(message: string, data?: Record<string, unknown>) {
  log("error", message, data);
}

