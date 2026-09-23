<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { InkButton, InkDialog, InkInput, type JsonEditorValidation } from '@inkcre/ui-web'
import SchemaConfigEditor from '@/components/schemaConfigEditor/schemaConfigEditor.vue'
import { configStore, ExtensionModel, Peer, PeerConfigSchema, PeerManager } from '@inkcre/core'
import { peerCardEmits, peerCardProps } from './peerCard'
import { currentWebPeer } from '@/core'

const props = defineProps(peerCardProps)
const emit = defineEmits(peerCardEmits)
const { t } = useI18n()

const configPopupOpen = ref(false)
const configModel = ref('{}')
const configValidation = ref<JsonEditorValidation>()
const savingConfig = ref(false)
const configError = ref('')
const deleteOpen = ref(false)
const deleting = ref(false)
const deleteError = ref('')
function openDelete() {
  deleteError.value = ''
  deleteOpen.value = true
}
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
    if (props.current) currentWebPeer.value = { id: props.peer.id, name: props.peer.name }
    emit('updated')
  } catch (error) {
    console.error('Failed to update Peer:', error)
    alert(t('common.saveFailed'))
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
    if (props.current) configStore.peerConfig = PeerConfigSchema.parse(updated.config)
    emit('updated')
    configPopupOpen.value = false
  } catch (error) {
    configError.value = error instanceof Error ? error.message : t('common.saveFailed')
  } finally {
    savingConfig.value = false
  }
}

const onConfirmDelete = async () => {
  if (deleting.value || props.current) return
  deleting.value = true
  deleteError.value = ''
  try {
    const live = await PeerManager.listLive()
    if (live.some((peer) => peer.id === props.peer.id)) {
      deleteError.value = t('peer.deleteOnline')
      emit('updated')
      return
    }
    const extensions = await ExtensionModel.list()
    for (const extension of extensions) {
      if (extension.enabled.includes(props.peer.id)) await extension.disablePeer(props.peer.id)
    }
    await props.peer.delete()
    deleteOpen.value = false
    emit('updated')
  } catch (error) {
    deleteError.value = error instanceof Error ? error.message : t('peer.deleteFailed')
  } finally {
    deleting.value = false
  }
}

const getStatusText = (status: 'online' | 'offline' | 'unknown') => {
  const statusMap = {
    online: t('peer.statusOnline'),
    offline: t('peer.statusOffline'),
    unknown: t('peer.statusUnknown'),
  }
  return statusMap[status]
}
</script>

<template>
  <div class="peer-card">
    <div class="peer-card__item-info">
      <div class="peer-card__heading">
        <InkInput v-model="peer.name" type="inline" @confirm="savePeer" />
        <span class="peer-card__version">
          {{ peer.application_version ? `v${peer.application_version}` : t('peer.versionUnknown') }}
        </span>
        <span v-if="current" class="peer-card__current">{{ t('peer.current') }}</span>
      </div>
      <div class="peer-card__actions">
        <InkButton :text="t('peer.editConfig')" size="sm" @click="openConfig" />
        <InkButton
          v-if="!current"
          :text="t('peer.delete')"
          size="sm"
          theme="danger"
          :disabled="status === 'online'"
          @click="openDelete"
        />
      </div>
      <details class="peer-card__details">
        <summary>{{ t('common.details') }}</summary>
        <code class="peer-card__item-id">{{ peer.id }}</code>
        <p>{{ t('peer.capabilities', { count: peer.capabilities.length }) }}</p>
        <pre v-if="peer.capabilities.length">{{ JSON.stringify(peer.capabilities, null, 2) }}</pre>
        <p v-if="!current && status === 'online'">{{ t('peer.deleteOnline') }}</p>
      </details>
    </div>
    <span :class="['peer-card__item-status', `peer-card__item-status--${status}`]">
      {{ getStatusText(status) }}
    </span>

    <InkDialog v-model="configPopupOpen" :title="t('peer.editConfig')" :is-loading="savingConfig">
      <SchemaConfigEditor
        v-model="configModel"
        :schema="peer.config_schema"
        :label="t('peer.editConfig')"
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

    <InkDialog
      v-model="deleteOpen"
      :title="t('peer.delete')"
      :confirm-text="t('peer.delete')"
      :cancel-text="t('common.cancel')"
      :is-loading="deleting"
      @confirm="onConfirmDelete"
    >
      <p>{{ peer.name }} · {{ peer.id }}</p>
      <p>{{ t('peer.deleteConfirm') }}</p>
      <p v-if="deleteError" role="alert" class="text-feedback-error">{{ deleteError }}</p>
    </InkDialog>
  </div>
</template>

<style lang="scss" scoped src="./peerCard.scss" />
