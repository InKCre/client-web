<script setup lang="ts">
import VueMarkdownRender from "vue-markdown-render";

/**
 * Response Component
 *
 * A component that renders a Markdown response from a large language model.
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

<style scoped>
.ai-response {
    font-family: var(--font-mono);
    line-height: 1.6;
    color: rgb(var(--color-text));
}

.ai-response-loading {
    display: flex;
    align-items: center;
    padding: 16px 0;
}

.loading-indicator {
    display: inline-block;
    width: 4px;
    height: 16px;
    background: rgb(var(--color-text));
    animation: blink 1s infinite;
}

@keyframes blink {
    0%,
    49% {
        opacity: 1;
    }
    50%,
    100% {
        opacity: 0;
    }
}

.streaming-cursor {
    display: inline-block;
    width: 2px;
    height: 1em;
    background: rgb(var(--color-text));
    margin-left: 2px;
    animation: blink 1s infinite;
    vertical-align: text-bottom;
}

.ai-response-content {
    color: rgb(var(--color-text));
}

.ai-response-empty {
    padding: 16px 0;
    color: rgb(var(--color-muted));
    text-align: center;
}

.empty-message {
    margin: 0;
    font-style: italic;
}

/* Markdown styling */
.ai-response-content :deep(p) {
    margin: 12px 0;
}

.ai-response-content :deep(p:first-child) {
    margin-top: 0;
}

.ai-response-content :deep(p:last-child) {
    margin-bottom: 0;
}

.ai-response-content :deep(h1),
.ai-response-content :deep(h2),
.ai-response-content :deep(h3),
.ai-response-content :deep(h4),
.ai-response-content :deep(h5),
.ai-response-content :deep(h6) {
    color: rgb(var(--color-text));
    margin: 20px 0 12px 0;
    font-weight: 600;
    line-height: 1.3;
}

.ai-response-content :deep(h1:first-child),
.ai-response-content :deep(h2:first-child),
.ai-response-content :deep(h3:first-child) {
    margin-top: 0;
}

.ai-response-content :deep(h1) {
    font-size: 1.5em;
}

.ai-response-content :deep(h2) {
    font-size: 1.3em;
}

.ai-response-content :deep(h3) {
    font-size: 1.1em;
}

.ai-response-content :deep(code) {
    background: rgb(var(--color-surface-2));
    padding: 2px 6px;
    border-radius: 0;
    font-family: var(--font-mono);
    font-size: 0.9em;
    border: 1px solid rgb(var(--color-border));
}

.ai-response-content :deep(pre) {
    background: rgb(var(--color-surface-2));
    padding: 12px;
    border-radius: 0;
    overflow-x: auto;
    border: 1px solid rgb(var(--color-border));
    margin: 12px 0;
}

.ai-response-content :deep(pre code) {
    background: none;
    padding: 0;
    border: none;
    border-radius: 0;
}

.ai-response-content :deep(ul),
.ai-response-content :deep(ol) {
    margin: 12px 0;
    padding-left: 24px;
}

.ai-response-content :deep(li) {
    margin: 4px 0;
}

.ai-response-content :deep(blockquote) {
    margin: 12px 0;
    padding: 8px 16px;
    border-left: 4px solid rgb(var(--color-border));
    background: rgb(var(--color-surface-2));
    color: rgb(var(--color-muted));
}

.ai-response-content :deep(a) {
    color: rgb(var(--color-brand));
    text-decoration: none;
}

.ai-response-content :deep(a:hover) {
    text-decoration: underline;
}

.ai-response-content :deep(hr) {
    border: none;
    border-top: 1px solid rgb(var(--color-border));
    margin: 20px 0;
}

.ai-response-content :deep(table) {
    border-collapse: collapse;
    width: 100%;
    margin: 12px 0;
}

.ai-response-content :deep(th),
.ai-response-content :deep(td) {
    border: 1px solid rgb(var(--color-border));
    padding: 8px 12px;
    text-align: left;
}

.ai-response-content :deep(th) {
    background: rgb(var(--color-surface-2));
    font-weight: 600;
}

.ai-response-content :deep(img) {
    max-width: 100%;
    height: auto;
    margin: 12px 0;
}

.ai-response-content :deep(strong) {
    font-weight: 600;
}

.ai-response-content :deep(em) {
    font-style: italic;
}
</style>
