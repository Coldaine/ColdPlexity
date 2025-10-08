import crypto from "node:crypto";
import type { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  type CallToolRequest,
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";

import { TOOL_SCHEMAS } from "../schema/toolSchemas.js";
import type { ChatPerplexityArgs, ToolHandlersRegistry } from "../types/index.js";
import { logError, logInfo, logWarn } from "../utils/logging.js";

/**
 * Sets up MCP tool handlers for the server
 * @param server - The MCP Server instance
 * @param toolHandlers - Registry of tool handler functions
 */
export function setupToolHandlers(server: Server, toolHandlers: ToolHandlersRegistry): void {
  // Register ListTools handler
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: TOOL_SCHEMAS,
    };
  });

  // Register CallTool handler with comprehensive error handling and timeout management
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const callToolRequest = request as CallToolRequest;
    const { name, arguments: args } = callToolRequest.params;
    const requestId = crypto.randomUUID(); // Generate a unique ID for tracking this request

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
          const chatId = chatArgs?.chat_id || crypto.randomUUID();
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
            responseSummary: createResponseSummary(responsePayload.content[0]?.text),
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

/**
 * Creates a summary of the response for logging purposes
 * @param response - The response text
 * @returns A truncated summary if the response is long
 */
function createResponseSummary(response: string | undefined): string {
  if (typeof response !== "string") return "non-string response";
  if (response.length <= 100) return response;
  return response.substring(0, 100) + "...";
}
