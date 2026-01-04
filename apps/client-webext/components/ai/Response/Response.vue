<script setup lang="ts">
import VueMarkdownRender from "vue-markdown-render";

/**
 * Response Component
 *
 * A component that renders a Markdown response from a large language model.
 * Based on AI SDK Elements response component.
 *
 * @see https://ai-sdk.dev/elements/components/response
 */

interface Props {
  /**
   * The markdown content to render
   */
  content?: string;
  /**
   * Whether the response is currently streaming/loading
   */
  isLoading?: boolean;
  /**
   * Custom class name for styling
   */
  className?: string;
}

const props = withDefaults(defineProps<Props>(), {
  content: "",
  isLoading: false,
  className: "",
});
</script>

<template>
    <div :class="['ai-response', className]">
        <div v-if="content" class="ai-response-content">
            <vue-markdown-render :source="content" />
            <span v-if="isLoading" class="streaming-cursor"></span>
        </div>
        <div v-else-if="isLoading" class="ai-response-loading">
            <span class="loading-indicator"></span>
        </div>
        <div v-else class="ai-response-empty">
            <slot name="empty">
                <p class="empty-message">No response yet</p>
            </slot>
        </div>
    </div>
</template>

<style scoped lang="scss" src="./Response.scss"></style>
