<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { InkButton, InkField } from '@inkcre/ui-web'
import type { BlockDetailsPanelProps } from './BlockDetailsPanel'
import { blockDetailsPanelEmits } from './BlockDetailsPanel'
import BlockContent from '@/components/info-base/block/BlockContent/BlockContent.vue'
import dayjs from 'dayjs'

const props = withDefaults(defineProps<BlockDetailsPanelProps>(), {
  relations: () => [],
})
const emit = defineEmits(blockDetailsPanelEmits)
const { t } = useI18n()

const formattedCreatedAt = computed(() =>
  props.block.created_at ? dayjs(props.block.created_at).format('YYYY-MM-DD HH:mm') : '-'
)

const formattedUpdatedAt = computed(() =>
  props.block.updated_at ? dayjs(props.block.updated_at).format('YYYY-MM-DD HH:mm') : '-'
)

const onClose = () => {
  emit('close')
}

const onKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') {
    onClose()
  }
}

onMounted(() => {
  document.addEventListener('keydown', onKeyDown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', onKeyDown)
})
</script>

<template>
  <div class="block-details-panel">
    <div class="block-details-panel__header">
      <h3 class="block-details-panel__title">
        {{ t('infoBase.blockDetails.title') }}
      </h3>
      <InkButton icon="i-mdi-close" theme="subtle" type="square" @click="onClose" />
    </div>

    <div class="block-details-panel__body">
      <InkField :label="t('infoBase.blockDetails.id')" layout="inline">
        <span class="block-details-panel__value">#{{ block.id }}</span>
      </InkField>

      <InkField :label="t('infoBase.blockDetails.resolver')" layout="inline">
        <span class="block-details-panel__value block-details-panel__value--resolver">
          {{ block.resolver }}
        </span>
      </InkField>

      <InkField :label="t('infoBase.blockDetails.created')" layout="inline">
        <span class="block-details-panel__value">{{ formattedCreatedAt }}</span>
      </InkField>

      <InkField :label="t('infoBase.blockDetails.updated')" layout="inline">
        <span class="block-details-panel__value">{{ formattedUpdatedAt }}</span>
      </InkField>

      <InkField v-if="block.storage" :label="t('infoBase.blockDetails.storage')" layout="inline">
        <span class="block-details-panel__value">#{{ block.storage }}</span>
      </InkField>

      <div class="block-details-panel__content-section">
        <div class="block-details-panel__content-label">
          {{ t('infoBase.blockDetails.content') }}
        </div>
        <div class="block-details-panel__content">
          <BlockContent :block="block" />
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped src="./BlockDetailsPanel.scss" />
