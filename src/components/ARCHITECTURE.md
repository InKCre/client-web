# InKCre/client-web Component Architecture

Components in InKCre are organized by **business domain**, with shared utilities in `common/`.
Each component follows a consistent file structure pattern for maintainability and reusability.

---

## Component Development Pattern

### File Structure

Every component follows this pattern:

```
componentName/
├── componentName.md            # Documentation
├── componentName.vue           # Template & logic
├── componentName.ts            # Props, emits, types, utilities
└── componentName.scss          # Styles (optional)
```

### Example: extensionCard

**extensionCard.ts** - Props & Emits:

```typescript
import { makeExtensionProp, makeClientRefProp } from "@/business/extension";
import type { Extension } from "@/business/extension";

export const extensionCardProps = {
  extension: makeExtensionProp(),
  clientId: makeClientRefProp(),
} as const;

export const extensionCardEmits = {
  toggle: (extension: Extension) => true,
  "edit-config": (extension: Extension) => true,
} as const;
```

**extensionCard.vue** - Component:

```vue
<script setup lang="ts">
import { extensionCardProps, extensionCardEmits } from "./extensionCard";

const props = defineProps(extensionCardProps);
const emit = defineEmits(extensionCardEmits);

function handleToggle() {
  emit("toggle", props.extension);
}
</script>

<template>
  <div class="extension-card">
    <h3>{{ extension.name }}</h3>
    <p>{{ extension.description }}</p>
    <button @click="handleToggle">
      {{ extension.state }}
    </button>
  </div>
</template>

<style scoped src="./extensionCard.scss"></style>
```

---

## Component Types

### 1. Domain Components

**Purpose**: Tightly coupled to specific business domains

**Examples**:

- `sourceCard` - Display Source entity
- `extensionCard` - Display Extension entity
- `BlockNode` - Display Block in graph

**Characteristics**:

- Props accept BusinessClass instances
- Emit BusinessClass instances
- Domain-specific logic

### 2. Common Components

**Purpose**: Cross-domain reusable utilities

**Examples**:

- `AppSidePanel` - Navigation sidebar
- Design system components from `@inkcre/web-design`

**Characteristics**:

- Generic props (not tied to business entities)
- Highly reusable
- Minimal business logic

### 3. Resolver Content Components

**Purpose**: Display resolved block content

**Location**: `info-base/resolvers/`

**Examples**:

- `ContentText` - Display text content
- `ContentImage` - Display images
- `ContentTweet` - Display tweets (from extension)

**Pattern**:

```vue
<script setup lang="ts">
import type { ContentCompProps } from "@/business/info-base/resolver";

const props = defineProps<ContentCompProps<string>>();
</script>

<template>
  <div class="content-text">
    {{ solvedContent }}
  </div>
</template>
```

---

## Props & Emits Pattern

### Prop Helpers (vue-props.ts)

```typescript
import type { PropType } from "vue";

export const makeObjectProp = <T>(defaultVal?: T) => ({
  type: Object as PropType<T>,
  default: () => defaultVal,
});

export const makeStringProp = <T extends string>(defaultVal?: T) => ({
  type: String as unknown as PropType<T>,
  default: defaultVal,
});

export const makeNumberProp = <T extends number>(defaultVal?: T) => ({
  type: Number as unknown as PropType<T>,
  default: defaultVal,
});

export const makeBooleanProp = (defaultVal = false) => ({
  type: Boolean,
  default: defaultVal,
});
```

### BusinessClass Props

Each BusinessClass provides a prop helper:

```typescript
// In business/source.ts
export const makeSourceProp = (v?: any) => makeObjectProp<Source>(v);
export const makeSourceRefProp = (v?: any) => makeNumberProp<SourceRef>(v);

// In component
import { makeSourceProp } from "@/business/source";

export const sourceCardProps = {
  source: makeSourceProp(),
} as const;
```

### Emit Validators

```typescript
export const sourceCardEmits = {
  delete: (source: Source) => true,
  edit: (source: Source) => true,
  collect: (source: Source, params: any) => true,
} as const;

// Usage in component
emit("delete", props.source);
```

---

## Component-Business Integration

### Using BusinessClass Props

```vue
<script setup lang="ts">
import { sourceCardProps, sourceCardEmits } from "./sourceCard";
import type { Source } from "@/business/source";

const props = defineProps(sourceCardProps);
const emit = defineEmits(sourceCardEmits);

// Access BusinessClass methods
async function handleCollect() {
  try {
    await props.source.collect({});
    // Success
  } catch (error) {
    console.error(error);
  }
}
</script>
```

### Either Pattern (useEither)

Accept either ID or full object:

```typescript
import { useEither } from "@/composables/use-either";
import { Log } from "@/business/obsrv";

const props = defineProps<{
  log?: Log;
  logId?: string;
}>();

const { value: log, isLoading } = useEither(
  () => props.log,
  () => props.logId,
  (id) => Log.get(id)
);
```

---

## Reusability Patterns

### When to Create Common Components

