<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import extensionCard from '@/components/extension/extensionCard/extensionCard.vue'
import installExtension from '@/components/extension/installExtension/installExtension.vue'
import { InkDropdown, InkLoading } from '@inkcre/ui-web'
import { Client, configStore, type InstalledExtension } from '@inkcre/core'
import { getExtensionHost, getExtensionState, startExtensionHost } from '@/core'
import {
  extensionClientControlMode,
  setExtensionClientEnabled,
  type ExtensionClient,
} from '@/extension-client-control'
import { useI18n } from 'vue-i18n'

// --- data ---
const { t } = useI18n()
const currentClientId = configStore.metaConfig.client_id
const selectedClientId = ref(currentClientId)
const clients = ref<Client[]>([])
const extensions = ref<InstalledExtension[]>([])
const clientsLoading = ref(false)
const extensionsLoading = ref(false)
const error = ref<string | null>(null)
const clientError = ref<string | null>(null)

const currentClientFallback: ExtensionClient = {
  id: currentClientId,
  rest_api_url: null,
}
const selectedClient = computed(
  () =>
    clients.value.find((client) => client.id === selectedClientId.value) ??
    (selectedClientId.value === currentClientId ? currentClientFallback : null)
)
const clientOptions = computed(() => {
  const options = clients.value.map((client) => ({
    label:
      client.id === currentClientId
        ? `${client.name} (${t('extension.currentBrowser')})`
        : client.name,
    value: client.id,
    description: client.id,
  }))
  if (clients.value.some((client) => client.id === currentClientId)) return options
  return [
    {
      label: t('extension.currentBrowser'),
      value: currentClientId,
      description: currentClientId,
    },
    ...options,
  ]
})
const selectedControlMode = computed(() =>
  selectedClient.value ? extensionClientControlMode(selectedClient.value, currentClientId) : null
)
const isEnabledForSelectedClient = (extension: InstalledExtension) =>
  selectedClientId.value ? extension.enabled.includes(selectedClientId.value) : false

const refreshClients = async () => {
  clientsLoading.value = true
  clientError.value = null
  try {
    clients.value = await Client.list()
  } catch (cause) {
    clients.value = []
    clientError.value = cause instanceof Error ? cause.message : String(cause)
  } finally {
    clientsLoading.value = false
  }
}

const refreshExtensions = async () => {
  extensionsLoading.value = true
  error.value = null
  try {
    extensions.value = await getExtensionHost().list()
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : String(cause)
  } finally {
    extensionsLoading.value = false
  }
}

onMounted(async () => {
  try {
    await startExtensionHost()
  } catch {
    // The app shell owns runtime-startup reporting. The installed list remains a
    // useful recovery surface even when one enabled Extension fails to start.
  }
  try {
    await Promise.all([refreshClients(), refreshExtensions()])
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : String(cause)
  }
})

// --- methods ---
const onInstallExtension = () => {
  void refreshExtensions()
}

const updExtension = (updatedExtension: InstalledExtension) => {
  extensions.value = extensions.value.map((extension) =>
    extension.name === updatedExtension.name ? updatedExtension : extension
  )
}

const setEnabledForSelectedClient = async (
  extension: InstalledExtension,
  enabled: boolean
): Promise<InstalledExtension> => {
  const client = selectedClient.value
  if (!client) throw new Error(t('extension.clientNotFound'))

  return setExtensionClientEnabled({
    name: extension.name,
    client,
    currentClientId,
    enabled,
    webHost: getExtensionHost(),
    state: getExtensionState(),
  })
}
</script>

<template>
  <main class="extensions-view">
    <installExtension @install="onInstallExtension" />

    <div class="extensions-view__list">
      <div class="extensions-view__header">
        <InkDropdown
          v-model="selectedClientId"
          :label="t('extension.clientSelector')"
          :placeholder="t('extension.clientSelectorPlaceholder')"
          :options="clientOptions"
        />
        <p v-if="selectedControlMode === 'desired-state'" class="extensions-view__notice">
          {{ t('extension.desiredStateOnly') }}
        </p>
        <p v-if="clientError" class="extensions-view__error">
          {{ t('extension.clientListUnavailable', { error: clientError }) }}
        </p>
      </div>

      <div v-if="extensionsLoading || clientsLoading" class="flex items-center justify-center">
        <InkLoading />
      </div>
      <p v-else-if="error" class="extensions-view__error">{{ error }}</p>
      <extensionCard
        v-for="extension in extensions"
        v-else
        :key="extension.name"
        :extension="extension"
        :enabled="isEnabledForSelectedClient(extension)"
        :controls-current-web-runtime="selectedControlMode === 'current-runtime'"
        :set-enabled="(enabled) => setEnabledForSelectedClient(extension, enabled)"
        @updated="updExtension"
        @uninstalled="refreshExtensions"
      />
    </div>
  </main>
</template>

<style lang="scss" scoped src="./extensions.scss" />
