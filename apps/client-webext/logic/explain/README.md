---
description: "This document provides AI Coding guidelines to `logic/explain`, which is the logic behind the explain feature."
---

Tech Stacks:
- [Vercel AI SDK v5](https://ai-sdk.dev/docs/introduction)

Files:
- `tools.ts`: Tools for explain agent, build with [AI SDK Tools](https://ai-sdk.dev/docs/ai-sdk-core/tools-and-tool-calling)
- `index.ts`: Original single-turn explain agent using `useExplainAgent`
- `chat.ts`: Multi-turn conversational explain agent using `useExplainChat` (implements AI SDK chatbot pattern)
- `types.ts`: TypeScript types for agents

Best Practice:
- Errors occured in tool execution will be passed to LLM automatically by Vercel AI SDK.
- Make naming of tool inputSchema self-explanatory to save token.

## Explain Chat

The `useExplainChat` composable enables multi-turn conversations with follow-up questions.
Based on the AI SDK chatbot pattern: https://ai-sdk.dev/docs/ai-sdk-ui/chatbot

### Usage

```typescript
import { useExplainChat } from "~/logic/explain";

const chat = useExplainChat({
  modelString: "openai:gpt-4",
  providers: llmProviders.value,
  onUpdate: (update) => {
    if (update.messages) messages.value = update.messages;
  },
});

// Send initial message
await chat.sendMessage("Explain this code", tabId);

// Send follow-up
await chat.sendMessage("Can you give an example?");
```

### API

- `sendMessage(text, tabId?)`: Send a message and get AI response
- `stop()`: Stop current generation
- `reset()`: Clear conversation history
- `messages()`: Get current message array
- `isLoading()`: Get loading state
- `error()`: Get error message

### Message Type

```typescript
interface Message {
  role: "user" | "assistant";
  content: string;
  id: string;
}
```
