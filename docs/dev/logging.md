# Logging Strategy

This document outlines the two types of logging implemented in the Perplexity server.

## 1. File-Based Logging (Persistent)

This is the primary logging mechanism for auditing, debugging, and monitoring server activity over time.

-   **Location:** The logic is handled by `src/utils/logging.ts`.
-   **Log File:** All logs are appended to `logs/server.log`.
-   **Format:** Logs are stored as structured JSON objects, with each entry on a new line. Each entry includes a `timestamp`, `level`, `message`, and any relevant structured data.
-   **Content:**
    -   **Server Status:** Captures server lifecycle events like startup, initialization, and errors.
    -   **Incoming Requests:** Logs every `CallTool` request, including the `requestId`, the `tool` name, and the `arguments` provided.
    -   **Response Summaries:** Logs a summary of the response for each successful tool call. For long text responses (e.g., from `extract_url_content`), the content is truncated to keep the log file manageable.
    -   **Errors:** Captures detailed error messages if a tool execution fails.

## 2. Console Logging (Ephemeral)

This logging provides a real-time, color-coded view of the server's activity, primarily for live debugging.

-   **Output:** Logs are printed directly to the console (stdout/stderr).
-   **Content:** Mirrors the information being sent to the file-based log.
-   **Persistence:** This logging is ephemeral and is not saved, making the file-based log the source of truth for historical data.

### Logging Summary by Tool

All tools now have their requests, response summaries, and any errors logged to both the console and the `logs/server.log` file. -   **Database File:** `build/chat_history.db`. The database is a local SQLite file. When running the compiled server (`bun run start`), this file is created inside the `build` directory. When running tests, it may be created in the `src` directory.
