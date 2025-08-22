<template>
  <div class="focus-explorer" :class="{ 'negative-expanded': isNegativeExpanded }">
    <div class="in-relations" @mouseenter="onNegativeEnter" @mouseleave="onNegativeLeave">
      <div class="relations-container">
        <div v-for="relation in incomingRelations" :key="relation.id" class="relation-item">
          <RelationViewer :relation="relation" :from="true">
            <template #from_block>
              <BlockViewer :block-id="relation.from_" @click="onBlockSelect" />
            </template>
          </RelationViewer>
        </div>
        <div v-if="incomingRelations.length === 0" class="empty-relations">
          <span class="empty-text">暂无入向关系</span>
        </div>
      </div>
      <!-- 收起状态的渐变遮罩 -->
      <div class="fade-mask"></div>
    </div>

    <div class="focus-explorer-content">
      <div class="focus-block">
        <BlockEditor class="focus-block-editor" :block="focusedBlock" @jump="onJump" />
        <div class="focus-toolbar">
          <InkButton class="action-btn" variant="primary" @click="onJump">
            <span class="btn-text">跳转</span>
          </InkButton>
          <InkButton class="action-btn" @click="onForward">
            <span class="btn-text">前进</span>
          </InkButton>
          <InkButton class="action-btn" @click="onBack">
            <span class="btn-text">返回</span>
          </InkButton>
        </div>
      </div>

      <div class="out-relations">
        <div class="relations-container">
          <div v-for="relation in relations" :key="relation.id" class="relation-item">
            <RelationViewer :relation="relation" :to="true">
              <template #to_block>
                <BlockViewer :block-id="relation.to_" @click="onBlockSelect" />
              </template>
            </RelationViewer>
          </div>
          <div v-if="relations.length === 0" class="empty-relations">
            <span class="empty-text">暂无关系</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRelationsStore } from '../../stores/relations'
import BlockViewer from '../blockViewer/blockViewer.vue'
import RelationViewer from '../relationViewer/relationViewer.vue'
import BlockEditor from '../blockEditor/blockEditor.vue'
import InkButton from '../inkButton/inkButton.vue'
import type { Block } from '../../types/blocks'

const props = defineProps<{
  modelValue: Block | null
}>()
const emit = defineEmits(['update:modelValue'])

const focusedBlock = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})

const relationsStore = useRelationsStore()

// 出向关系（原有的）
const relations = computed(() => {
  if (!focusedBlock.value) return []
  return relationsStore.getByBlock(focusedBlock.value.id, true)
})

// 入向关系（新增的）
const incomingRelations = computed(() => {
  if (!focusedBlock.value) return []
  return relationsStore.getByBlock(focusedBlock.value.id, false)
})

// 负一栏展开状态
const isNegativeExpanded = ref(false)

function onJump() {
  // 跳转逻辑
}

function onForward() {
  // 前进逻辑
}

function onBack() {
  // 返回逻辑
}

function onBlockSelect(blockId: number) {
  // 处理块选择逻辑
  console.log('Block selected:', blockId)
}

function onNegativeEnter() {
  isNegativeExpanded.value = true
}

function onNegativeLeave() {
  isNegativeExpanded.value = false
}
</script>

<style lang="scss" scoped>
@use '@/styles/main.scss' as *;

.focus-explorer {
  width: 100%;
  color: var(--color-text);
  font-family: monospace;
  position: relative;
  overflow: hidden;
}

.focus-explorer-content {
  display: flex;
  flex-direction: row;
  transform: translateX(calc(100% * 0.04));
  transition: all 0.3s ease;
}

// 入向关系栏
.in-relations {
  position: absolute;
  left: -27%;
  top: 0;
  width: 30%;
  transition: all 0.3s ease;
  z-index: var(--z-dropdown);
  display: flex;
  flex-direction: column;
}

.focus-explorer.negative-expanded .in-relations {
  left: 0;
}

// 渐变遮罩 - 收起状态下隐藏分界线
.fade-mask {
  position: absolute;
  right: 0;
  top: 0;
  width: 12%;
  height: 100%;
  background: linear-gradient(to left, transparent, var(--color-background));
  pointer-events: none;
  opacity: 1;
  transition: all 0.3s ease;
  z-index: var(--z-sticky);
}

.focus-explorer.negative-expanded .fade-mask {
  opacity: 0;
}

.focus-explorer.negative-expanded .focus-explorer-content {
  transform: translateX(calc(100% * 0.3));
}

.focus-block {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 60%;
  position: relative;
  padding: 0 var(--space-lg);
  gap: var(--space-lg);
  transition: all 0.3s ease;
}

.focus-block .focus-block-editor {
  border-radius: var(--radius-md);
}

.focus-toolbar {
  display: flex;
  gap: var(--space-sm);
  z-index: var(--z-sticky);
}

.action-btn {
  @include button-base;
  backdrop-filter: blur(var(--blur-amount));

  &.primary {
    @include button-primary;
  }
}

.btn-text {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-normal);
}

.out-relations {
  display: flex;
  flex-direction: column;
  width: 30%;
  height: 100%;
  position: relative;
  transition: all 0.3s ease;
}

.relations-container {
  flex: 1;
  overflow-y: auto;
  @include scrollbar-thin;
}

.relation-item {
  margin-bottom: var(--space-md);
}

.empty-relations {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: var(--color-secondary-lighter);
}

.empty-text {
  font-size: var(--font-size-2xl);
  color: var(--color-text-light);
}

.relations-info {
  position: absolute;
  bottom: var(--space-lg);
  right: var(--space-lg);
  z-index: var(--z-sticky);
}

.relation-count {
  @include text-small-caps;
  color: var(--color-text-light);
  background: rgba(255, 255, 255, 0.8);
  padding: var(--space-xs) var(--space-sm);
  border-radius: var(--radius-xl);
  border: 1px solid var(--color-border-light);
  backdrop-filter: blur(var(--blur-amount));
}
</style>
