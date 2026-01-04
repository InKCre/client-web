<script setup lang="ts">
import { ref } from "vue";
import Response from "./Response.vue";

// Example 1: Simple markdown response
const simpleContent = ref(`# Welcome to AI Response

This is a **markdown** response from an AI model. It supports:

- Lists
- **Bold** and *italic* text
- \`inline code\`
- And much more!
`);

// Example 2: Code block example
const codeContent = ref(`Here's how to use the Response component:

\`\`\`typescript
import Response from '~/components/ai/Response.vue';

const content = ref('Your markdown content');
const isLoading = ref(false);
\`\`\`

It's that simple!`);

// Example 3: Loading state
const loadingContent = ref("");
const isLoading = ref(true);

// Simulate loading
setTimeout(() => {
  isLoading.value = false;
  loadingContent.value = "Response loaded successfully!";
}, 2000);

// Example 4: Empty state with custom slot
const emptyContent = ref("");

// Example 5: Streaming simulation with useExplainStream
const streamingContent = ref("");
const isStreaming = ref(true);

// Simulate real streaming behavior
const simulateStreaming = async () => {
  const fullText = `# Streaming Response Example

This text will appear **character by character**, just like a real AI response!

## How It Works

The Response component shows a **blinking cursor** at the end of the text while streaming is active.

### Features:
- Real-time content updates
- Visual streaming cursor
- Smooth user experience

Pretty cool, right?`;

  streamingContent.value = "";
  isStreaming.value = true;

  // Stream character by character
  for (let i = 0; i < fullText.length; i++) {
    streamingContent.value += fullText[i];
    await new Promise((resolve) => setTimeout(resolve, 20));
  }

  isStreaming.value = false;
};

// Start streaming on mount
simulateStreaming();

// Example 6: Rich formatting
const richContent = ref(`## Comprehensive Markdown Example

### Text Formatting

This is **bold text**, this is *italic text*, and this is ***bold italic***.

### Lists

#### Ordered List:
1. First item
2. Second item
3. Third item

#### Unordered List:
- Item A
- Item B
  - Nested item
  - Another nested item
- Item C

### Code

Inline code: \`const x = 42;\`

Block code:
\`\`\`javascript
function greet(name) {
  return \`Hello, \${name}!\`;
}
\`\`\`

### Blockquote

> This is a blockquote.
> It can span multiple lines.

### Links and Images

[Visit Example](https://example.com)

### Table

| Feature | Supported |
|---------|-----------|
| Markdown | ✅ |
| Streaming | ✅ |
| Styling | ✅ |

### Horizontal Rule

---

That's all folks!`);
</script>

<template>
    <div class="examples-container">
        <h1>AI Response Component Examples</h1>

        <section class="example">
            <h2>Example 1: Simple Markdown</h2>
            <Response :content="simpleContent" />
        </section>

        <section class="example">
            <h2>Example 2: Code Block</h2>
            <Response :content="codeContent" />
        </section>

        <section class="example">
            <h2>Example 3: Loading State</h2>
            <Response :content="loadingContent" :is-loading="isLoading" />
        </section>

        <section class="example">
            <h2>Example 4: Empty State with Custom Slot</h2>
            <Response :content="emptyContent">
                <template #empty>
                    <div class="custom-empty">
                        <p>🤖 No response yet</p>
                        <p class="hint">Ask a question to get started</p>
                    </div>
                </template>
            </Response>
        </section>

        <section class="example">
            <h2>Example 5: Streaming Simulation</h2>
            <p class="example-description">
                Watch the content stream in with a blinking cursor at the end
            </p>
            <Response :content="streamingContent" :is-loading="isStreaming" />
            <button
                @click="simulateStreaming"
                class="replay-button"
                :disabled="isStreaming"
            >
                {{ isStreaming ? "Streaming..." : "Replay Streaming" }}
            </button>
        </section>

        <section class="example">
            <h2>Example 6: Rich Formatting</h2>
            <Response :content="richContent" />
        </section>

        <section class="example">
            <h2>Example 7: Custom Styling</h2>
            <Response :content="simpleContent" class-name="custom-styled" />
        </section>
    </div>
</template>

<style scoped>
.examples-container {
    max-width: 800px;
    margin: 0 auto;
    padding: 32px;
    font-family:
        system-ui,
        -apple-system,
        sans-serif;
}

.examples-container > h1 {
    font-size: 2em;
    margin-bottom: 32px;
    color: #000;
}

.example {
    margin-bottom: 48px;
    padding: 24px;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    background: #fff;
}

.example > h2 {
    margin-top: 0;
    margin-bottom: 16px;
    font-size: 1.3em;
    color: #333;
}

.custom-empty {
    text-align: center;
    padding: 32px;
}

.custom-empty p {
    margin: 8px 0;
    font-size: 1.1em;
}

.custom-empty .hint {
    font-size: 0.9em;
    color: #999;
}

.example-description {
    margin-bottom: 12px;
    color: #666;
    font-size: 0.95em;
}

.replay-button {
    margin-top: 12px;
    padding: 8px 16px;
    border: 1px solid #000;
    background: #fff;
    cursor: pointer;
    font-size: 14px;
    border-radius: 4px;
    transition: all 0.2s;
}

.replay-button:hover:not(:disabled) {
    background: #000;
    color: #fff;
}

.replay-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

/* Custom styling example */
:deep(.custom-styled) {
    border-left: 4px solid #0066cc;
    padding-left: 16px;
    background: #f0f8ff;
    padding: 16px;
    border-radius: 4px;
}
</style>
