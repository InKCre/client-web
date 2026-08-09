<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { InkButton, InkSwitch, InkDialog, InkJsonEditor } from '@inkcre/ui-web'
import { registryExtensions } from '@inkcre/core'
import { extensionCardProps, extensionCardEmits } from './extensionCard'

const props = defineProps(extensionCardProps)
const emit = defineEmits(extensionCardEmits)
const { t } = useI18n()

// --- data ---
const configPopupOpen = ref<boolean | Promise<boolean>>(false)
const togglePromise = ref<Promise<boolean> | null>(null)
const isUninstalling = ref(false)
const operationError = ref<string | null>(null)
const configModel = ref(JSON.stringify(props.extension.config, null, 2))

// --- computed ---
watch(
  () => props.extension.config,
  (config) => {
    configModel.value = JSON.stringify(config, null, 2)
  },
  { deep: true }
)

const canUninstall = computed(() => !props.enabled && !isUninstalling.value)

const toggleModel = computed({
  get: () => (togglePromise.value ? togglePromise.value : props.enabled),
  set: (enabled: boolean) => {
    operationError.value = null
    togglePromise.value = (async () => {
      try {
        if (enabled) {
          await registryExtensions.enableForPeer(props.extension, props.peerId)
        } else {
          await registryExtensions.disableForPeer(props.extension, props.peerId)
        }
        emit('changed')
        return enabled
      } catch (error) {
        operationError.value = error instanceof Error ? error.message : String(error)
        return props.enabled
      } finally {
        togglePromise.value = null
      }
    })()
  },
})

const onEditConfigClick = () => {
  configPopupOpen.value = true
}

const onConfirmConfig = () => {
  configPopupOpen.value = (async () => {
    try {
      operationError.value = null
      const config = JSON.parse(configModel.value) as Record<string, unknown>
      const updatedExtension = await registryExtensions.updateConfig(props.extension, config)
      emit('updated', updatedExtension)
      return false
    } catch (error) {
      operationError.value = error instanceof Error ? error.message : String(error)
      return true
    }
  })()
}

const onUninstall = async () => {
  operationError.value = null
  isUninstalling.value = true
  try {
    await registryExtensions.uninstall(props.extension)
    emit('uninstalled')
  } catch (error) {
    operationError.value = error instanceof Error ? error.message : String(error)
  } finally {
    isUninstalling.value = false
  }
}
</script>

<template>
  <div class="extension-card">
    <div class="extension-card__header">
      <div class="flex flex-col">
        <div class="flex flex-row items-center gap-2">
          <span class="extension-card__id">{{ extension.namespace }}/{{ extension.name }}</span>
          <span class="extension-card__version">v{{ extension.version }}</span>
        </div>
      </div>
      <InkSwitch v-model="toggleModel" size="xs" />
    </div>

    <div class="extension-card__actions">
      <InkButton @click="onEditConfigClick" :text="t('extension.editConfig')" size="sm" />
      <InkButton
        @click="onUninstall"
        :text="t('extension.uninstall')"
        theme="danger"
        size="sm"
        :disabled="!canUninstall"
        :loading="isUninstalling"
      />
    </div>

    <p v-if="enabled" class="extension-card__hint">
      {{ t('extension.uninstallDisabled') }}
    </p>
    <p v-if="operationError" class="extension-card__error">{{ operationError }}</p>

    <InkDialog
      v-model="configPopupOpen"
      :title="t('extension.editConfigTitle')"
      @confirm="onConfirmConfig"
    >
      <InkJsonEditor v-model="configModel" :schema="extension.config_schema" />
    </InkDialog>
  </div>
</template>

<style lang="scss" scoped src="./extensionCard.scss" />
