<template>
  <div class="workspace">
    <!-- 主要工作区域 -->
    <main class="workspace__main">

      <!-- 控制面板 -->
      <aside class="workspace__control-panel">
        <!-- 管理入口 -->
        <section class="workspace__section workspace__management">
          <h3 class="workspace__section-title">MANAGE</h3>
          <div class="workspace__management-actions">
            <button @click="navigateToExtensions" class="workspace__action-btn workspace__action-btn--block">
              EXTENSIONS
            </button>
            <button @click="navigateToSettings" class="workspace__action-btn workspace__action-btn--block">
              SETTINGS
            </button>
          </div>
        </section>
      </aside>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import BlockViewer from "@/components/blockViewer/blockViewer.vue";
import { Block } from "@/business/block";
import { usePromise } from "@/business/use";
import { Relation } from "@/business/relation";
import { anyTrue } from "@/utils/base";

// 路由
const router = useRouter();

const blocks = ref<Block[]>([]);
// const { result: blocks, state: blocksState } = usePromise(Block.getAll, []);
// const { result: relations, state: relationsState } = usePromise(Relation.getAll, []);
// const isLoading = anyTrue(blocksState.loading, relationsState.loading);
// const hasError = anyTrue(() => blocksState.hasError(), () => relationsState.hasError());

// 本地状态

// 瀑布流相关
// 布局状态
const gridColumns = ref(0);
const gridLoaded = ref(false);
const blocksGridRef = ref<HTMLElement>();

// 动态内容监听
const resizeObserver = ref<ResizeObserver>();
const mutationObserver = ref<MutationObserver>();
const contentObservers = ref<Map<Element, ResizeObserver>>(new Map());
const layoutThrottleTimer = ref<number>();

// 节流的布局更新函数
const throttledLayout = () => {
  if (layoutThrottleTimer.value) {
    clearTimeout(layoutThrottleTimer.value);
  }
  layoutThrottleTimer.value = window.setTimeout(() => {
    applyMasonryLayout();
  }, 100);
};

const lastUpdateTime = computed(() => {
  if (blocks.value.length === 0) return "NO_DATA";
  const latest = blocks.value[0];
  const date = new Date(latest.updated_at);
  return date.toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
  });
});

// 计算列数和应用瀑布流布局
const calculateColumns = () => {
  if (!blocksGridRef.value || !gridLoaded.value) return;

  const containerWidth = blocksGridRef.value.offsetWidth;
  const minColumnWidth = 340;
  const gap = 24;
  const columns = Math.max(
    1,
    Math.floor((containerWidth + gap) / (minColumnWidth + gap))
  );

  gridColumns.value = columns;

  // 立即应用布局
  nextTick(() => {
    applyMasonryLayout();
  });
};

const applyMasonryLayout = async () => {
  await nextTick();

  if (!blocksGridRef.value) return;

  const items = Array.from(blocksGridRef.value.children) as HTMLElement[];
  if (items.length === 0) return;

  const gap = 16;
  const columnWidth =
    (blocksGridRef.value.offsetWidth - (gridColumns.value - 1) * gap) /
    gridColumns.value;

  // 初始化列高度数组
  const columnHeights = new Array(gridColumns.value).fill(0);

  // 先重置所有元素的样式，确保能正确测量高度
  items.forEach((item) => {
    item.style.position = "static";
    item.style.width = `${columnWidth}px`;
    item.style.opacity = "0";
  });

  // 等待一帧确保重新渲染
  await new Promise((resolve) => requestAnimationFrame(resolve));

  items.forEach((item, index) => {
    // 测量实际高度
    const itemHeight = item.offsetHeight;

    // 找到最短的列
    const shortestColumnIndex = columnHeights.indexOf(
      Math.min(...columnHeights)
    );

    // 设置项目的位置
    item.style.position = "absolute";
    item.style.left = `${shortestColumnIndex * (columnWidth + gap)}px`;
    item.style.top = `${columnHeights[shortestColumnIndex]}px`;
    item.style.opacity = "1";

    // 添加动画延迟
    item.style.setProperty("--index", index.toString());

    // 更新列高度
    columnHeights[shortestColumnIndex] += itemHeight + gap;
  });

  // 设置容器高度
  const maxHeight = Math.max(...columnHeights);
  blocksGridRef.value.style.height = `${maxHeight}px`;

  // 为每个块添加内容变化监听
  setupContentObservers(items);
};

