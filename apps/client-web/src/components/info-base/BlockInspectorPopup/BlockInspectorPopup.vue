<script setup lang="ts">
import { computed, ref, shallowRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import dayjs from 'dayjs'
import { InkButton, InkField, InkLoading, InkPopup } from '@inkcre/ui-web'
import { Block, getInfoBaseRouter, OrganizationManager, PeerOutcomeUnknown } from '@inkcre/core'

import type { BlockInspectorPopupProps } from './BlockInspectorPopup'
import { blockInspectorPopupEmits } from './BlockInspectorPopup'

const props = defineProps<BlockInspectorPopupProps>()
const emit = defineEmits(blockInspectorPopupEmits)
const { t } = useI18n()
const router = getInfoBaseRouter()

const open = ref(true)
const status = ref<'loading' | 'success' | 'missing' | 'error'>('loading')
const block = shallowRef<Block | null>(null)
const error = shallowRef<Error | null>(null)
const isRuminating = ref(false)
const ruminationOutcome = ref<'success' | 'error' | 'outcome-unknown' | null>(null)
let generation = 0

const formattedCreatedAt = computed(() =>
  block.value?.created_at ? dayjs(block.value.created_at).format('YYYY-MM-DD HH:mm') : '-'
)
const formattedUpdatedAt = computed(() =>
  block.value?.updated_at ? dayjs(block.value.updated_at).format('YYYY-MM-DD HH:mm') : '-'
)

watch(
  () => props.block,
  async (blockRef) => {
    const current = ++generation
    status.value = 'loading'
    block.value = null
    error.value = null
    try {
      const loaded = await Block.find(blockRef)
      if (current !== generation) return
      block.value = loaded
      status.value = loaded ? 'success' : 'missing'
    } catch (cause) {
      if (current !== generation) return
      error.value = cause instanceof Error ? cause : new Error(String(cause))
      status.value = 'error'
    }
  },
  { immediate: true }
)

function close(): void {
  void router.back()
}

function onOpenChange(value: boolean): void {
  open.value = value
  if (!value) close()
}

function viewSolvedContent(): void {
  void router.push({ name: 'solved-content', block: props.block })
}

async function ruminate(): Promise<void> {
  isRuminating.value = true
  ruminationOutcome.value = null
  try {
    await OrganizationManager.ruminate(props.block)
    ruminationOutcome.value = 'success'
    emit('ruminated')
  } catch (cause) {
    ruminationOutcome.value = cause instanceof PeerOutcomeUnknown ? 'outcome-unknown' : 'error'
  } finally {
    isRuminating.value = false
  }
}
</script>

<template>
  <InkPopup :open="open" :scrim="false" position="right" @update:open="onOpenChange">
    <section class="block-inspector-popup">
      <header class="block-inspector-popup__header">
        <h3>{{ t('infoBase.blockInspector.title') }}</h3>
        <InkButton icon="i-mdi-close" theme="subtle" type="square" @click="close" />
      </header>

      <div v-if="status === 'loading'" class="block-inspector-popup__state"><InkLoading /></div>
      <div v-else-if="status === 'missing'" class="block-inspector-popup__state">
        {{ t('infoBase.blockInspector.missing', { block: props.block }) }}
      </div>
      <div v-else-if="status === 'error'" class="block-inspector-popup__state">
        {{ error?.message }}
      </div>

      <div v-else-if="block" class="block-inspector-popup__body">
        <InkField :label="t('infoBase.blockInspector.id')" layout="inline"
          >#{{ block.id }}</InkField
        >
        <InkField :label="t('infoBase.blockInspector.resolver')" layout="inline">
          <code>{{ block.resolver }}</code>
        </InkField>
        <InkField :label="t('infoBase.blockInspector.created')" layout="inline">
          {{ formattedCreatedAt }}
        </InkField>
        <InkField :label="t('infoBase.blockInspector.updated')" layout="inline">
          {{ formattedUpdatedAt }}
        </InkField>
        <InkField
          v-if="block.storage !== null"
          :label="t('infoBase.blockInspector.storage')"
          layout="inline"
        >
          #{{ block.storage }}
        </InkField>

        <div class="block-inspector-popup__actions">
          <InkButton
            :text="t('infoBase.blockInspector.viewContent')"
            theme="primary"
            @click="viewSolvedContent"
          />
          <InkButton
            :text="t('infoBase.blockInspector.ruminate')"
            :loading="isRuminating"
            @click="ruminate"
          />
          <p v-if="ruminationOutcome">
            {{ t(`infoBase.blockInspector.rumination.${ruminationOutcome}`) }}
          </p>
        </div>
      </div>
    </section>
  </InkPopup>
</template>

<style lang="scss" scoped src="./BlockInspectorPopup.scss" />
