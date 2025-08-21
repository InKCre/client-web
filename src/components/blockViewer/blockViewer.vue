<template>
  <div class="block-viewer" @click="onBlockClick">
    <div class="block-preview">
      <!-- 这里根据 resolver 渲染不同类型的内容 -->
      <div class="content-placeholder">
        <span class="content-icon">◆</span>
        <span class="loading-text">LOADING...</span>
      </div>
    </div>
    <div class="block-footer">
      <span class="block-id">#{{ blockId }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ blockId: number }>()
const emit = defineEmits(['click'])

function onBlockClick() {
  emit('click', props.blockId)
}
</script>

<style lang="scss" scoped>
@use '@/styles/main.scss' as *;

.block-viewer {
  position: relative;
  @include card-elevated;
  @include font-mono;
  cursor: pointer;
  overflow: hidden;
  margin-bottom: var(--space-sm);

  &:hover {
    border-color: var(--color-primary-light);
    transform: translateZ(0) scale(1.02);

    .port {
      border-color: var(--color-primary-light);
      background: var(--color-primary-light);
      box-shadow: var(--shadow-glow);
    }
  }
}

.block-footer {
  display: flex;
  justify-content: flex-end;
  padding: var(--space-xs) var(--space-md);
  background: linear-gradient(
    90deg,
    var(--color-background) 0%,
    var(--color-background-muted) 100%
  );
  border-bottom: 1px solid var(--color-border);
}

.block-id {
  @include text-small-caps;
  color: var(--color-text-soft);
}

.block-type {
  @include text-small-caps;
  font-size: var(--font-size-xs);
  color: var(--color-text-light);
}

.block-preview {
  padding: var(--space-lg) var(--space-md);
  min-height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.content-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
  color: var(--color-text-light);
}

.content-icon {
  font-size: var(--font-size-5xl);
  animation: pulse 2s ease-in-out infinite;
}

.loading-text {
  @include text-small-caps;
}

.block-footer {
  padding: var(--space-sm) var(--space-md);
  border-top: 1px solid var(--color-border);
  background: var(--color-background-soft);
}

.connection-ports {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.port {
  width: var(--space-sm);
  height: var(--space-sm);
  border: 1px solid var(--color-border);
  background: var(--color-background);
  transition: all 0.2s ease;

  &.in {
    border-radius: var(--radius-xs);
  }

  &.out {
    border-radius: var(--radius-full);
  }
}
</style>