// 设置内容变化监听器
const setupContentObservers = (items: HTMLElement[]) => {
  // 清理旧的观察器
  contentObservers.value.forEach((observer) => observer.disconnect());
  contentObservers.value.clear();

  items.forEach((item) => {
    // 为每个块项创建ResizeObserver
    const observer = new ResizeObserver((entries) => {
      // 当块的尺寸发生变化时，重新布局
      throttledLayout();
    });

    observer.observe(item);
    contentObservers.value.set(item, observer);

    // 监听图片加载
    const images = item.querySelectorAll("img");
    images.forEach((img) => {
      if (!img.complete) {
        img.addEventListener("load", throttledLayout, { once: true });
        img.addEventListener("error", throttledLayout, { once: true });
      }
    });

    // 监听内容变化（比如异步加载的文本）
    const textElements = item.querySelectorAll(
      '[class*="content"], [class*="text"]'
    );
    textElements.forEach((el) => {
      if (!contentObservers.value.has(el)) {
        const textObserver = new ResizeObserver(() => {
          throttledLayout();
        });
        textObserver.observe(el);
        contentObservers.value.set(el, textObserver);
      }
    });
  });
};

// 方法
const navigateToBlock = (blockId: number) => {
  router.push({ name: "FocusExplorer", params: { blockId } });
};

const navigateToExtensions = () => {
  router.push({ name: "Extensions" });
};

const navigateToSettings = () => {
  router.push({ name: "Settings" });
};

const refreshBlocks = async () => {
  try {
    blocks.value = await Block.getRecent(20);
    gridLoaded.value = true;
    // 重新应用瀑布流布局
    await nextTick();
    setTimeout(applyMasonryLayout, 100);
  } catch (err) {
    console.error("刷新块失败:", err);
  }
};

// 监听窗口大小变化
const handleResize = () => {
  calculateColumns();
};

// 设置DOM变化监听器
const setupMutationObserver = () => {
  if (!blocksGridRef.value) return;

  mutationObserver.value = new MutationObserver((mutations) => {
    let shouldReLayout = false;

    mutations.forEach((mutation) => {
      if (mutation.type === "childList") {
        // 有子元素添加或删除
        if (
          mutation.addedNodes.length > 0 ||
          mutation.removedNodes.length > 0
        ) {
          shouldReLayout = true;
        }
      } else if (mutation.type === "attributes") {
        // 元素属性变化（可能影响尺寸）
        const target = mutation.target as HTMLElement;
        if (
          target.classList.contains("workspace__block-item") ||
          target.closest(".workspace__block-item")
        ) {
          shouldReLayout = true;
        }
      }
    });

    if (shouldReLayout) {
      throttledLayout();
    }
  });

  mutationObserver.value.observe(blocksGridRef.value, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["class", "style"],
  });
};

// 初始化
onMounted(async () => {
  await refreshBlocks();

  // 设置 ResizeObserver 监听容器大小变化
  if (blocksGridRef.value) {
    resizeObserver.value = new ResizeObserver(() => {
      calculateColumns();
    });
    resizeObserver.value.observe(blocksGridRef.value);

    // 设置DOM变化监听器
    setupMutationObserver();
  }

  // 监听窗口大小变化
  window.addEventListener("resize", handleResize);

  // 初始布局
  await nextTick();
  setTimeout(calculateColumns, 100);
});

