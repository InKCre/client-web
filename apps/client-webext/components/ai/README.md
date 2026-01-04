# AI Components

Reusable Vue components for rendering AI/LLM responses and interactions. Based on patterns from [AI SDK Elements](https://ai-sdk.dev/elements).

## Components

### Response

A component that renders Markdown responses from large language models with proper styling and formatting.

#### Usage

```vue
<script setup lang="ts">
import { ref } from 'vue';
import Response from '~/components/ai/Response.vue';

const content = ref('# Hello\n\nThis is **markdown** content from an LLM.');
const isLoading = ref(false);
</script>

<template>
  <Response :content="content" :is-loading="isLoading" />
</template>
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `content` | `string` | `""` | The markdown content to render |
| `isLoading` | `boolean` | `false` | Whether the response is currently streaming/loading |
| `className` | `string` | `""` | Custom class name for additional styling |

#### Slots

| Slot | Description |
|------|-------------|
| `empty` | Custom content to display when there's no response yet |

#### Features

- **Markdown rendering** with syntax highlighting
- **Loading state** with blinking cursor animation
- **Streaming support** with inline cursor during content generation
- **Empty state** with customizable slot
- **Comprehensive styling** for markdown elements:
  - Headings (h1-h6)
  - Code blocks and inline code
  - Lists (ordered and unordered)
  - Blockquotes
  - Tables
  - Links and images
  - Horizontal rules

#### Examples

**Basic usage:**

```vue
<Response :content="explanation" :is-loading="isLoading" />
```

**Streaming response:**

When `isLoading` is `true` and content is present, a blinking cursor appears at the end of the text to indicate active streaming:

```vue
<script setup lang="ts">
import { ref } from 'vue';
import Response from '~/components/ai/Response.vue';

const content = ref('');
const isLoading = ref(true);

// Simulate streaming
const streamText = async () => {
  const fullText = 'This is a streamed response...';
  for (let i = 0; i < fullText.length; i++) {
    content.value += fullText[i];
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  isLoading.value = false;
};

streamText();
</script>

<template>
  <Response :content="content" :is-loading="isLoading" />
</template>
```

**With custom empty state:**

```vue
<Response :content="content">
  <template #empty>
    <p>Ask a question to get started</p>
  </template>
</Response>
```

**With custom styling:**

```vue
<Response 
  :content="content" 
  :is-loading="isLoading"
  class-name="my-custom-class"
/>
```

## Styling

The Response component uses scoped styles with deep selectors for markdown content. All styles are prefixed with `.ai-response` to avoid conflicts.

### Customization

You can override styles by targeting the component class:

```css
.ai-response {
  font-family: 'Inter', sans-serif;
  font-size: 14px;
}

.ai-response-content :deep(h1) {
  color: #ff0000;
}
```

## Integration with Streaming

The Response component works seamlessly with the `useExplainStream` composable for real-time streaming:

```vue
<script setup lang="ts">
import { ref, watch } from 'vue';
import Response from '~/components/ai/Response.vue';
import { useExplainStream } from '~/composables/useExplainStream';

const stream = useExplainStream({
  modelString: 'openai:gpt-4',
  providers: llmProviders.value,
});

// Sync refs for display
const content = ref('');
const isLoading = ref(false);

watch(stream.content, (val) => content.value = val);
watch(stream.isLoading, (val) => isLoading.value = val);

// Start streaming
const explain = async () => {
  await stream.explain('Explain quantum computing');
};
</script>

<template>
  <Response :content="content" :is-loading="isLoading" />
  <button @click="explain">Explain</button>
  <button @click="stream.stop()" v-if="isLoading">Stop</button>
</template>
```

See `components/sidepanel/Explain.vue` for a complete production integration example.

## Streaming Behavior

### Visual Feedback

When `isLoading` is `true`:
- **With content**: A blinking cursor appears inline at the end of the text
- **Without content**: A standalone blinking cursor indicates waiting for first token

The streaming cursor:
- Blinks with 1-second animation cycle
- Appears as a thin vertical line (`2px width`)
- Automatically disappears when `isLoading` becomes `false`
- Positioned inline with the text flow

### States Overview

| Content | Loading | Display |
|---------|---------|---------|
| Empty | `false` | Empty state slot |
| Empty | `true` | Standalone cursor |
| Present | `false` | Rendered markdown |
| Present | `true` | Markdown + inline cursor |

## Future Components

Additional components to be added based on AI SDK Elements:

- `Message` - Display chat messages with role indicators
- `CodeBlock` - Enhanced code display with syntax highlighting and copy button
- `Suggestion` - Clickable suggestion chips
- `Actions` - Action buttons (retry, copy, etc.)
- `Reasoning` - Collapsible reasoning/thinking display
- `StreamingText` - Text with typewriter effect

## References

- [AI SDK Elements Documentation](https://ai-sdk.dev/elements)
- [AI SDK Elements Response Component](https://ai-sdk.dev/elements/components/response)
- [Vercel AI SDK Streaming](https://sdk.vercel.ai/docs/ai-sdk-core/stream-text)
- [Streaming Implementation Guide](../../docs/STREAMING_IMPLEMENTATION.md)