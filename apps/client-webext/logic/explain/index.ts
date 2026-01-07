import { stepCountIs, streamText } from "ai";
import { useConfigStore } from "@inkcre/core";
import { parseModelString } from "../ai/provider-registry";
import { getPageContent } from "./tools";
import type { useExplainAgentOptions } from "./types";

export { useExplainChat } from "./chat";
export type { Message, useExplainChatOptions } from "./chat";

export function useExplainAgent(options: useExplainAgentOptions) {
  let content = "";
  let isLoading = false;
  let error = "";
  let usedProvider = "";
  let usedModel = "";
  let abortController: AbortController | null = null;

  const stop = () => {
    if (abortController) {
      abortController.abort();
      abortController = null;
    }
    isLoading = false;
    options.onUpdate?.({ isLoading });
  };

  const reset = () => {
    content = "";
    error = "";
    usedProvider = "";
    usedModel = "";
    isLoading = false;
    stop();
    options.onUpdate?.({ content, isLoading, error, usedProvider, usedModel });
  };

  const explain = async (text: string, tabId?: number) => {
    // Reset state
    content = "";
    error = "";
    isLoading = true;
    options.onUpdate?.({ content, error, isLoading });

    // Create new abort controller
    abortController = new AbortController();

    try {
      // TODO remove since streamText response has model response metadata
      const [provider, modelName] = options.modelString.split(":");
      usedProvider = provider;
      usedModel = modelName;
      options.onUpdate?.({ usedProvider, usedModel });

      // Stream the response with tools
      const configStore = useConfigStore();
      const result = streamText({
        model: parseModelString(options.modelString, options.providers),
        system:
          options.instructions || configStore.clientConfig.explainInstruction,
        tools: {
          getPageContent,
        },
        messages: [
          {
            role: "user",
            content: `Given text: \`${text}\`. From tab ${tabId}`,
          },
        ],
        abortSignal: abortController.signal,
        stopWhen: stepCountIs(5),
      });

      // Process the stream (collect text deltas)
      for await (const chunk of result.textStream) {
        content += chunk;
        options.onUpdate?.({ content });
      }

      // Get final result
      const finalResult = await result.text;
      content = finalResult;
      options.onUpdate?.({ content });

      // Call onFinish callback
      if (options.onFinish) {
        options.onFinish({
          text: finalResult,
          finishReason: "stop",
        });
      }
    } catch (err) {
      // Check if it was aborted
      const errObj = err as any;
      if (
        errObj?.name === "AbortError" ||
        errObj?.message?.includes("aborted")
      ) {
        error = "Explanation stopped";
      } else {
        console.error("Error in explain stream:", err);
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
    stop,
    reset,
    explain,
  };
}
