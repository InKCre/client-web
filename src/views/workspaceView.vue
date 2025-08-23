<template>
  <div class="workspace">
    <!-- 错误显示 -->
    <div v-if="hasError" class="workspace__error-bar">
      {{ allErrors }}
    </div>

    <!-- 加载状态 -->
    <div v-if="isLoading" class="workspace__loading-bar">
      <span class="workspace__loading-icon">▢</span>
      <span class="workspace__loading-text">LOADING...</span>
    </div>

    <!-- 主要工作区域 -->
    <main class="workspace__main">
      <!-- 块浏览网格 -->
      <section class="workspace__blocks">
        <header class="workspace__section-header">
          <h2 class="workspace__section-title">RECENT_BLOCKS</h2>
          <button
            @click="refreshBlocks"
            :disabled="blocks.loading.value"
            class="workspace__action-btn"
          >
            {{ blocks.loading.value ? 'LOADING...' : 'REFRESH' }}
          </button>
        </header>

        <div class="workspace__blocks-grid" ref="blocksGridRef">
          <BlockViewer
            v-for="block in blocks.blocks.value"
            :key="block.id"
            :block="block"
            mode="preview"
            :show-details="false"
            @click="(blockId) => navigateToBlock(blockId)"
            class="workspace__block-item"
          />
        </div>
      </section>

      <!-- 控制面板 -->
      <aside class="workspace__control-panel">
        <!-- 创建器 -->
        <section class="workspace__section workspace__creator">
          <h3 class="workspace__section-title">CREATE</h3>

          <!-- 块创建器 -->
          <div class="workspace__creator-block">
            <h4 class="workspace__creator-title">NEW_BLOCK</h4>
            <div class="workspace__creator-form">
              <textarea
                v-model="newBlockContent"
                rows="3"
                placeholder="ENTER_CONTENT..."
                class="workspace__creator-input workspace__creator-input--textarea"
              ></textarea>
              <select
                v-model="newBlockResolver"
                class="workspace__creator-input workspace__creator-input--select"
              >
                <option value="text">TEXT</option>
                <option value="url">URL</option>
                <option value="image">IMAGE</option>
              </select>
              <button
                @click="handleCreateBlock"
                :disabled="!newBlockContent.trim()"
                class="workspace__creator-btn"
              >
                CREATE
              </button>
            </div>
          </div>

          <!-- 关系创建器 -->
          <div class="workspace__creator-relation">
            <h4 class="workspace__creator-title">NEW_RELATION</h4>
            <div class="workspace__creator-form">
              <input
                v-model="newRelation.from_"
                type="number"
                placeholder="FROM_ID"
                class="workspace__creator-input"
              />
              <input
                v-model="newRelation.to_"
                type="number"
                placeholder="TO_ID"
                class="workspace__creator-input"
              />
              <input
                v-model="newRelation.content"
                placeholder="RELATION_CONTENT"
                class="workspace__creator-input"
              />
              <button
                @click="createNewRelation"
                :disabled="!canCreateRelation"
                class="workspace__creator-btn"
              >
                LINK
              </button>
            </div>
          </div>
        </section>

        <!-- 系统统计 -->
        <section class="workspace__section workspace__stats">
          <h3 class="workspace__section-title">SYSTEM</h3>
          <div class="workspace__stats-grid">
            <div class="workspace__stat-item">
              <span class="workspace__stat-label">BLOCKS</span>
              <span class="workspace__stat-value">{{ blocks.blocks.value.length }}</span>
            </div>
            <div class="workspace__stat-item">
              <span class="workspace__stat-label">RELATIONS</span>
              <span class="workspace__stat-value">{{
                relations.relations?.value?.length || 0
              }}</span>
            </div>
            <div class="workspace__stat-item">
              <span class="workspace__stat-label">UPDATED</span>
              <span class="workspace__stat-value">{{ lastUpdateTime }}</span>
            </div>
          </div>
        </section>
      </aside>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useInKCreAPI } from '@/api'
import BlockViewer from '@/components/blockViewer/blockViewer.vue'

// 路由
const router = useRouter()

// 使用组合式API
const { blocks, relations, isLoading, hasError, allErrors } = useInKCreAPI()

// 本地状态
const newBlockContent = ref('')
const newBlockResolver = ref('text')
const newRelation = ref({
  from_: null as number | null,
  to_: null as number | null,
  content: '',
})

// 瀑布流相关
// 布局状态
const gridColumns = ref(0)
const gridLoaded = ref(false)
const blocksGridRef = ref<HTMLElement>()

