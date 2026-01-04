# ArcsEditor Component

A sophisticated component for managing collections of arc relationships with horizontal scrolling, keyboard navigation, and dynamic arc management.

## Overview

The ArcsEditor component provides an interface for creating and managing multiple arc relationships in a star graph structure. It supports both incoming and outgoing arcs, with smooth navigation between arcs, keyboard shortcuts for efficient editing, and visual indicators for the current position.

## Usage

```vue
<template>
  <ArcsEditor
    v-model="arcs"
    type="incoming"
    relationType="y"
    ref="arcsEditorRef"
  />
</template>

<script setup lang="ts">
import { ref } from "vue";
import ArcsEditor from "~/components/info-base/ArcsEditor/ArcsEditor.vue";
import { ArcForm } from "~/logic/info-base/root";

const arcs = ref<ArcForm[]>([]);
const arcsEditorRef = ref<InstanceType<typeof ArcsEditor>>();

// Programmatically add an arc
const addNewArc = () => {
  arcsEditorRef.value?.addArc();
};
</script>
```

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `modelValue` | `ArcForm[]` | Yes | - | Array of arc forms to display and edit |
| `type` | `"incoming" \| "outgoing"` | Yes | - | Whether these are incoming or outgoing arcs |
| `relationType` | `"x" \| "y"` | No | `"x"` | Type of relation visualization (horizontal or vertical) |

## Events

This component uses v-model, so it directly mutates the `modelValue` array.

## Exposed Methods

| Method | Parameters | Description |
|--------|------------|-------------|
| `addArc()` | None | Adds a new arc to the collection and navigates to it |
| `prev()` | None | Navigate to the previous arc |
| `next()` | None | Navigate to the next arc (or add new if at the end) |

## Features

### Horizontal Scrolling

- Arcs are laid out horizontally in a scrollable container
- Smooth scrolling behavior when navigating between arcs
- Hidden scrollbars for cleaner UI (scrollbar-hide)
- Automatic scroll to active arc on navigation

### Navigation Controls

When more than one arc exists:
- **Counter**: Shows current position (e.g., "2/5")
- **Previous Button** (←): Navigate to previous arc
- **Next Button** (→): Navigate to next arc or create new

### Keyboard Shortcuts

**Arc Navigation**:
- `Alt+Tab`: Navigate to next arc
- `Alt+Shift+Tab`: Navigate to previous arc

**Arc Deletion**:
- `Shift+Backspace`: Remove current arc and navigate to previous
- `Shift+Delete`: Remove current arc and maintain position

### Dynamic Arc Management

- Add new arcs on-the-fly
- Remove arcs with keyboard shortcuts
- Automatic focus management when adding/removing
- Maintains current index after deletions

### Visual Feedback

- **Pressed State**: Button press animation
- **Shake Animation**: When trying to go back from first arc
- **Disabled State**: Previous button disabled on first arc
- **Focus Indicators**: Keyboard navigation support

## Component Hierarchy

```
ArcsEditor
├── .arcs-container (scrollable)
│   └── ArcEditor × N
│       ├── BlockEditor
│       └── RelationEditor
└── .navigation-controls (if > 1 arc)
    ├── Counter (e.g., "2/5")
    └── Navigation Buttons (← →)
```

## Arc Structure

Each arc in the `modelValue` array is an `ArcForm`:

```typescript
ArcForm {
  relation: RelationForm;
  from_block?: StarGraphForm;  // For incoming arcs
  to_block?: StarGraphForm;    // For outgoing arcs
}
```

When `addArc()` is called:
- Creates new empty Block
- Creates ArcForm with empty relation
- Assigns block to appropriate position based on type
- Scrolls to new arc and focuses its block editor

## Styling

### Layout Modes

**Incoming Mode** (`type="incoming"`):
- Flex direction: column-reverse
- Navigation controls appear at bottom

**Outgoing Mode** (`type="outgoing"`):
- Flex direction: column
- Navigation controls appear at top

### CSS Classes

- `.arcs-editor-wrapper` - Main container with flex layout
  - `.incoming` - Reverse column layout
  - `.outgoing` - Normal column layout
- `.arcs-container` - Horizontal scroll container
- `.arc-item` - Individual arc wrapper
- `.navigation-controls` - Navigation UI container
- `.arc-counter` - Position indicator text
- `.nav-buttons` - Button group
- `.nav-button` - Individual navigation button
  - `.prev-button` - Previous arc button
  - `.next-button` - Next arc button
- `.pressed` - Button press animation state
- `.shake` - Shake animation for invalid actions

### Animations

**Shake Animation** (0.5s):
```
Oscillates horizontally when trying to navigate before first arc
```

**Pressed Animation**:
```
Scale down to 0.95 on button press
```

## Keyboard Navigation Details

The component listens for keyboard events only when an arc editor is focused:

```typescript
function handleKeydown(event: KeyboardEvent) {
  const isBlockEditorFocused = arcEditors.value.some((editor) =>
    editor?.isFocusing()
  );
  if (!isBlockEditorFocused) return;

  // Handle Alt+Tab navigation
  // Handle Shift+Backspace/Delete for arc removal
}
```

This ensures keyboard shortcuts only work when the user is actively editing an arc.

## Navigation Behavior