onUnmounted(() => {
  // 清理ResizeObserver
  if (resizeObserver.value) {
    resizeObserver.value.disconnect();
  }

  // 清理MutationObserver
  if (mutationObserver.value) {
    mutationObserver.value.disconnect();
  }

  // 清理内容观察器
  contentObservers.value.forEach((observer) => observer.disconnect());
  contentObservers.value.clear();

  // 清理定时器
  if (layoutThrottleTimer.value) {
    clearTimeout(layoutThrottleTimer.value);
  }

  // 清理窗口事件监听器
  window.removeEventListener("resize", handleResize);
});
</script>

<style lang="scss" scoped>
@use "@/styles/index.scss" as *;
@use "@/styles/abstract/functions" as fn;

.workspace__system-bar {
  @include card-flat;
  border-bottom: fn.sys-var('space', 'border', 'thin') solid fn.sys-var('color', 'surface', 'border', 'base');
  padding: fn.sys-var('space', 'scale', 'lg') fn.sys-var('space', 'scale', 'xl');
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: fn.sys-var('color', 'surface', 'bg', 'muted');
}

.workspace__system-info {
  display: flex;
  align-items: center;
  gap: fn.sys-var('space', 'scale', 'lg');
}

.workspace__system-title {
  @include text-mono-caps;
  font-size: fn.sys-var('type', 'display-sm', 'size');
  font-weight: 700;
  color: fn.sys-var('color', 'content', 'text', 'primary');
}

.workspace__system-status {
  @include text-small-caps;
  color: fn.sys-var('color', 'content', 'text', 'muted');
  padding: fn.sys-var('space', 'scale', 'xs') fn.sys-var('space', 'scale', 'sm');
  border: fn.sys-var('space', 'border', 'thin') solid fn.sys-var('color', 'surface', 'border', 'base');
  background: fn.sys-var('color', 'surface', 'bg', 'base');
}

.workspace__nav {
  display: flex;
  gap: fn.sys-var('space', 'scale', 'md');
}

.workspace__nav-link {
  @include text-small-caps;
  padding: fn.sys-var('space', 'scale', 'sm') fn.sys-var('space', 'scale', 'md');
  border: fn.sys-var('space', 'border', 'thin') solid fn.sys-var('color', 'surface', 'border', 'base');
  color: fn.sys-var('color', 'content', 'text', 'primary');
  text-decoration: none;
  background: fn.sys-var('color', 'surface', 'bg', 'base');
  transition: all 0.2s ease;

  &:hover {
    background: fn.sys-var('color', 'surface', 'bg', 'raised');
    border-color: fn.sys-var('color', 'action', 'state', 'hover');
  }
}

.workspace__error-bar {
  @include card-flat;
  background: fn.sys-var('color', 'surface', 'bg', 'strong');
  color: fn.sys-var('color', 'content', 'text', 'primary');
  padding: fn.sys-var('space', 'scale', 'md') fn.sys-var('space', 'scale', 'xl');
  border-bottom: fn.sys-var('space', 'border', 'thin') solid fn.sys-var('color', 'surface', 'border', 'base');
  text-align: center;
  @include text-small-caps;
}

.workspace__loading-bar {
  @include card-flat;
  padding: fn.sys-var('space', 'scale', 'xl');
  display: flex;
  align-items: center;
  justify-content: center;
  gap: fn.sys-var('space', 'scale', 'md');
  background: fn.sys-var('color', 'surface', 'bg', 'muted');
  border-bottom: fn.sys-var('space', 'border', 'thin') solid fn.sys-var('color', 'surface', 'border', 'base');

  .workspace__loading-icon {
    font-size: fn.sys-var('type', 'display-sm', 'size');
    animation: pulse 2s infinite;
  }

  .workspace__loading-text {
    @include text-small-caps;
    color: fn.sys-var('color', 'content', 'text', 'muted');
  }
}

.workspace__main {
  display: grid;
  grid-template-columns: 1fr 300px;
  min-height: calc(100vh - 80px);
}