// 动态内容监听
const resizeObserver = ref<ResizeObserver>()
const mutationObserver = ref<MutationObserver>()
const contentObservers = ref<Map<Element, ResizeObserver>>(new Map())
const layoutThrottleTimer = ref<number>()

// 节流的布局更新函数
const throttledLayout = () => {
  if (layoutThrottleTimer.value) {
    clearTimeout(layoutThrottleTimer.value)
  }
  layoutThrottleTimer.value = window.setTimeout(() => {
    applyMasonryLayout()
  }, 100)
}

// 计算属性
const canCreateRelation = computed(() => {
  return (
    newRelation.value.from_ &&
    newRelation.value.to_ &&
    newRelation.value.content.trim() &&
    newRelation.value.from_ !== newRelation.value.to_
  )
})

const systemStatus = computed(() => {
  if (hasError.value) return 'ERROR'
  if (isLoading.value) return 'LOADING'
  return 'READY'
})

const lastUpdateTime = computed(() => {
  if (blocks.blocks.value.length === 0) return 'NO_DATA'
  const latest = blocks.blocks.value[0]
  const date = new Date(latest.updated_at)
  return date.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
  })
})

// 计算列数和应用瀑布流布局
const calculateColumns = () => {
  if (!blocksGridRef.value || !gridLoaded.value) return

  const containerWidth = blocksGridRef.value.offsetWidth
  const minColumnWidth = 340
  const gap = 24
  const columns = Math.max(1, Math.floor((containerWidth + gap) / (minColumnWidth + gap)))

  gridColumns.value = columns

  // 立即应用布局
  nextTick(() => {
    applyMasonryLayout()
  })
}

const applyMasonryLayout = async () => {
  await nextTick()

  if (!blocksGridRef.value) return

  const items = Array.from(blocksGridRef.value.children) as HTMLElement[]
  if (items.length === 0) return

  const gap = 16
  const columnWidth =
    (blocksGridRef.value.offsetWidth - (gridColumns.value - 1) * gap) / gridColumns.value

  // 初始化列高度数组
  const columnHeights = new Array(gridColumns.value).fill(0)

  // 先重置所有元素的样式，确保能正确测量高度
  items.forEach((item) => {
    item.style.position = 'static'
    item.style.width = `${columnWidth}px`
    item.style.opacity = '0'
  })

  // 等待一帧确保重新渲染
  await new Promise((resolve) => requestAnimationFrame(resolve))

  items.forEach((item, index) => {
    // 测量实际高度
    const itemHeight = item.offsetHeight

    // 找到最短的列
    const shortestColumnIndex = columnHeights.indexOf(Math.min(...columnHeights))

    // 设置项目的位置
    item.style.position = 'absolute'
    item.style.left = `${shortestColumnIndex * (columnWidth + gap)}px`
    item.style.top = `${columnHeights[shortestColumnIndex]}px`
    item.style.opacity = '1'

    // 添加动画延迟
    item.style.setProperty('--index', index.toString())

    // 更新列高度
    columnHeights[shortestColumnIndex] += itemHeight + gap
  })

  // 设置容器高度
  const maxHeight = Math.max(...columnHeights)
  blocksGridRef.value.style.height = `${maxHeight}px`

  // 为每个块添加内容变化监听
  setupContentObservers(items)
}

// 设置内容变化监听器
const setupContentObservers = (items: HTMLElement[]) => {
  // 清理旧的观察器
  contentObservers.value.forEach((observer) => observer.disconnect())
  contentObservers.value.clear()

  items.forEach((item) => {
    // 为每个块项创建ResizeObserver
    const observer = new ResizeObserver((entries) => {
      // 当块的尺寸发生变化时，重新布局
      throttledLayout()
    })

    observer.observe(item)
    contentObservers.value.set(item, observer)

    // 监听图片加载
    const images = item.querySelectorAll('img')
    images.forEach((img) => {
      if (!img.complete) {
        img.addEventListener('load', throttledLayout, { once: true })
        img.addEventListener('error', throttledLayout, { once: true })
      }
    })

    // 监听内容变化（比如异步加载的文本）
    const textElements = item.querySelectorAll('[class*="content"], [class*="text"]')
    textElements.forEach((el) => {
      if (!contentObservers.value.has(el)) {
        const textObserver = new ResizeObserver(() => {
          throttledLayout()
        })
        textObserver.observe(el)
        contentObservers.value.set(el, textObserver)
      }
    })
  })
}

// 方法
const navigateToBlock = (blockId: number) => {
  router.push({ name: 'FocusExplorer', params: { blockId } })
}

