<template>
  <div class="block-viewer" :class="[
    `block-viewer--${props.mode || 'default'}`,
    { 'block-viewer--detailed': props.showDetails },
  ]" @click="onBlockClick">
    <div class="block-viewer__preview">
      <!-- 根据 resolver 渲染不同类型的内容 -->
      <div v-if="loading" class="block-viewer__content-placeholder">
        <span class="block-viewer__content-icon">◆</span>
        <span class="block-viewer__loading-text">LOADING...</span>
      </div>
      <div v-else-if="error" class="block-viewer__content-error">
        <span class="block-viewer__content-icon">⚠</span>
        <span class="block-viewer__error-text">{{ error }}</span>
      </div>
      <div v-else-if="internalBlock" class="block-viewer__content">
        <!-- 文本内容 -->
        <div v-if="internalBlock.resolver === 'text'" class="block-viewer__text">
          {{ truncateContent(internalBlock.content) }}
        </div>
        <!-- 图片内容 -->
        <div v-else-if="internalBlock.resolver === 'image'" class="block-viewer__image">
          <img :src="internalBlock.content" :alt="`Block ${internalBlock.id}`" />
        </div>
        <!-- URL内容 -->
        <div v-else-if="internalBlock.resolver === 'url'" class="block-viewer__url">
          <a :href="internalBlock.content" target="_blank" rel="noopener noreferrer" @click.stop>
            {{ truncateContent(internalBlock.content) }}
          </a>
        </div>
        <div v-else-if="internalBlock.resolver === 'tweet'">
          <TweetResolver :block="internalBlock" />
        </div>
        <!-- 其他类型的内容 -->
        <div v-else class="block-viewer__unknown">
          <span class="block-viewer__resolver">{{ internalBlock.resolver }}:</span>
          <span class="block-viewer__content-text">{{
            truncateContent(internalBlock.content)
          }}</span>
        </div>
      </div>
    </div>
    <div class="block-viewer__footer">
      <span class="block-viewer__id">#{{ props.block ? props.block.id : props.blockId }}</span>
      <span v-if="internalBlock && (props.showDetails || props.mode === 'default')" class="block-viewer__resolver-tag">
        {{ internalBlock.resolver }}
      </span>
      <span v-if="internalBlock" class="block-viewer__updated">
        {{ formatDate(internalBlock.updated_at) }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, defineAsyncComponent } from "vue";
import { Block } from "@/business/block";
import type { BlockViewerProps } from "./blockViewerTypes";
// const TweetResolver = defineAsyncComponent(() => import('inkcreTwitter/tweetResolver'))

const props = defineProps<BlockViewerProps>();
const emit = defineEmits<{
  click: [blockId: number, block?: Block];
}>();

// 响应式数据：优先使用父组件传入的 block
const internalBlock = ref<Block | null>(props.block ?? null);
const loading = ref(false);
const error = ref<string | null>(null);

// 获取块数据（仅在未传入完整 block 时）
const fetchBlock = async () => {
  const id = props.blockId ?? (props.block ? props.block.id : null);
  if (!id) return;

  if (props.block) {
    internalBlock.value = props.block;
    return;
  }

  try {
    loading.value = true;
    error.value = null;
    internalBlock.value = await Block.get(id);
  } catch (err) {
    error.value = err instanceof Error ? err.message : "获取块失败";
    console.error("获取块失败:", err);
  } finally {
    loading.value = false;
  }
};

// 格式化日期
const formatDate = (dateString: string | Date) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

// 截断内容
const truncateContent = (content: string) => {
  const maxLength =
    props.mode === "compact" ? 80 : props.mode === "preview" ? 150 : 300;
  if (!content) return "";
  if (content.length <= maxLength) return content;
  return content.slice(0, maxLength) + "...";
};

// 点击事件：emit 保持与原来兼容的签名
function onBlockClick() {
  const id = props.block ? props.block.id : props.blockId;
  emit("click", id as number, internalBlock.value || undefined);
}

// 监听 props 变化并在需要时重新获取
watch(
  () => [props.block, props.blockId],
  () => {
    internalBlock.value = props.block ?? null;
    fetchBlock();
  },
  { immediate: true }
);

onMounted(() => {
  fetchBlock();
});
</script>

<style lang="scss" src="./blockViewer.scss" scoped></style>