.workspace__blocks {
  padding: fn.sys-var('space', 'scale', 'xl');
  border-right: fn.sys-var('space', 'border', 'thin') solid fn.sys-var('color', 'surface', 'border', 'base');
  background: fn.sys-var('color', 'surface', 'bg', 'base');
}

.workspace__section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: fn.sys-var('space', 'scale', 'xl');
  padding-bottom: fn.sys-var('space', 'scale', 'md');
  border-bottom: fn.sys-var('space', 'border', 'thin') solid fn.sys-var('color', 'surface', 'border', 'base');
}

.workspace__section-title {
  @include text-mono-caps;
  font-size: fn.sys-var('type', 'title-sm', 'size');
  font-weight: 600;
  color: fn.sys-var('color', 'content', 'text', 'primary');
  margin: 0;
}

.workspace__action-btn {
  @include text-small-caps;
  padding: fn.sys-var('space', 'scale', 'sm') fn.sys-var('space', 'scale', 'md');
  border: fn.sys-var('space', 'border', 'thin') solid fn.sys-var('color', 'surface', 'border', 'base');
  background: fn.sys-var('color', 'surface', 'bg', 'base');
  color: fn.sys-var('color', 'content', 'text', 'primary');
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
  display: inline-block;
  text-align: center;

  &:hover:not(:disabled) {
    background: fn.sys-var('color', 'surface', 'bg', 'raised');
    border-color: fn.sys-var('color', 'action', 'state', 'hover');
  }

  &:disabled {
    opacity: fn.sys-var('opacity', 'muted');
    cursor: not-allowed;
  }

  &--link {
    display: block;
  }

  &--block {
    display: block;
    width: 100%;
  }
}

.workspace__blocks-grid {
  position: relative;
  width: 100%;
  min-height: 200px;
  transition: height 0.3s ease;
}

.workspace__block-item {
  transition: transform 0.2s ease, opacity 0.2s ease;
  height: fit-content;
  opacity: 0;
  animation: fadeInUp 0.4s ease forwards;

  &:hover {
    transform: translateY(-4px) scale(1.02);
    z-index: 10;
  }

  // 移除默认的margin-bottom，由瀑布流布局控制间距
  :deep(.block-viewer) {
    margin-bottom: 0;
    box-shadow: fn.sys-var('elevation', 'low');

    &:hover {
      box-shadow: fn.sys-var('elevation', 'high');
    }
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.workspace__control-panel {
  background: fn.sys-var('color', 'surface', 'bg', 'muted');
  padding: fn.sys-var('space', 'scale', 'lg');
  display: flex;
  flex-direction: column;
  gap: fn.sys-var('space', 'scale', 'lg');
}

.workspace__section {
  @include card-flat;
  border: fn.sys-var('space', 'border', 'thin') solid fn.sys-var('color', 'surface', 'border', 'base');
  background: fn.sys-var('color', 'surface', 'bg', 'base');
  padding: fn.sys-var('space', 'scale', 'lg');
}

.workspace__creator {
  display: flex;
  flex-direction: column;
  gap: fn.sys-var('space', 'scale', 'lg');
}

.workspace__creator-block,
.workspace__creator-relation {
  display: flex;
  flex-direction: column;
  gap: fn.sys-var('space', 'scale', 'md');
  padding: fn.sys-var('space', 'scale', 'md');
  border: fn.sys-var('space', 'border', 'thin') solid fn.sys-var('color', 'surface', 'border', 'subtle');
  background: fn.sys-var('color', 'surface', 'bg', 'muted');
}

.workspace__creator-title {
  @include text-small-caps;
  font-size: fn.sys-var('type', 'body-sm', 'size');
  font-weight: 600;
  color: fn.sys-var('color', 'content', 'text', 'muted');
  margin: 0;
}

.workspace__creator-form {
  display: flex;
  flex-direction: column;
  gap: fn.sys-var('space', 'scale', 'sm');
}

.workspace__creator-input {
  @include font-mono;
  padding: fn.sys-var('space', 'scale', 'sm');
  border: fn.sys-var('space', 'border', 'thin') solid fn.sys-var('color', 'surface', 'border', 'base');
  background: fn.sys-var('color', 'surface', 'bg', 'base');
  color: fn.sys-var('color', 'content', 'text', 'primary');
  font-size: fn.sys-var('type', 'body-sm', 'size');

  &::placeholder {
    color: fn.sys-var('color', 'content', 'text', 'subtle');
    @include text-small-caps;
  }

  &:focus {
    outline: none;
    border-color: fn.sys-var('color', 'action', 'state', 'hover');
  }

  &--textarea {
    resize: vertical;
    min-height: 60px;
    font-family: inherit;
  }

  &--select {
    @include text-small-caps;
  }
}

.workspace__creator-btn {
  @include text-small-caps;
  padding: fn.sys-var('space', 'scale', 'sm') fn.sys-var('space', 'scale', 'md');
  border: fn.sys-var('space', 'border', 'thin') solid fn.sys-var('color', 'action', 'bg', 'primary');
  background: fn.sys-var('color', 'action', 'bg', 'primary');
  color: fn.sys-var('color', 'surface', 'bg', 'base');
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    background: fn.sys-var('color', 'action', 'state', 'hover');
    border-color: fn.sys-var('color', 'action', 'state', 'hover');
  }

  &:disabled {
    opacity: fn.sys-var('opacity', 'muted');
    cursor: not-allowed;
  }
}

.workspace__stats-grid {
  display: flex;
  flex-direction: column;
  gap: fn.sys-var('space', 'scale', 'sm');
}

.workspace__stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: fn.sys-var('space', 'scale', 'sm') 0;
  border-bottom: fn.sys-var('space', 'border', 'thin') solid fn.sys-var('color', 'surface', 'border', 'subtle');

  &:last-child {
    border-bottom: none;
  }
}