const refreshBlocks = async () => {
  try {
    await blocks.fetchRecentBlocks(20)
    gridLoaded.value = true
    // 重新应用瀑布流布局
    await nextTick()
    setTimeout(applyMasonryLayout, 100)
  } catch (err) {
    console.error('刷新块失败:', err)
  }
}

const handleCreateBlock = async () => {
  if (!newBlockContent.value.trim()) return

  try {
    const newBlock = await blocks.createBlock({
      content: newBlockContent.value.trim(),
      resolver: newBlockResolver.value,
      storage: newBlockResolver.value === 'url' ? 'url' : null,
    })

    // 清空表单
    newBlockContent.value = ''
    newBlockResolver.value = 'text'

    // 重新布局
    await nextTick()
    setTimeout(applyMasonryLayout, 100)

    // 跳转到新创建的块
    navigateToBlock(newBlock.id)
  } catch (err) {
    console.error('创建块失败:', err)
  }
}

const createNewRelation = async () => {
  if (!canCreateRelation.value) return

  try {
    const newRelationData = await relations.createRelation({
      from_: newRelation.value.from_!,
      to_: newRelation.value.to_!,
      content: newRelation.value.content.trim(),
    })

    // 清空表单
    newRelation.value = {
      from_: null,
      to_: null,
      content: '',
    }

    // 提示成功创建
    console.log('关系创建成功:', newRelationData)
  } catch (err) {
    console.error('创建关系失败:', err)
  }
}

// 监听窗口大小变化
const handleResize = () => {
  calculateColumns()
}

// 设置DOM变化监听器
const setupMutationObserver = () => {
  if (!blocksGridRef.value) return

  mutationObserver.value = new MutationObserver((mutations) => {
    let shouldReLayout = false

    mutations.forEach((mutation) => {
      if (mutation.type === 'childList') {
        // 有子元素添加或删除
        if (mutation.addedNodes.length > 0 || mutation.removedNodes.length > 0) {
          shouldReLayout = true
        }
      } else if (mutation.type === 'attributes') {
        // 元素属性变化（可能影响尺寸）
        const target = mutation.target as HTMLElement
        if (
          target.classList.contains('workspace__block-item') ||
          target.closest('.workspace__block-item')
        ) {
          shouldReLayout = true
        }
      }
    })

    if (shouldReLayout) {
      throttledLayout()
    }
  })

  mutationObserver.value.observe(blocksGridRef.value, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['class', 'style'],
  })
}

// 初始化
onMounted(async () => {
  await refreshBlocks()

  // 设置 ResizeObserver 监听容器大小变化
  if (blocksGridRef.value) {
    resizeObserver.value = new ResizeObserver(() => {
      calculateColumns()
    })
    resizeObserver.value.observe(blocksGridRef.value)

    // 设置DOM变化监听器
    setupMutationObserver()
  }

  // 监听窗口大小变化
  window.addEventListener('resize', handleResize)

  // 初始布局
  await nextTick()
  setTimeout(calculateColumns, 100)
})

onUnmounted(() => {
  // 清理ResizeObserver
  if (resizeObserver.value) {
    resizeObserver.value.disconnect()
  }

  // 清理MutationObserver
  if (mutationObserver.value) {
    mutationObserver.value.disconnect()
  }

  // 清理内容观察器
  contentObservers.value.forEach((observer) => observer.disconnect())
  contentObservers.value.clear()

  // 清理定时器
  if (layoutThrottleTimer.value) {
    clearTimeout(layoutThrottleTimer.value)
  }

  // 清理窗口事件监听器
  window.removeEventListener('resize', handleResize)
})
</script>

<style lang="scss" scoped>
@use '@/styles/main.scss' as *;

/* BEM: block = workspace */
.workspace {
  @include font-mono;
}

.workspace__system-bar {
  @include card-flat;
  border-bottom: 1px solid var(--color-border);
  padding: var(--space-lg) var(--space-xl);
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--color-background-soft);
}

.workspace__system-info {
  display: flex;
  align-items: center;
  gap: var(--space-lg);
}

.workspace__system-title {
  @include text-mono-caps;
  font-size: var(--font-size-xl);
  font-weight: 700;
  color: var(--color-text);
}

.workspace__system-status {
  @include text-small-caps;
  color: var(--color-text-muted);
  padding: var(--space-xs) var(--space-sm);
  border: 1px solid var(--color-border);
  background: var(--color-background);
}

.workspace__nav {
  display: flex;
  gap: var(--space-md);
}

.workspace__nav-link {
  @include text-small-caps;
  padding: var(--space-sm) var(--space-md);
  border: 1px solid var(--color-border);
  color: var(--color-text);
  text-decoration: none;
  background: var(--color-background);
  transition: all 0.2s ease;

  &:hover {
    background: var(--color-background-muted);
    border-color: var(--color-primary-light);
  }
}

