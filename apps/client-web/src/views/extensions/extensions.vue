<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import extensionCard from '@/components/extension/extensionCard/extensionCard.vue'
import installExtension from '@/components/extension/installExtension/installExtension.vue'
import { InkLoading, InkDropdown } from '@inkcre/ui-web'
import {
  Client,
  configStore,
  registryExtensions,
  type RegistryInstallation,
  type RegistryPeerBinding,
} from '@inkcre/core'
import { useI18n } from 'vue-i18n'

// --- data ---
const { t } = useI18n()
const currentPeerId = configStore.metaConfig.INKCRE_CLIENT_ID
const managementPeerId = configStore.clientConfig.extension_management_peer_id
const selectedPeerId = ref<string>(currentPeerId || managementPeerId)
const extensions = ref<RegistryInstallation[]>([])
const bindings = ref<RegistryPeerBinding[]>([])
const extensionsLoading = ref(false)
const error = ref<string | null>(null)

const peerOptions = async () => {
  const clients = await Client.list()
  const permittedPeerIds = new Set([currentPeerId, managementPeerId].filter(Boolean))
  return clients
    .filter((client) => permittedPeerIds.has(client.id))
    .map((client) => ({ label: client.name, value: client.id }))
}

const bindingKeys = computed(
  () => new Set(bindings.value.map((binding) => `${binding.namespace}/${binding.name}`))
)

const isEnabledForSelectedPeer = (extension: RegistryInstallation) =>
  bindingKeys.value.has(`${extension.namespace}/${extension.name}`)

const refreshExtensions = async () => {
  extensionsLoading.value = true
  error.value = null
  try {
    const [installed, peerBindings] = await Promise.all([
      registryExtensions.listInstallations(),
      selectedPeerId.value
        ? registryExtensions.listPeerBindings(selectedPeerId.value)
        : Promise.resolve([]),
    ])
    extensions.value = installed
    bindings.value = peerBindings
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : String(cause)
  } finally {
    extensionsLoading.value = false
  }
}

watch(selectedPeerId, () => void refreshExtensions(), { immediate: true })

// --- methods ---
const onInstallExtension = () => {
  void refreshExtensions()
}

const updExtension = (updatedExtension: RegistryInstallation) => {
  extensions.value = extensions.value.map((ext) =>
    ext.namespace === updatedExtension.namespace && ext.name === updatedExtension.name
      ? updatedExtension
      : ext
  )
}
</script>

<template>
  <main class="extensions-view">
    <installExtension @install="onInstallExtension" />

    <div class="extensions-view__list">
      <div class="extensions-view__header">
        <InkDropdown
          v-model="selectedPeerId"
          :refresher="peerOptions"
          :label="t('extension.peer')"
          :placeholder="t('extension.selectPeer')"
        />
        <p class="extensions-view__hint">{{ t('extension.peerHelp') }}</p>
      </div>

      <div v-if="extensionsLoading" class="flex items-center justify-center">
        <InkLoading />
      </div>
      <p v-else-if="error" class="extensions-view__error">{{ error }}</p>
      <extensionCard
        v-for="extension in extensions"
        v-else
        :key="`${extension.namespace}/${extension.name}`"
        :extension="extension"
        :enabled="isEnabledForSelectedPeer(extension)"
        :peer-id="selectedPeerId"
        @changed="refreshExtensions"
        @updated="updExtension"
        @uninstalled="refreshExtensions"
      />
    </div>
  </main>
</template>

<style lang="scss" scoped src="./extensions.scss" />
