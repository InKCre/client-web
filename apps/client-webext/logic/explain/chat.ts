import { type ModelMessage, stepCountIs, streamText } from "ai";
import { useConfigStore } from "@inkcre/core";
import { parseModelString } from "../ai/provider-registry";
import { getPageContent } from "./tools";
import type { LLMProviderConfig } from "../storage";

export interface Message {
  role: "user" | "assistant";
  content: string;
  id: string;
}

export interface useExplainChatOptions {
  modelString: string;
  providers?: LLMProviderConfig[];
  instructions?: string;
  onUpdate?: (update: {
    messages?: Message[];
    isLoading?: boolean;
    error?: string;
  }) => void;
  onFinish?: (result: { messages: Message[] }) => void;
  onError?: (error: Error) => void;
}

/**
 * Chat-style wrapper for explain agent that supports follow-up questions.
 * Based on AI SDK chatbot pattern: https://ai-sdk.dev/docs/ai-sdk-ui/chatbot
 */
export function useExplainChat(options: useExplainChatOptions) {
  let messages: Message[] = [];
  let isLoading = false;
  let error = "";
  let abortController: AbortController | null = null;
  let messageIdCounter = 0;

  const generateMessageId = () => {
    return `msg-${Date.now()}-${messageIdCounter++}`;
  };

  const stop = () => {
    if (abortController) {
      abortController.abort();
      abortController = null;
    }
    isLoading = false;
    options.onUpdate?.({ isLoading });
  };

  const reset = () => {
    messages = [];
    error = "";
    isLoading = false;
    stop();
    options.onUpdate?.({ messages, isLoading, error });
  };

  const sendMessage = async (
    userMessage: string,
    tabId?: number
  ): Promise<void> => {
    // Add user message
    const newUserMessage: Message = {
      role: "user",
      content: userMessage,
      id: generateMessageId(),
    };
    messages = [...messages, newUserMessage];
    error = "";
    isLoading = true;
    options.onUpdate?.({ messages, isLoading, error });

    // Create new abort controller
    abortController = new AbortController();

    try {
      // Convert our messages to ModelMessage format
      const modelMessages: ModelMessage[] = messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      // For the first message, include tab context
      if (messages.length === 1 && tabId !== undefined) {
        modelMessages[0].content = `Given text: \`${userMessage}\`. From tab ${tabId}`;
      }

      // Stream the response with tools
      const configStore = useConfigStore();
      const result = streamText({
        model: parseModelString(options.modelString, options.providers),
        system: options.instructions || configStore.config.explainInstruction,
        tools: {
          getPageContent,
        },
        messages: modelMessages,
        abortSignal: abortController.signal,
        stopWhen: stepCountIs(5),
      });

      // Create assistant message placeholder
      const assistantMessage: Message = {
        role: "assistant",
        content: "",
        id: generateMessageId(),
      };
      messages = [...messages, assistantMessage];
      options.onUpdate?.({ messages });

      // Process the stream (collect text deltas)
      for await (const chunk of result.textStream) {
        assistantMessage.content += chunk;
        // Update the messages array
        messages = [...messages.slice(0, -1), assistantMessage];
        options.onUpdate?.({ messages });
      }

      // Get final result
      const finalResult = await result.text;
      assistantMessage.content = finalResult;
      messages = [...messages.slice(0, -1), assistantMessage];
      options.onUpdate?.({ messages });

      // Call onFinish callback
      if (options.onFinish) {
        options.onFinish({ messages });
      }
    } catch (err) {
      // Check if it was aborted
      const errObj = err as any;
      if (
        errObj?.name === "AbortError" ||
        errObj?.message?.includes("aborted")
      ) {
        error = "Stopped";
      } else {
        console.error("Error in explain chat stream:", err);
        error = `Failed to generate explanation: ${errObj?.message || err}`;

        // Call onError callback
        if (options.onError) {
          options.onError(err as Error);
        }
      }
      options.onUpdate?.({ error, isLoading: false });
    } finally {
      isLoading = false;
      abortController = null;
      options.onUpdate?.({ isLoading });
    }
  };

  return {
    messages: () => messages,
    isLoading: () => isLoading,
    error: () => error,
    sendMessage,
    stop,
    reset,
  };
}
