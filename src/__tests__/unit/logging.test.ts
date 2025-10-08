import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";

// Mock the 'node:fs' module
vi.mock("node:fs", () => ({
  default: {
    existsSync: vi.fn(),
    mkdirSync: vi.fn(),
    createWriteStream: vi.fn(),
  },
}));

describe("Logging Utilities", () => {
  let fs: any;
  let mockLogStream: { write: Function };

  // Spy on console methods
  const mockConsoleInfo = vi.spyOn(console, "info").mockImplementation(() => {});
  const mockConsoleWarn = vi.spyOn(console, "warn").mockImplementation(() => {});
  const mockConsoleError = vi.spyOn(console, "error").mockImplementation(() => {});

  beforeAll(async () => {
    // Import the mocked fs
    fs = (await import("node:fs")).default;

    // Set up the mock write stream
    mockLogStream = { write: vi.fn() };
    fs.createWriteStream.mockReturnValue(mockLogStream);
  });

  afterEach(() => {
    // Clear all mocks after each test
    vi.clearAllMocks();
  });

  afterAll(() => {
    // Restore original console methods
    mockConsoleInfo.mockRestore();
    mockConsoleWarn.mockRestore();
    mockConsoleError.mockRestore();
  });

  it("should log info messages to console and file", async () => {
    const { logInfo } = await import("../../utils/logging.js");
    const message = "This is an info message";
    const data = { component: "Test" };

    logInfo(message, data);

    // Check console output
    expect(mockConsoleInfo).toHaveBeenCalledWith(expect.stringContaining(message), data);

    // Check file output
    expect(mockLogStream.write).toHaveBeenCalledTimes(1);
    const logEntry = JSON.parse(mockLogStream.write.mock.calls[0][0]);
    expect(logEntry).toMatchObject({
      level: "INFO",
      message,
      component: "Test",
    });
  });

  it("should log warning messages to console and file", async () => {
    const { logWarn } = await import("../../utils/logging.js");
    const message = "This is a warning message";
    const data = { code: "WarningCode" };

    logWarn(message, data);

    // Check console output
    expect(mockConsoleWarn).toHaveBeenCalledWith(expect.stringContaining(message), data);

    // Check file output
    expect(mockLogStream.write).toHaveBeenCalledTimes(1);
    const logEntry = JSON.parse(mockLogStream.write.mock.calls[0][0]);
    expect(logEntry).toMatchObject({
      level: "WARN",
      message,
      code: "WarningCode",
    });
  });

  it("should log error messages to console and file", async () => {
    const { logError } = await import("../../utils/logging.js");
    const message = "This is an error message";
    const data = { errorId: "Error123" };

    logError(message, data);

    // Check console output
    expect(mockConsoleError).toHaveBeenCalledWith(expect.stringContaining(message), data);

    // Check file output
    expect(mockLogStream.write).toHaveBeenCalledTimes(1);
    const logEntry = JSON.parse(mockLogStream.write.mock.calls[0][0]);
    expect(logEntry).toMatchObject({
      level: "ERROR",
      message,
      errorId: "Error123",
    });
  });

  it("should handle logs with no additional data", async () => {
    const { logInfo } = await import("../../utils/logging.js");
    const message = "Simple info message";

    logInfo(message);

    // Check console output
    expect(mockConsoleInfo).toHaveBeenCalledWith(expect.stringContaining(message));

    // Check file output
    expect(mockLogStream.write).toHaveBeenCalledTimes(1);
    const logEntry = JSON.parse(mockLogStream.write.mock.calls[0][0]);
    expect(logEntry).toMatchObject({
      level: "INFO",
      message,
    });
    // Ensure no other properties were added
    expect(Object.keys(logEntry).length).toBe(3); // timestamp, level, message
  });
});