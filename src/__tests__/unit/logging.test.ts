import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { logError, logInfo, logWarn } from "../../utils/logging.js";

describe("Logging Utilities", () => {
  const mockConsole = {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  };

  beforeEach(() => {
    vi.spyOn(console, "info").mockImplementation(mockConsole.info);
    vi.spyOn(console, "warn").mockImplementation(mockConsole.warn);
    vi.spyOn(console, "error").mockImplementation(mockConsole.error);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("logInfo should call console.info with formatted message", () => {
    const message = "Test info";
    const data = { a: 1 };
    logInfo(message, data);
    expect(mockConsole.info).toHaveBeenCalledWith(expect.stringContaining("[INFO] Test info"), data);
  });

  it("logWarn should call console.warn with formatted message", () => {
    const message = "Test warn";
    const data = { b: 2 };
    logWarn(message, data);
    expect(mockConsole.warn).toHaveBeenCalledWith(expect.stringContaining("[WARN] Test warn"), data);
  });

  it("logError should call console.error with formatted message", () => {
    const message = "Test error";
    const data = { c: 3 };
    logError(message, data);
    expect(mockConsole.error).toHaveBeenCalledWith(expect.stringContaining("[ERROR] Test error"), data);
  });
});