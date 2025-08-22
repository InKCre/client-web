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
import type { FocusExplorerProps } from './focusExplorerTypes'

const props = defineProps<FocusExplorerProps>()
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
@use './focusExplorer.scss' as *;
</style>
