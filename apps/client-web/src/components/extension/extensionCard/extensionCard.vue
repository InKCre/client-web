<script setup lang="ts">
import { ref, computed, nextTick, shallowRef, watch, type Component } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  InkButton,
  InkSwitch,
  InkDialog,
  InkInput,
  InkJsonEditor,
  type JsonEditorValidation,
} from '@inkcre/ui-web'
import { getExtensionHost, getExtensionSetupContribution } from '@/core'
import { configStore, ExtensionRegistryOriginResolver } from '@inkcre/core'
import {
  getExtensionDocumentation,
  type ExtensionDocumentationLink,
} from '@inkcre/extension-runtime-client-web'
import { extensionCardProps, extensionCardEmits } from './extensionCard'

const props = defineProps(extensionCardProps)
const emit = defineEmits(extensionCardEmits)
const { t } = useI18n()

// --- data ---
const configPopupOpen = ref(false)
const configSaving = ref(false)
const configValidation = ref<JsonEditorValidation>()
const versionPopupOpen = ref<boolean | Promise<boolean>>(false)
const setupPopupOpen = ref(false)
const setupComponent = shallowRef<Component | null>(null)
const setupContribution = shallowRef(getExtensionSetupContribution(props.extension.name))
const togglePromise = ref<Promise<boolean> | null>(null)
const isUninstalling = ref(false)
const operationError = ref<string | null>(null)
const configModel = ref(JSON.stringify(props.extension.config, null, 2))
const versionModel = ref(props.extension.version)
const documentation = shallowRef<ExtensionDocumentationLink[]>([])
const documentationStatus = ref<'loading' | 'available' | 'missing' | 'unavailable'>('loading')
const canSaveConfig = computed(
  () =>
    configValidation.value?.status === 'valid' && configValidation.value.text === configModel.value
)

// --- computed ---
watch(
  () => [props.extension.name, props.extension.version] as const,
  async ([name, version], _previous, onCleanup) => {
    let current = true
    onCleanup(() => {
      current = false
    })
    documentation.value = []
    documentationStatus.value = 'loading'
    try {
      const origin = await new ExtensionRegistryOriginResolver(
        () => configStore.peerConfig.extension_registry_url
      ).resolve()
      const links = await getExtensionDocumentation(origin, name, version)
      if (!current) return
      documentation.value = links ?? []
      documentationStatus.value = links?.length ? 'available' : 'missing'
    } catch {
      if (current) documentationStatus.value = 'unavailable'
    }
  },
  { immediate: true }
)

watch(
  () => props.extension.config,
  (config) => {
    if (!configPopupOpen.value) configModel.value = JSON.stringify(config, null, 2)
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
        setupContribution.value = getExtensionSetupContribution(props.extension.name)
        togglePromise.value = null
      }
    })()
  },
})

const onEditConfigClick = () => {
  configModel.value = JSON.stringify(props.extension.config, null, 2)
  configValidation.value = undefined
  operationError.value = null
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
      const updatedExtension = await props.changeVersion(versionModel.value.trim())
      emit('updated', updatedExtension)
      return false
    } catch (error) {
      operationError.value = error instanceof Error ? error.message : String(error)
      return true
    }
  })()
}

const onConfirmConfig = async () => {
  if (configSaving.value || !canSaveConfig.value) return
  configSaving.value = true
  operationError.value = null
  try {
    const config: unknown = JSON.parse(configModel.value)
    if (!config || typeof config !== 'object' || Array.isArray(config))
      throw new Error(t('common.invalidConfig'))
    const updatedExtension = await getExtensionHost().updateConfig(
      props.extension.name,
      config as Record<string, unknown>
    )
    emit('updated', updatedExtension)
    configPopupOpen.value = false
  } catch (error) {
    operationError.value = error instanceof Error ? error.message : t('common.saveFailed')
  } finally {
    configSaving.value = false
  }
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
      <InkSwitch v-model="toggleModel" size="xs" :aria-label="extension.name" />
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
        :disabled="extension.enabled.length > 0 || !canChangeVersion"
      />
      <InkButton
        @click="onUninstall"
        :text="t('extension.uninstall')"
        theme="danger"
        size="sm"
        :disabled="!canUninstall"
        :is-loading="isUninstalling"
      />
    </div>

    <p v-if="extension.enabled.length > 0" class="extension-card__hint">
      {{ t('extension.enabledPeerCount', { count: extension.enabled.length }) }}
      {{ t('extension.uninstallDisabled') }}
    </p>
    <p v-if="operationError" class="extension-card__error">{{ operationError }}</p>
    <nav
      v-if="documentation.length"
      class="extension-card__actions"
      :aria-label="t('extension.documentation')"
    >
      <a
        v-for="link in documentation"
        :key="link.scope"
        :href="link.entry_url"
        target="_blank"
        rel="noopener noreferrer"
      >
        {{ t(`extension.documentationScope.${link.scope}`) }}
      </a>
    </nav>
    <p v-else-if="documentationStatus === 'unavailable'" class="extension-card__hint">
      {{ t('extension.documentationUnavailable') }}
    </p>

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
      :is-loading="configSaving"
    >
      <InkJsonEditor
        v-model="configModel"
        :schema="extension.config_schema ?? undefined"
        :label="t('extension.editConfigTitle')"
        :disabled="configSaving"
        @validation="configValidation = $event"
      />
      <p v-if="operationError" role="alert" class="extension-card__error">{{ operationError }}</p>
      <template #footer>
        <InkButton :text="t('common.cancel')" @click="configPopupOpen = false" />
        <InkButton
          :text="t('common.save')"
          theme="primary"
          :disabled="!canSaveConfig"
          :is-loading="configSaving"
          @click="onConfirmConfig"
        />
      </template>
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
      <p v-if="operationError" role="alert" class="extension-card__error">{{ operationError }}</p>
    </InkDialog>
  </div>
</template>

<style lang="scss" scoped src="./extensionCard.scss" />
