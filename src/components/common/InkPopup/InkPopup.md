# InkPopup

A flexible popup component with support for multiple positions, scrim overlay, and v-model control.

## Features

- **Flexible Positioning**: Support for predefined positions (`center`, `left`, `right`, `top`, `bottom`) or custom coordinates
- **Scrim Control**: Overlay that can close the popup on click
- **V-Model Support**: Easy open/close state management
- **Transitions**: Smooth fade and slide animations
- **Teleport**: Renders at the document root to avoid z-index stacking issues

## Usage

### Basic Example

```vue
<script setup lang="ts">
import { ref } from "vue";
import InkPopup from "@/components/common/InkPopup/InkPopup.vue";

const isOpen = ref(false);
</script>

<template>
  <button @click="isOpen = true">Open Popup</button>

  <InkPopup v-model:open="isOpen">
    <div>Popup content here</div>
  </InkPopup>
</template>
```

### Positioned Popup

```vue
<InkPopup v-model:open="isOpen" position="top">
  <div>Popup content</div>
</InkPopup>
```

### Custom Position

```vue
<InkPopup v-model:open="isOpen" :position="[10, 20, 30, 40]">
  <div>Popup content</div>
</InkPopup>
```

### Disable Scrim Close

```vue
<InkPopup v-model:open="isOpen" :close-on-scrim="false">
  <div>Popup content</div>
</InkPopup>
```

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `open` | `boolean` | `false` | Controls popup visibility (supports v-model) |
| `position` | `PopupPosition` | `'center'` | Position of the popup: `'center'`, `'left'`, `'right'`, `'top'`, `'bottom'`, or array `[top, right, bottom, left]` |
| `closeOnScrim` | `boolean` | `true` | Whether clicking the scrim closes the popup |

## Types

```typescript
type PopupPosition =
  | "center"
  | "left"
  | "right"
  | "bottom"
  | "top"
  | [number, number, number, number]; // [top, right, bottom, left]
```
