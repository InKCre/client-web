// Agent framework types using Vercel AI SDK (browser-compatible)

import type { Tool } from "ai";
import type { LLMProviderConfig } from "../storage";

export type AITool = Tool;
export type AITools = Record<string, Tool>;

/**
 * Agent execution result
 */
export interface AgentResult {
  content: string;
  toolCalls?: ToolCall[];
  error?: string;
  usedProvider?: string;
  usedModel?: string;
}

/**
 * Tool call record
 */
export interface ToolCall {
  toolName: string;
  parameters: any;
  result: any;
}

/**
 * Agent state during streaming execution
 */
export interface AgentState {
  status:
    | "idle"
    | "thinking"
    | "calling-tool"
    | "generating"
    | "complete"
    | "error";
  currentToolCall?: {
    toolName: string;
    parameters: any;
  };
  toolCalls: ToolCall[];
  content: string;
  error?: string;
}

/**
 * Callback for streaming updates
 */
export type StreamCallback = (state: Partial<AgentState>) => void;

/**
 * Options for creating an explain agent
 */
export interface useExplainAgentOptions {
  modelString: string;
  providers?: LLMProviderConfig[];
  instructions?: string;
  onUpdate?: (
    update: Partial<{
      content: string;
      isLoading: boolean;
      error: string;
      usedProvider: string;
      usedModel: string;
    }>,
  ) => void;
  onFinish?: (result: { text: string; finishReason: string }) => void;
  onError?: (error: Error) => void;
}