✅ **Create common component when**:

- Used in 3+ different domains
- No business logic
- Generic interface
- High reusability potential

❌ **Don't create common component when**:

- Domain-specific logic
- Tightly coupled to BusinessClass
- Used in one domain only

### Composition Pattern

```vue
<script setup lang="ts">
// Compose domain components
import SourceCard from "@/components/source/sourceCard/sourceCard.vue";
import SourceForm from "@/components/source/sourceForm/sourceForm.vue";
</script>

<template>
  <div class="sources-view">
    <SourceForm @create="handleCreate" />
    <SourceCard
      v-for="source in sources"
      :key="source.id"
      :source="source"
      @delete="handleDelete"
    />
  </div>
</template>
```

---

## Composables

### useAsyncState (VueUse)

```typescript
import { useAsyncState } from "@vueuse/core";
import { Source } from "@/business/source";

const { state: sources, isLoading, execute: refetch } = useAsyncState(
  () => Source.getAll(),
  []
);
```

### useEither (Custom)

```typescript
// Defined in src/composables/use-either.ts
export function useEither<T>(
  getObject: () => T | undefined,
  getId: () => string | undefined,
  fetcher: (id: string) => Promise<T>
) {
  // Returns reactive value, fetches if only ID provided
}
```

### Layout Composables

```typescript
import { useLayoutManager } from "@/composables/useLayoutManager";
import { useForceLayout } from "@/composables/useForceLayout";
import { useCommunityDetection } from "@/composables/useCommunityDetection";

// Layout management for graph visualization
const layoutManager = useLayoutManager({
  nodes,
  edges,
  links,
  onPositionUpdate,
});
```

---

## Design System Integration

### @inkcre/web-design

**Import components**:

```vue
<script setup lang="ts">
import { InkButton, InkCard, InkInput } from "@inkcre/web-design";
</script>
```

### SCSS Mixins (Auto-injected)

```scss
// Available in all component .scss files
@use "@inkcre/web-design/styles/mixins" as *;
@use "@inkcre/web-design/styles/functions" as *;
@use "@/styles/index.scss" as *;

.my-component {
  @include surface-1;
  padding: spacing(4);
  
  &:hover {
    @include surface-2;
  }
}
```

### UnoCSS Utilities

```vue
<template>
  <div class="flex items-center gap-4 p-4">
    <button class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
      Click Me
    </button>
  </div>
</template>
```

**Safelist** (always available):

- `i-mdi-*` - Material Design Icons
- `animate-spin` - Spinner animation

---

## Best Practices

### 1. Component Sizing

**Keep components focused**:

- ✅ Single responsibility
- ✅ < 300 lines per file
- ❌ God components

### 2. Prop Design

```typescript
// Good: Type-safe, explicit
export const props = {
  source: makeSourceProp(),
  expanded: makeBooleanProp(false),
} as const;

// Bad: Any type, implicit
export const props = {
  data: Object,
  isOpen: Boolean,
};
```

### 3. Event Handling

```typescript
// Good: Emit entity instances
emit("delete", props.source);

// Bad: Emit IDs only
emit("delete", props.source.id);
```

### 4. Performance

**Lazy load heavy components**:

```vue
<script setup lang="ts">
const BlockGraph = defineAsyncComponent(
  () => import("@/components/info-base/BlockGraph/BlockGraph.vue")
);
</script>
```

**Use v-show for toggled content**:

```vue
<!-- Frequently toggled -->
<div v-show="isExpanded">Content</div>

<!-- Rarely toggled -->
<div v-if="isVisible">Content</div>
```

### 5. Accessibility

```vue
<template>
  <button
    :aria-label="$t('delete')"
    :aria-pressed="isActive"
    @click="handleClick"
  >
    <i class="i-mdi-delete" aria-hidden="true" />
  </button>
</template>
```

---

## Documentation Standards

### Component .md Files

```markdown
# ComponentName

## Purpose
Brief description of what the component does.

## Props
- `prop1` (Type) - Description
- `prop2` (Type) - Description

## Emits
- `event1(payload: Type)` - When this happens
- `event2(payload: Type)` - When that happens

## Features
- Feature 1
- Feature 2

## Usage Example
\`\`\`vue
<ComponentName :prop1="value" @event1="handler" />
\`\`\`
```

### AGENTS.md (Domain Level)

Document domain-specific patterns:

```markdown
# info-base Components

## BlockNode
- Renders block in Vue Flow graph
- Draggable, selectable
- Shows resolver icon

## RelationEdge
- Renders relation as edge
- Animated flow
- Type-based styling
```

---

## References

- [Root Architecture](../ARCHITECTURE.md)
- [Business Architecture](../business/ARCHITECTURE.md)
- [Component Instructions](.github/instructions/component.instructions.md)
- [@inkcre/web-design](https://github.com/InKCre/web-design)
- [VueUse](https://vueuse.org/)
- [UnoCSS](https://unocss.dev/)

---

**Last Updated**: January 2, 2026