.workspace__stat-label {
  @include text-small-caps;
  color: fn.sys-var('color', 'content', 'text', 'muted');
  font-size: fn.sys-var('type', 'label-sm', 'size');
}

.workspace__stat-value {
  @include font-mono;
  color: fn.sys-var('color', 'content', 'text', 'primary');
  font-weight: 600;
}

.workspace__management {
  display: flex;
  flex-direction: column;
  gap: fn.sys-var('space', 'scale', 'md');
}

.workspace__management-actions {
  display: flex;
  flex-direction: column;
  gap: fn.sys-var('space', 'scale', 'sm');
}

.workspace__actions-grid {
  display: flex;
  flex-direction: column;
  gap: fn.sys-var('space', 'scale', 'sm');
}

// 响应式设计
@include mobile {
  .workspace__main {
    grid-template-columns: 1fr;
  }

  .workspace__control-panel {
    order: -1;
    padding: fn.sys-var('space', 'scale', 'md');
  }

  .workspace__blocks {
    padding: fn.sys-var('space', 'scale', 'md');
  }

  .workspace__blocks-grid {
    // 移动设备上使用简单的单列布局
    position: static;
    display: flex;
    flex-direction: column;
    gap: fn.sys-var('space', 'scale', 'sm');

    .workspace__block-item {
      position: static !important;
      width: 100% !important;
      left: auto !important;
      top: auto !important;
    }
  }

  .workspace__system-bar {
    flex-direction: column;
    gap: fn.sys-var('space', 'scale', 'md');
    align-items: stretch;
    text-align: center;
  }
}

@include tablet {
  .workspace__main {
    grid-template-columns: 1fr 280px;
  }

  .workspace__control-panel {
    padding: fn.sys-var('space', 'scale', 'md');
    gap: fn.sys-var('space', 'scale', 'md');
  }
}

// 添加加载状态的样式
.workspace__blocks-grid--loading {
  .workspace__block-item {
    animation-delay: calc(var(--index, 0) * 0.1s);
  }
}
</style>