.workspace__error-bar {
  @include card-flat;
  background: var(--color-background-dark);
  color: var(--color-text);
  padding: var(--space-md) var(--space-xl);
  border-bottom: 1px solid var(--color-border);
  text-align: center;
  @include text-small-caps;
}

.workspace__loading-bar {
  @include card-flat;
  padding: var(--space-xl);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-md);
  background: var(--color-background-soft);
  border-bottom: 1px solid var(--color-border);

  .workspace__loading-icon {
    font-size: var(--font-size-xl);
    animation: pulse 2s infinite;
  }

  .workspace__loading-text {
    @include text-small-caps;
    color: var(--color-text-muted);
  }
}

.workspace__main {
  display: grid;
  grid-template-columns: 1fr 300px;
  min-height: calc(100vh - 80px);
}

.workspace__blocks {
  padding: var(--space-xl);
  border-right: 1px solid var(--color-border);
  background: var(--color-background);
}

.workspace__section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-xl);
  padding-bottom: var(--space-md);
  border-bottom: 1px solid var(--color-border);
}

.workspace__section-title {
  @include text-mono-caps;
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--color-text);
  margin: 0;
}

.workspace__action-btn {
  @include text-small-caps;
  padding: var(--space-sm) var(--space-md);
  border: 1px solid var(--color-border);
  background: var(--color-background);
  color: var(--color-text);
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
  display: inline-block;
  text-align: center;

  &:hover:not(:disabled) {
    background: var(--color-background-muted);
    border-color: var(--color-primary-light);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &--link {
    display: block;
  }
}

.workspace__blocks-grid {
  position: relative;
  width: 100%;
  min-height: 200px;
  transition: height 0.3s ease;
}

.workspace__block-item {
  transition:
    transform 0.2s ease,
    opacity 0.2s ease;
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
    box-shadow: var(--shadow-sm);

    &:hover {
      box-shadow: var(--shadow-lg);
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
  background: var(--color-background-soft);
  padding: var(--space-lg);
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

.workspace__section {
  @include card-flat;
  border: 1px solid var(--color-border);
  background: var(--color-background);
  padding: var(--space-lg);
}

.workspace__creator {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

.workspace__creator-block,
.workspace__creator-relation {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  padding: var(--space-md);
  border: 1px solid var(--color-border-light);
  background: var(--color-background-soft);
}

.workspace__creator-title {
  @include text-small-caps;
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--color-text-muted);
  margin: 0;
}

.workspace__creator-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.workspace__creator-input {
  @include font-mono;
  padding: var(--space-sm);
  border: 1px solid var(--color-border);
  background: var(--color-background);
  color: var(--color-text);
  font-size: var(--font-size-sm);

  &::placeholder {
    color: var(--color-text-light);
    @include text-small-caps;
  }

  &:focus {
    outline: none;
    border-color: var(--color-primary-light);
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
  padding: var(--space-sm) var(--space-md);
  border: 1px solid var(--color-primary);
  background: var(--color-primary);
  color: var(--color-background);
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    background: var(--color-primary-light);
    border-color: var(--color-primary-light);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.workspace__stats-grid {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.workspace__stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-sm) 0;
  border-bottom: 1px solid var(--color-border-light);

  &:last-child {
    border-bottom: none;
  }
}

.workspace__stat-label {
  @include text-small-caps;
  color: var(--color-text-muted);
  font-size: var(--font-size-xs);
}

.workspace__stat-value {
  @include font-mono;
  color: var(--color-text);
  font-weight: 600;
}

.workspace__actions-grid {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

// 响应式设计
@include mobile {
  .workspace__main {
    grid-template-columns: 1fr;
  }

  .workspace__control-panel {
    order: -1;
    padding: var(--space-md);
  }

  .workspace__blocks {
    padding: var(--space-md);
  }

  .workspace__blocks-grid {
    // 移动设备上使用简单的单列布局
    position: static;
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);

    .workspace__block-item {
      position: static !important;
      width: 100% !important;
      left: auto !important;
      top: auto !important;
    }
  }

  .workspace__system-bar {
    flex-direction: column;
    gap: var(--space-md);
    align-items: stretch;
    text-align: center;
  }
}

@include tablet {
  .workspace__main {
    grid-template-columns: 1fr 280px;
  }

  .workspace__control-panel {
    padding: var(--space-md);
    gap: var(--space-md);
  }
}

// 添加加载状态的样式
.workspace__blocks-grid--loading {
  .workspace__block-item {
    animation-delay: calc(var(--index, 0) * 0.1s);
  }
}
</style>
