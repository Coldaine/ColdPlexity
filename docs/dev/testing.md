# Testing Guide

This document explains how to run the various tests included in this project.

## Running Tests with Bun

This project uses Vitest for its test syntax, but it **must** be run using the `bun test` command. This is because the project uses Bun-native APIs (like `bun:sqlite`), and `bun test` is a high-performance test runner that provides the necessary Bun runtime environment.

### Running the Full Test Suite

To run all unit and mocked integration tests, use the following command:

```bash
bun test
```

This will discover and run all files ending in `.test.ts` or `.spec.ts`.

### Running a Specific Test File

To run a single test file, provide the path to that file:

```bash
bun test src/__tests__/unit/tools.test.ts
```

## End-to-End (E2E) Testing

The project's default integration tests are mocked and do not perform real browser actions. To run a true E2E test that launches a browser and interacts with live websites, you must create a dedicated test file.

### E2E Test File Example

An E2E test should be structured like this:

-   It should **not** mock the core modules (`BrowserManager`, `SearchEngine`).
-   It should have a long timeout to account for network and browser performance.

```typescript
import { describe, expect, it } from "vitest";
import { PerplexityServer } from "../../server/PerplexityServer.js";

describe("E2E Test", () => {
  it("should perform a real action", async () => {
    let server;
    try {
      server = new PerplexityServer();
      const searchEngine = server.getSearchEngine();
      const result = await searchEngine.performSearch("What is the capital of France?");
      expect(result.toLowerCase()).toContain("paris");
    } finally {
      if (server) {
        await server.getBrowserManager().cleanup();
      }
    }
  }, 60000); // 60-second timeout
});
```

### Running an E2E Test

Because E2E tests can be slow, it's best to run them individually. Use the `bun test` command with the `--timeout` flag.

```bash
# The timeout flag is in milliseconds (ms)
bun test --timeout 60000 src/__tests__/integration/my_e2e_test.ts
```
