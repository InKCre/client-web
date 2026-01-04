# Response Component

A component that renders Markdown responses from large language models (LLMs) with streaming support and rich formatting.

## Overview

The Response component is based on AI SDK Elements and provides a polished interface for displaying AI-generated content. It handles loading states, streaming content, and comprehensive Markdown rendering.

## Usage

```vue
<template>
  <Response 
    :content="aiResponse" 
    :isLoading="isStreaming"
    className="custom-response"
  />
</template>

<script setup lang="ts">
import Response from "~/components/ai/Response/Response.vue";
import { ref } from "vue";

const aiResponse = ref("");
const isStreaming = ref(false);
</script>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `content` | `string` | `""` | The markdown content to render |
| `isLoading` | `boolean` | `false` | Whether the response is currently streaming/loading |
| `className` | `string` | `""` | Custom class name for additional styling |

## Features

### Loading States

- **Empty State**: Displays a customizable empty message when no content is available
- **Loading State**: Shows a blinking cursor indicator while waiting for content
- **Streaming State**: Displays content with a cursor indicator during streaming

### Markdown Support

The component renders full Markdown with support for:

- **Headings** (h1-h6) with hierarchical sizing
- **Paragraphs** with proper spacing
- **Code blocks** with syntax highlighting support
- **Inline code** with distinct styling
- **Lists** (ordered and unordered)
- **Blockquotes** with left border accent
- **Links** with hover effects
- **Tables** with bordered layout
- **Images** with responsive sizing
- **Horizontal rules**
- **Bold** and *italic* text

### Styling Features

- Monospace font family (Courier New)
- Consistent spacing and typography
- Blinking cursor animation for loading/streaming states
- Proper code block styling with borders
- Responsive image handling
- Table formatting with alternating headers

## Slots

### `empty`

Customize the empty state display when no content is available:

```vue
<Response :content="content">
  <template #empty>
    <p>Waiting for AI response...</p>
  </template>
</Response>
```

## Styling

The component uses scoped SCSS with deep selectors for Markdown elements. Key CSS classes:

- `.ai-response` - Main container
- `.ai-response-content` - Content wrapper
- `.ai-response-loading` - Loading state container
- `.ai-response-empty` - Empty state container
- `.streaming-cursor` - Animated cursor during streaming
- `.loading-indicator` - Animated loading cursor

### Customization

You can override styles by targeting the component with the `className` prop:

```vue
<Response content="..." className="my-custom-response" />
```

```scss
.my-custom-response {
  .ai-response-content {
    font-size: 14px;
    color: #222;
  }
}
```

## Animations

The component includes CSS animations:

- **Blink**: Used for cursor indicators (1s cycle)

## Dependencies

- `vue-markdown-render` - Markdown rendering library

## Related Components

- Used in: `Explain.vue`, AI interaction panels
- See also: AI streaming composables

## File Structure

- `Response.vue` - Component template and script
- `Response.scss` - Component styles with Markdown formatting
- `Response.md` - This documentation file

## Example: Streaming Content

```vue
<script setup lang="ts">
import Response from "~/components/ai/Response/Response.vue";
import { ref } from "vue";

const content = ref("");
const isLoading = ref(true);

// Simulate streaming
async function streamContent() {
  const fullText = "This is a streaming response...";
  isLoading.value = true;
  
  for (let i = 0; i < fullText.length; i++) {
    content.value += fullText[i];
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  
  isLoading.value = false;
}
</script>

<template>
  <Response :content="content" :isLoading="isLoading" />
</template>
```

## Best Practices

1. Always set `isLoading` to `false` when streaming is complete
2. Use the `empty` slot for contextual empty states
3. Sanitize user-generated content before passing to `content` prop
4. Consider truncating very long responses for performance
5. Provide loading feedback for better UX

## Accessibility

- Uses semantic HTML structure
- Includes proper alt text handling for images
- Maintains readable contrast ratios
- Supports keyboard navigation for links

## Browser Support

Compatible with all modern browsers that support:
- CSS animations
- CSS Grid/Flexbox
- ES6+ JavaScript features