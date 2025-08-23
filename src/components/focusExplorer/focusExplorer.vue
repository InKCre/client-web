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
          <RelationViewer
            :relation="relation"
            whichBlock="from"
            :fold="!expandedInRelationId || expandedInRelationId !== relation.id"
            @relation-updated="onRelationUpdated"
            @relation-deleted="onRelationDeleted"
            @click-block="() => onRelationBlockClick(relation.from_)"
            @update:fold="(fold) => onInRelationFoldChange(relation.id, fold)"
          />
        </div>

        <div class="focus-explorer__create-relation">
          <InkButton class="focus-explorer__create-btn" @click="onCreateIncomingRelation">
            <span class="focus-explorer__btn-text">添加入向关系</span>
          </InkButton>
        </div>
      </div>

      <div class="focus-explorer__fade-mask"></div>
    </div>

    <div class="focus-explorer__content">
      <div class="focus-explorer__focus-block">
        <BlockEditor class="focus-block-editor" :block="focusedBlock" ref="blockEditor" />
        <div class="focus-explorer__toolbar">
          <div class="focus-explorer__toolbar-left">
            <InkButton class="focus-explorer__action-btn" @click="onForward">
              <span class="focus-explorer__btn-text">前进</span>
            </InkButton>
            <InkButton class="focus-explorer__action-btn" @click="onBack">
              <span class="focus-explorer__btn-text">返回</span>
            </InkButton>
          </div>
          <div class="focus-explorer__toolbar-right">
            <InkButton
              class="focus-explorer__action-btn focus-explorer__action-btn--primary"
              variant="primary"
              @click="onSave"
            >
              <span class="focus-explorer__btn-text">保存</span>
            </InkButton>
          </div>
        </div>
      </div>

      <div class="focus-explorer__out-relations">
        <div class="focus-explorer__relations-container">
          <div
            v-for="relation in relations"
            :key="relation.id"
            class="focus-explorer__relation-item"
          >
            <RelationViewer
              :relation="relation"
              whichBlock="to"
              :fold="!expandedRelationId || expandedRelationId !== relation.id"
              @relation-updated="onRelationUpdated"
              @relation-deleted="onRelationDeleted"
              @click-block="() => onRelationBlockClick(relation.to_)"
              @update:fold="(fold) => onRelationFoldChange(relation.id, fold)"
            />
          </div>
          <div class="focus-explorer__create-relation">
            <InkButton class="focus-explorer__create-btn" @click="onCreateRelation">
              <span class="focus-explorer__btn-text">添加出向关系</span>
            </InkButton>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { api } from '@/api'
import type { Relation } from '@/api'
import BlockViewer from '../blockViewer/blockViewer.vue'
import RelationViewer from '../relationViewer/relationViewer.vue'
import BlockEditor from '../blockEditor/blockEditor.vue'
import InkButton from '../inkButton/inkButton.vue'
import type { Block } from '../../types/blocks'
import type { FocusExplorerProps } from './focusExplorerTypes.ts'

const props = defineProps<FocusExplorerProps>()
const emit = defineEmits<{
  'update:blockId': [blockId: number]
  'block-selected': [blockId: number]
}>()

// 引用BlockEditor组件
const blockEditor = ref<InstanceType<typeof BlockEditor>>()

// 当前聚焦的块数据
const focusedBlock = ref<Block | null>(null)
const loadingBlock = ref(false)
const blockError = ref<string | null>(null)

// 关系数据
const outgoingRelations = ref<Relation[]>([])
const incomingRelations = ref<Relation[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

// 出向关系（原有的）
const relations = computed(() => outgoingRelations.value)

// 负一栏展开状态
const isNegativeExpanded = ref(false)

// 关系展开状态 - 保持同时只有一个被展开
const expandedRelationId = ref<number | null>(null)
const expandedInRelationId = ref<number | null>(null)

// 获取块数据
const fetchBlock = async (blockId: number) => {
  try {
    loadingBlock.value = true
    blockError.value = null
    focusedBlock.value = await api.blocks.getBlock(blockId)
  } catch (err) {
    blockError.value = err instanceof Error ? err.message : '获取块失败'
    console.error('获取块失败:', err)
    focusedBlock.value = null
  } finally {
    loadingBlock.value = false
  }
}

// 获取块的关系
const fetchBlockRelations = async (blockId: number) => {
  try {
    loading.value = true
    error.value = null
    const blockRelations = await api.relations.getBlockRelations(blockId)
    outgoingRelations.value = blockRelations.outgoing
    incomingRelations.value = blockRelations.incoming
  } catch (err) {
    error.value = err instanceof Error ? err.message : '获取关系失败'
    console.error('获取块关系失败:', err)
    outgoingRelations.value = []
    incomingRelations.value = []
  } finally {
    loading.value = false
  }
}

// 监听聚焦块ID变化
watch(
  () => props.blockId,
  (newBlockId) => {
    if (newBlockId) {
      fetchBlock(newBlockId)
      fetchBlockRelations(newBlockId)
    } else {
      focusedBlock.value = null
      outgoingRelations.value = []
      incomingRelations.value = []
    }
  },
  { immediate: true },
)

function onJump() {
  // TODO: implement jump behavior
}

function onForward() {
  // TODO: implement forward behavior
}

function onBack() {
  // TODO: implement back behavior
}

function onSave() {
  // 调用 BlockEditor 的保存方法
  if (blockEditor.value && typeof blockEditor.value.saveBlock === 'function') {
    blockEditor.value.saveBlock()
  }
}

function onCreateRelation() {
  // TODO: implement create relation behavior
  console.log('创建关系')
}

function onCreateIncomingRelation() {
  // TODO: implement create incoming relation behavior
  console.log('创建入向关系')
}

function onRelationBlockClick(block_id: number) {
  emit('update:blockId', block_id)
}

function onRelationFoldChange(relationId: number, fold: boolean) {
  // 如果要展开这个关系，先收起其他关系
  if (!fold) {
    expandedRelationId.value = relationId
  } else if (expandedRelationId.value === relationId) {
    expandedRelationId.value = null
  }
}

function onInRelationFoldChange(relationId: number, fold: boolean) {
  // 如果要展开这个入向关系，先收起其他入向关系
  if (!fold) {
    expandedInRelationId.value = relationId
  } else if (expandedInRelationId.value === relationId) {
    expandedInRelationId.value = null
  }
}

function onNegativeEnter() {
  isNegativeExpanded.value = true
}

function onNegativeLeave() {
  isNegativeExpanded.value = false
}

// 关系更新处理
function onRelationUpdated(updatedRelation: Relation) {
  // 更新出向关系列表
  const outIndex = outgoingRelations.value.findIndex((r) => r.id === updatedRelation.id)
  if (outIndex !== -1) {
    outgoingRelations.value[outIndex] = updatedRelation
  }

  // 更新入向关系列表
  const inIndex = incomingRelations.value.findIndex((r) => r.id === updatedRelation.id)
  if (inIndex !== -1) {
    incomingRelations.value[inIndex] = updatedRelation
  }
}

// 关系删除处理
function onRelationDeleted(relationId: number) {
  // 从出向关系列表移除
  outgoingRelations.value = outgoingRelations.value.filter((r) => r.id !== relationId)

  // 从入向关系列表移除
  incomingRelations.value = incomingRelations.value.filter((r) => r.id !== relationId)
}
</script>

<style lang="scss" src="./focusExplorer.scss" scoped></style>