### Previous Button
- Navigates to previous arc if not at first
- Disabled when at first arc (index 0)
- Shows shake animation if clicked when disabled

### Next Button
- Navigates to next arc if available
- Creates new arc if at the last arc
- Always enabled (creates new when at end)

### Automatic Scrolling

When navigating:
1. Updates index
2. Calls `scrollTo()`
3. Finds child element at current index
4. Scrolls it into view (smooth, centered)
5. Focuses the block editor after scroll completes

## Integration with TakingNote

The ArcsEditor is used in TakingNote component:

```vue
<ArcsEditor
  ref="incomingEditor"
  v-model="form.in_relations"
  type="incoming"
  relationType="y"
/>

<BlockEditor v-model="form.block" />

<ArcsEditor
  ref="outgoingEditor"
  v-model="form.out_relations"
  type="outgoing"
  relationType="y"
/>
```

Keyboard shortcuts in TakingNote:
- `Tab`: Calls `outgoingEditor.addArc()`
- `Shift+Tab`: Calls `incomingEditor.addArc()`

## Dependencies

### Components
- `ArcEditor` - Individual arc editing component

### Logic Modules
- `~/logic/info-base/root` - ArcForm, StarGraphForm types
- `~/logic/info-base/block` - Block type
- Vue's `ref`, `nextTick`, `withDefaults`

## Best Practices

1. **Always use refs** when you need to call `addArc()` programmatically
2. **Validate arc data** before submission to backend
3. **Handle empty states** gracefully
4. **Preserve focus** during navigation for keyboard users
5. **Test deletion behavior** at boundaries (first/last arc)
6. **Monitor performance** with large numbers of arcs

## Accessibility

- Keyboard navigable with Tab and arrow keys
- Focus indicators on navigation buttons
- Screen reader friendly counter text
- Disabled state properly communicated
- Focus management on arc creation/deletion

## Performance Considerations

- Horizontal scrolling is efficient even with many arcs
- Only visible arcs are rendered (browser viewport optimization)
- Smooth scroll uses CSS for hardware acceleration
- Event listeners are scoped to focused editors only
- Memory cleanup on component unmount

## File Structure

- `ArcsEditor.vue` - Component template and logic
- `ArcsEditor.scss` - Styling with animations
- `ArcsEditor.md` - This documentation file

## Example: Complete Integration

```vue
<script setup lang="ts">
import { ref } from "vue";
import ArcsEditor from "~/componentsinfo-base//ArcsEditor/ArcsEditor.vue";
import { ArcForm, StarGraphForm } from "~/logic/info-base/root";
import { Block } from "~/logic/info-base/block";

const incomingArcs = ref<ArcForm[]>([]);
const outgoingArcs = ref<ArcForm[]>([]);

const incomingEditor = ref<InstanceType<typeof ArcsEditor>>();
const outgoingEditor = ref<InstanceType<typeof ArcsEditor>>();

// Add some initial arcs
incomingArcs.value.push(
  new ArcForm(
    { content: "is part of" },
    null,
    new StarGraphForm(new Block("text", "Category A"))
  )
);

// Programmatic arc management
const addIncoming = () => incomingEditor.value?.addArc();
const addOutgoing = () => outgoingEditor.value?.addArc();

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === "Tab" && event.shiftKey) {
    event.preventDefault();
    addIncoming();
  } else if (event.key === "Tab") {
    event.preventDefault();
    addOutgoing();
  }
};
</script>

<template>
  <div @keydown="handleKeydown">
    <ArcsEditor
      ref="incomingEditor"
      v-model="incomingArcs"
      type="incoming"
      relationType="y"
    />

    <div class="main-content">
      <!-- Main block editor here -->
    </div>

    <ArcsEditor
      ref="outgoingEditor"
      v-model="outgoingArcs"
      type="outgoing"
      relationType="y"
    />

    <div class="actions">
      <button @click="addIncoming">Add Incoming</button>
      <button @click="addOutgoing">Add Outgoing</button>
    </div>
  </div>
</template>
```

## Troubleshooting

### Arcs not scrolling into view
- Check that container ref is properly bound
- Verify scroll-behavior CSS is applied
- Ensure child elements have proper width

### Keyboard shortcuts not working
- Verify an arc editor is focused
- Check that events aren't being captured by parent
- Ensure tabindex is set on container

### Navigation buttons not appearing
- Check that modelValue has more than one arc
- Verify v-if condition is evaluating correctly
- Inspect computed length property

### Arcs disappearing after deletion
- Check index is properly updated after splice
- Verify scrollTo is called after deletion
- Ensure reactive updates are triggering

## Future Enhancements

Potential improvements:
- Drag-and-drop reordering
- Touch gesture support for mobile
- Vertical scrolling mode option
- Bulk operations (delete multiple, reorder)
- Arc templates for quick creation
- Copy/paste arcs
- Undo/redo for arc operations
- Visual connection lines between arcs
- Minimap for large arc collections
- Search/filter arcs by content
- Arc grouping/categorization
- Animation preferences (enable/disable)
- Custom keyboard shortcut configuration

## Related Components

- `ArcEditor.vue` - Individual arc editing
- `TakingNote.vue` - Uses ArcsEditor for note-taking
- `BlockEditor.vue` - Edits block content within arcs
- `RelationEditor.vue` - Edits relation content within arcs
