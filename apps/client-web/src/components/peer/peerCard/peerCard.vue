<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  InkButton,
  InkDialog,
  InkInput,
  InkJsonEditor,
  type JsonEditorValidation,
} from '@inkcre/ui-web'
import { Peer } from '@inkcre/core'
import { peerCardEmits, peerCardProps } from './peerCard'

const props = defineProps(peerCardProps)
const emit = defineEmits(peerCardEmits)
const { t } = useI18n()

const configPopupOpen = ref(false)
const configModel = ref('{}')
const configValidation = ref<JsonEditorValidation>()
const savingConfig = ref(false)
const configError = ref('')
const canSaveConfig = computed(
  () =>
    configValidation.value?.status === 'valid' && configValidation.value.text === configModel.value
)
function openConfig() {
  configModel.value = JSON.stringify(props.peer.config, null, 2)
  configValidation.value = undefined
  configError.value = ''
  configPopupOpen.value = true
}

const savePeer = async () => {
  try {
    await props.peer.save()
    emit('updated')
  } catch (error) {
    console.error('Failed to update Peer:', error)
    alert('Failed to update client')
  }
}

const onConfirmConfig = async () => {
  if (savingConfig.value || !canSaveConfig.value) return
  savingConfig.value = true
  configError.value = ''
  try {
    const updated = Peer.parse({ ...props.peer, config: JSON.parse(configModel.value) })
    await updated.saveConfig()
    props.peer.config = updated.config
    emit('updated')
    configPopupOpen.value = false
  } catch (error) {
    configError.value = error instanceof Error ? error.message : t('common.saveFailed')
  } finally {
    savingConfig.value = false
  }
}

const getStatusText = (status: 'online' | 'offline' | 'unknown') => {
  const statusMap = {
    online: t('client.statusOnline'),
    offline: t('client.statusOffline'),
    unknown: t('client.statusUnknown'),
  }
  return statusMap[status]
}
</script>

<template>
  <div class="peer-card">
    <div class="peer-card__item-info">
      <InkInput v-model="peer.name" type="inline" @confirm="savePeer" />
      <span class="peer-card__item-id">{{ peer.id }}</span>
      <span class="peer-card__item-capabilities">
        {{ peer.capabilities.length }} capabilities
      </span>
      <InkButton :text="t('client.editConfig')" size="sm" @click="openConfig" />
    </div>
    <span :class="['peer-card__item-status', `peer-card__item-status--${status}`]">
      {{ getStatusText(status) }}
    </span>

    <InkDialog v-model="configPopupOpen" :title="t('client.editConfig')" :is-loading="savingConfig">
      <InkJsonEditor
        v-model="configModel"
        :schema="peer.config_schema"
        :label="t('client.editConfig')"
        :disabled="savingConfig"
        @validation="configValidation = $event"
      />
      <p v-if="configError" role="alert" class="text-feedback-error">{{ configError }}</p>
      <template #footer>
        <InkButton :text="t('common.cancel')" @click="configPopupOpen = false" />
        <InkButton
          :text="t('common.save')"
          theme="primary"
          :is-loading="savingConfig"
          :disabled="!canSaveConfig"
          @click="onConfirmConfig"
        />
      </template>
    </InkDialog>
  </div>
</template>

<style lang="scss" scoped src="./peerCard.scss" />
