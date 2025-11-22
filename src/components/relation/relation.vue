<template>
  <div class="relation-viewer" :class="`relation-viewer--${mode || 'wrap_a_block'}`">
    <div v-if="loading" class="relation-viewer__loading">加载中...</div>
    <div v-else-if="error" class="relation-viewer__error">
      {{ error }}
    </div>
    <div v-else-if="internalRelation" class="relation-viewer__card">
      <!-- 可折叠卡片 -->
      <div class="relation-viewer__header" @click="toggleFold">
        <!-- 关系内容作为标题 -->
        <div class="relation-viewer__content">
          <span v-if="whichBlock == 'to'">{{
            internalRelation.content || 'UNNAMED_RELATION'
            }}</span>
          <span v-else-if="whichBlock == 'from'">
            AS {{ internalRelation.content || 'UNNAMED_RELATION' }} OF
          </span>
        </div>
        <!-- 右侧图标按钮 -->
        <div class="relation-viewer__actions" @click.stop>
          <InkButton @click="startEditing" class="relation-viewer__action-btn" title="编辑关系" variant="ghost">
            ✏️
          </InkButton>
          <InkButton @click="deleteRelation" class="relation-viewer__action-btn relation-viewer__action-btn--danger"
            title="删除关系" :disabled="deleting">
            {{ deleting ? '...' : '🗑️' }}
          </InkButton>
          <InkButton class="relation-viewer__action-btn" title="展开/折叠" @click="toggleFold" variant="ghost">
            {{ isFolded ? '▼' : '▲' }}
          </InkButton>
        </div>
      </div>

      <!-- 编辑模式 -->
      <div v-if="isEditing" class="relation-viewer__edit-form">
        <input v-model="editContent" @keydown.enter="saveEdit" @keydown.escape="cancelEdit" ref="editInput"
          class="relation-viewer__edit-input" placeholder="输入关系描述..." />
        <div class="relation-viewer__edit-actions">
          <InkButton @click="saveEdit" :disabled="saving" class="relation-viewer__edit-btn" variant="primary">
            {{ saving ? '保存中...' : '保存' }}
          </InkButton>
          <InkButton @click="cancelEdit" class="relation-viewer__edit-btn" variant="ghost">取消</InkButton>
        </div>
        <div v-if="editError" class="relation-viewer__error">{{ editError }}</div>
      </div>

      <!-- 卡片内容：BlockViewer 组件 -->
      <div v-show="!isFolded && !isEditing" class="relation-viewer__body">
        <!-- 居中连接线 -->
        <div class="relation-viewer__connection-line"></div>

        <!-- 显示对应的块 -->
        <div class="relation-viewer__block-content">
          <BlockViewer :block-id="targetBlockId" mode="default" @click="handleBlockClick" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted } from 'vue'
import { relationProps, relationEmits } from './relation';
import { Relation } from '@/business/relation';
import BlockViewer from '../blockViewer/blockViewer.vue';
import InkButton from '@/components/common/inkButton/inkButton.vue';

const props = defineProps(relationProps);
const emit = defineEmits(relationEmits);

// 内部状态
const internalRelation = ref<Relation | null>(props.relation || null)
const loading = ref(false)
const error = ref<string | null>(null)

// 编辑状态
const isEditing = ref(false)
const editContent = ref('')
const editInput = ref<HTMLInputElement>()
const saving = ref(false)
const deleting = ref(false)
const editError = ref<string | null>(null)

// 折叠状态
const isFolded = ref(props.fold)

// 计算目标块ID
const targetBlockId = computed(() => {
  if (!internalRelation.value) return null

  if (props.whichBlock === 'from') {
    return internalRelation.value.from_
  } else if (props.whichBlock === 'to') {
    return internalRelation.value.to_
  }

  // 默认显示 from 块
  return internalRelation.value.from_
})

// 获取关系数据
const fetchRelation = async () => {
  if (props.relation) {
    internalRelation.value = props.relation
    return
  }

  if (!props.relationId) {
    error.value = '必须提供 relation 或 relationId'
    return
  }

  try {
    loading.value = true
    error.value = null
    internalRelation.value = await Relation.get(props.relationId)
  } catch (err) {
    error.value = err instanceof Error ? err.message : '获取关系失败'
    console.error('获取关系失败:', err)
  } finally {
    loading.value = false
  }
}

// 切换折叠状态
const toggleFold = () => {
  isFolded.value = !isFolded.value
  emit('update:fold', isFolded.value)
}

// 处理块点击事件
const handleBlockClick = () => {
  if (!targetBlockId.value) return
  emit('click-block', targetBlockId.value)
}

// 编辑功能
const startEditing = () => {
  if (!internalRelation.value) return

  editContent.value = internalRelation.value.content
  isEditing.value = true
  editError.value = null
  nextTick(() => {
    editInput.value?.focus()
  })
}

const cancelEdit = () => {
  isEditing.value = false
  editContent.value = ''
  editError.value = null
}

const saveEdit = async () => {
  if (!internalRelation.value || !editContent.value.trim()) {
    cancelEdit()
    return
  }

  try {
    saving.value = true
    editError.value = null

    const updatedRelation = await api.relations.updateRelation(
      internalRelation.value.id,
      editContent.value.trim(),
    )

    internalRelation.value = updatedRelation
    emit('relation-updated', updatedRelation)
    isEditing.value = false
    editContent.value = ''
  } catch (err) {
    editError.value = err instanceof Error ? err.message : '更新关系失败'
    console.error('更新关系失败:', err)
  } finally {
    saving.value = false
  }
}

const deleteRelation = async () => {
  if (!internalRelation.value || !confirm('确定要删除这个关系吗？')) {
    return
  }

  try {
    deleting.value = true
    await api.relations.deleteRelation(internalRelation.value.id)
    emit('relation-deleted', internalRelation.value.id)
  } catch (err) {
    editError.value = err instanceof Error ? err.message : '删除关系失败'
    console.error('删除关系失败:', err)
  } finally {
    deleting.value = false
  }
}

// 监听 props 变化
watch(
  () => [props.relation, props.relationId],
  () => {
    fetchRelation()
  },
  { immediate: true },
)

watch(
  () => props.fold,
  (newFold) => {
    isFolded.value = newFold
  },
)

onMounted(() => {
  fetchRelation()
})
</script>

<style lang="scss" src="./relation.scss" scoped></style>