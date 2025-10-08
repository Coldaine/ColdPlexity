/**
 * Tool Handler Setup Module
 * Manages MCP tool registration and request handling logic
 */

import crypto from "node:crypto";
import type { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";

import { TOOL_SCHEMAS } from "../schema/toolSchemas.js";
import type { ChatPerplexityArgs, ToolHandlersRegistry } from "../types/index.js";
import { logError, logInfo, logWarn } from "../utils/logging.js";

/**
 * Creates a summary of the response content for logging.
 * @param content - The content of the response.
 * @returns A string summary.
 */
function createResponseSummary(content: any): string {
  if (typeof content === "string") {
    const maxLength = 200;
    const summary = content.substring(0, maxLength);
    return content.length > maxLength ? `${summary}... (truncated)` : summary;
  }
  // For non-string content (like the chat_perplexity object), stringify it.
  try {
    const jsonContent = JSON.stringify(content);
    const maxLength = 300;
    const summary = jsonContent.substring(0, maxLength);
    return jsonContent.length > maxLength ? `${summary}... (truncated)` : jsonContent;
  } catch {
    return "[Unserializable content]";
  }
}

/**
 * Sets up MCP tool handlers for the server
 * @param server - The MCP Server instance
 * @param toolHandlers - Registry of tool handler functions
 */
export function setupToolHandlers(server: Server, toolHandlers: ToolHandlersRegistry): void {
  // Register ListTools handler
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    logInfo("Handling ListTools request");
    return {
      tools: TOOL_SCHEMAS,
    };
  });

  // Register CallTool handler with comprehensive error handling and timeout management
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    const requestId = request.id || "unknown";

    logInfo("Handling CallTool request", { requestId, tool: name, arguments: args });

    // Set a timeout for the entire MCP request
    const requestTimeout = setTimeout(() => {
      logWarn("MCP request is taking too long, this might lead to a timeout", { requestId, tool: name });
    }, 60000); // 60 seconds warning

    try {
      if (toolHandlers[name]) {
        const result = await toolHandlers[name](args || {});

        // Special case for chat to return chat_id
        if (name === "chat_perplexity") {
          const chatArgs = (args || {}) as unknown as ChatPerplexityArgs;
          const chatId = chatArgs.chat_id || crypto.randomUUID();
          const responsePayload = {
            content: [
              {
                type: "text",
                text: JSON.stringify({ chat_id: chatId, response: result }, null, 2),
              },
            ],
          };
          logInfo("Successfully handled CallTool request", {
            requestId,
            tool: name,
            responseSummary: createResponseSummary(responsePayload.content[0].text),
          });
          return responsePayload;
        }

        const responsePayload = { content: [{ type: "text", text: result }] };
        logInfo("Successfully handled CallTool request", {
          requestId,
          tool: name,
          responseSummary: createResponseSummary(result),
        });
        return responsePayload;
      }
      throw new McpError(ErrorCode.MethodNotFound, `Tool ${name} not found`);
    } catch (error) {
      logError(`Error executing tool ${name}`, {
        requestId,
        tool: name,
        error: error instanceof Error ? error.message : String(error),
      });

      if (error instanceof Error) {
        const errorMsg = error.message;

        if (errorMsg.includes("timeout") || errorMsg.includes("Timed out")) {
          logError("Timeout detected in MCP request", { requestId, tool: name });
          return {
            content: [
              {
                type: "text",
                text: "The operation timed out. This might be due to high server load or network issues. Please try again with a more specific query.",
              },
            ],
          };
        }

        return {
          content: [
            {
              type: "text",
              text: `The operation encountered an error: ${errorMsg}. Please try again.`,
            },
          ],
        };
      }

      throw new McpError(
        ErrorCode.InternalError,
        `Tool execution failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    } finally {
      clearTimeout(requestTimeout);
    }
  });
}

/**
 * Creates a tool handlers registry with the provided handlers
 * @param handlers - Object mapping tool names to handler functions
 * @returns ToolHandlersRegistry
 */
export function createToolHandlersRegistry(handlers: ToolHandlersRegistry): ToolHandlersRegistry {
  return handlers;
}
