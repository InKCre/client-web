# ProviderPicker Component

A dropdown component for selecting LLM (Large Language Model) providers and models for AI interactions.

## Overview

The ProviderPicker component provides a user interface for selecting from available LLM providers and their models. It automatically detects which providers have been configured with API keys and disables those that haven't been set up yet.

## Usage

```vue
<template>
  <ProviderPicker @change="handleModelChange" />
</template>

<script setup lang="ts">
import ProviderPicker from "~/components/common/ProviderPicker/ProviderPicker.vue";

const handleModelChange = () => {
  console.log("Model selection changed");
  // Re-fetch or update based on new model selection
};
</script>
```

## Props

This component does not accept any props. It manages its state through the global storage system.

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `change` | `[]` | Emitted when the user changes the selected model |

## Features

### Automatic Provider Detection

- Reads available providers from `llmProviders` storage
- Detects which providers have API keys configured
- Disables providers that haven't been configured

### Model Organization

Models are displayed in the format: `Provider Name - Model Name`

Example:
- OpenAI - gpt-4
- Anthropic - claude-3-opus
- Google - gemini-pro

### Default Model Support

- Shows a "默认 (Default)" option that uses the configured default model
- The default option is only enabled if the default model's provider is properly configured
- Displays the actual default model in parentheses

### Visual Feedback

- Disabled options show "(未配置)" (Not Configured) suffix
- Monospace font for consistency with the application design
- Focus states for accessibility

## State Management

The component relies on three reactive storage values:

- `llmProviders` - Array of provider configurations with API keys and model lists
- `selectedModel` - Currently selected model (format: `providerId:modelName`)
- `defaultModel` - Default model to use when no specific selection is made

## Styling

The component uses a minimalist design with:
- Monospace font (Courier New)
- Black border on white background
- Light gray focus state
- Flexbox layout for label and select alignment

### CSS Classes

- `.provider-picker` - Main container with flexbox layout
- `.picker-label` - Label styling (gray color, non-wrapping)
- `.picker-select` - Select dropdown with custom styling

## Configuration Requirements

Before using this component, ensure that:

1. At least one LLM provider is configured in the extension options
2. The provider has a valid API key set
3. The provider's models list is populated

If no providers are configured, all options will be disabled.

## Integration Points

### Used In

- `Explain.vue` - For selecting models during explanation generation
- Options/Settings panels - For model configuration

### Dependencies

- `~/logic/storage` - For accessing provider and model configuration
- Vue's `computed` API for reactive model lists

## Example: Full Integration

```vue
<script setup lang="ts">
import { ref, watch } from "vue";
import ProviderPicker from "~/components/common/ProviderPicker/ProviderPicker.vue";
import { selectedModel, defaultModel } from "~/logic/storage";

const currentResponse = ref("");

const handleModelChange = () => {
  // Clear previous response and fetch with new model
  currentResponse.value = "";
  fetchWithNewModel();
};

const fetchWithNewModel = async () => {
  const modelToUse = selectedModel.value || defaultModel.value;
  console.log("Using model:", modelToUse);
  // Perform AI request...
};

// Watch for external model changes
watch([selectedModel, defaultModel], () => {
  console.log("Model configuration changed");
});
</script>

<template>
  <div>
    <ProviderPicker @change="handleModelChange" />
    <div class="response">{{ currentResponse }}</div>
  </div>
</template>
```

## Accessibility

- Uses semantic HTML with proper `<label>` and `<select>` elements
- Label is associated with select via `for` and `id` attributes
- Keyboard navigable
- Screen reader friendly with disabled states announced

## Localization

Current labels are in Chinese:
- "模型:" - Model:
- "默认" - Default
- "(未配置)" - (Not Configured)

To localize, update these strings in the template section.

## Best Practices

1. **Always handle the `change` event** to respond to model selection changes
2. **Check for configured providers** before showing AI features
3. **Provide fallback UI** when no providers are configured
4. **Clear cached responses** when switching models
5. **Save user preferences** for selected models across sessions

## File Structure

- `ProviderPicker.vue` - Component template and script
- `ProviderPicker.scss` - Component styles
- `ProviderPicker.md` - This documentation file

## Future Enhancements

Potential improvements:
- Add provider icons/logos
- Show model capabilities (context length, pricing)
- Group models by provider with optgroup
- Add "Configure Provider" quick action
- Display token usage/cost estimates
- Support for model-specific parameters