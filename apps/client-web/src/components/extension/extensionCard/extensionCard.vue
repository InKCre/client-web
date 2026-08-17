<script setup lang="ts">
import { ref, computed, nextTick, shallowRef, watch, type Component } from 'vue'
import { useI18n } from 'vue-i18n'
import { InkButton, InkSwitch, InkDialog, InkInput, InkJsonEditor } from '@inkcre/ui-web'
import { getExtensionHost } from '@/core'
import { extensionCardProps, extensionCardEmits } from './extensionCard'

const props = defineProps(extensionCardProps)
const emit = defineEmits(extensionCardEmits)
const { t } = useI18n()

// --- data ---
const configPopupOpen = ref<boolean | Promise<boolean>>(false)
const versionPopupOpen = ref<boolean | Promise<boolean>>(false)
const setupPopupOpen = ref(false)
const setupComponent = shallowRef<Component | null>(null)
const setupContribution = shallowRef(getExtensionHost().getSetupContribution(props.extension.name))
const togglePromise = ref<Promise<boolean> | null>(null)
const isUninstalling = ref(false)
const operationError = ref<string | null>(null)
const configModel = ref(JSON.stringify(props.extension.config, null, 2))
const versionModel = ref(props.extension.version)

// --- computed ---
watch(
  () => props.extension.config,
  (config) => {
    configModel.value = JSON.stringify(config, null, 2)
  },
  { deep: true }
)

const canUninstall = computed(() => props.extension.enabled.length === 0 && !isUninstalling.value)
const closeSetup = async () => {
  setupPopupOpen.value = false
  setupComponent.value = null
  await nextTick()
}

const toggleModel = computed({
  get: () => (togglePromise.value ? togglePromise.value : props.enabled),
  set: (enabled: boolean) => {
    operationError.value = null
    togglePromise.value = (async () => {
      try {
        if (!enabled && props.controlsCurrentWebRuntime) await closeSetup()
        const updated = await props.setEnabled(enabled)
        emit('updated', updated)
        return enabled
      } catch (error) {
        operationError.value = error instanceof Error ? error.message : String(error)
        return props.enabled
      } finally {
        setupContribution.value = getExtensionHost().getSetupContribution(props.extension.name)
        togglePromise.value = null
      }
    })()
  },
})

const onEditConfigClick = () => {
  configPopupOpen.value = true
}

const onSetupClick = () => {
  const contribution = setupContribution.value
  if (!contribution) return
  setupComponent.value = contribution.component
  setupPopupOpen.value = true
}

const onChangeVersionClick = () => {
  versionModel.value = props.extension.version
  versionPopupOpen.value = true
}

const onConfirmVersion = () => {
  versionPopupOpen.value = (async () => {
    try {
      operationError.value = null
      const updatedExtension = await getExtensionHost().changeVersion(
        props.extension.name,
        versionModel.value
      )
      emit('updated', updatedExtension)
      return false
    } catch (error) {
      operationError.value = error instanceof Error ? error.message : String(error)
      return true
    }
  })()
}

const onConfirmConfig = () => {
  configPopupOpen.value = (async () => {
    try {
      operationError.value = null
      const config = JSON.parse(configModel.value) as Record<string, unknown>
      const updatedExtension = await getExtensionHost().updateConfig(props.extension.name, config)
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
    await getExtensionHost().uninstall(props.extension.name)
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
          <span class="extension-card__id">{{ extension.name }}</span>
          <span class="extension-card__version">v{{ extension.version }}</span>
        </div>
        <span v-if="extension.nickname" class="extension-card__nickname">
          {{ extension.nickname }}
        </span>
      </div>
      <InkSwitch v-model="toggleModel" size="xs" />
    </div>

    <div class="extension-card__actions">
      <InkButton
        v-if="setupContribution"
        :text="t('extension.setup')"
        theme="primary"
        size="sm"
        @click="onSetupClick"
      />
      <InkButton @click="onEditConfigClick" :text="t('extension.editConfig')" size="sm" />
      <InkButton
        @click="onChangeVersionClick"
        :text="t('extension.changeVersion')"
        size="sm"
        :disabled="extension.enabled.length > 0"
      />
      <InkButton
        @click="onUninstall"
        :text="t('extension.uninstall')"
        theme="danger"
        size="sm"
        :disabled="!canUninstall"
        :loading="isUninstalling"
      />
    </div>

    <p v-if="extension.enabled.length > 0" class="extension-card__hint">
      {{ t('extension.enabledPeerCount', { count: extension.enabled.length }) }}
      {{ t('extension.uninstallDisabled') }}
    </p>
    <p v-if="operationError" class="extension-card__error">{{ operationError }}</p>

    <InkDialog
      v-model="setupPopupOpen"
      :title="t('extension.setupTitle', { name: extension.nickname ?? extension.name })"
      :show-cancel="false"
      :show-confirm="false"
      :close-on-scrim="false"
      @update:model-value="(open) => !open && closeSetup()"
    >
      <component :is="setupComponent" v-if="setupComponent" @close="closeSetup" />
    </InkDialog>

    <InkDialog
      v-model="configPopupOpen"
      :title="t('extension.editConfigTitle')"
      @confirm="onConfirmConfig"
    >
      <InkJsonEditor v-model="configModel" :schema="extension.config_schema ?? undefined" />
    </InkDialog>

    <InkDialog
      v-model="versionPopupOpen"
      :title="t('extension.changeVersionTitle')"
      @confirm="onConfirmVersion"
    >
      <InkInput
        v-model="versionModel"
        :label="t('extension.version')"
        :placeholder="t('extension.versionPlaceholder')"
        required
      />
    </InkDialog>
  </div>
</template>

<style lang="scss" scoped src="./extensionCard.scss" />
