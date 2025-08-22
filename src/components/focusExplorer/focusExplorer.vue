<template>
  <div class="focus-explorer" :class="{ 'focus-explorer--negative-expanded': isNegativeExpanded }">
    <div
      class="focus-explorer__in-relations"
      @mouseenter="onNegativeEnter"
      @mouseleave="onNegativeLeave"
    >
      <div class="focus-explorer__relations-container">
        <div
          v-for="relation in incomingRelations"
          :key="relation.id"
          class="focus-explorer__relation-item"
        >
          <RelationViewer :relation="relation" :from="true">
            <template #from_block>
              <BlockViewer :block-id="relation.from_" @click="onBlockSelect" />
            </template>
          </RelationViewer>
        </div>

        <div v-if="incomingRelations.length === 0" class="focus-explorer__empty-relations">
          <span class="focus-explorer__empty-text">暂无入向关系</span>
        </div>

        <div class="focus-explorer__fade-mask"></div>
      </div>
    </div>

    <div class="focus-explorer__content">
      <div class="focus-explorer__focus-block">
        <BlockEditor class="focus-block-editor" :block="focusedBlock" @jump="onJump" />
        <div class="focus-explorer__toolbar">
          <InkButton
            class="focus-explorer__action-btn focus-explorer__action-btn--primary"
            variant="primary"
            @click="onJump"
          >
            <span class="focus-explorer__btn-text">跳转</span>
          </InkButton>
          <InkButton class="focus-explorer__action-btn" @click="onForward">
            <span class="focus-explorer__btn-text">前进</span>
          </InkButton>
          <InkButton class="focus-explorer__action-btn" @click="onBack">
            <span class="focus-explorer__btn-text">返回</span>
          </InkButton>
        </div>
      </div>

      <div class="focus-explorer__out-relations">
        <div class="focus-explorer__relations-container">
          <div
            v-for="relation in relations"
            :key="relation.id"
            class="focus-explorer__relation-item"
          >
            <RelationViewer :relation="relation" :to="true">
              <template #to_block>
                <BlockViewer :block-id="relation.to_" @click="onBlockSelect" />
              </template>
            </RelationViewer>
          </div>

          <div v-if="relations.length === 0" class="focus-explorer__empty-relations">
            <span class="focus-explorer__empty-text">暂无关系</span>
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
import type { FocusExplorerProps } from './focusExplorerTypes.ts'

const props = defineProps<FocusExplorerProps>()
const emit = defineEmits(['update:modelValue'])

const focusedBlock = computed<Block | null>({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})

const relationsStore = useRelationsStore()

// 出向关系（原有的）
const relations = computed(() => {
  if (!focusedBlock.value) return []
  return relationsStore.getByBlock(focusedBlock.value.id, true)
})

// 入向关系
const incomingRelations = computed(() => {
  if (!focusedBlock.value) return []
  return relationsStore.getByBlock(focusedBlock.value.id, false)
})

// 负一栏展开状态
const isNegativeExpanded = ref(false)

function onJump() {
  // TODO: implement jump behavior
}

function onForward() {
  // TODO: implement forward behavior
}

function onBack() {
  // TODO: implement back behavior
}

function onBlockSelect(blockId: number) {
  // forward click from BlockViewer
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
