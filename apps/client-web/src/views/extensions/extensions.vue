<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import extensionCard from '@/components/extension/extensionCard/extensionCard.vue'
import installExtension from '@/components/extension/installExtension/installExtension.vue'
import { InkDropdown, InkLoading } from '@inkcre/ui-web'
import { configStore, Peer, type InstalledExtension } from '@inkcre/core'
import { getExtensionHost, getExtensionState, startExtensionHost } from '@/core'
import { extensionPeerControlMode, setExtensionPeerEnabled } from '@/extension-peer-control'
import { useI18n } from 'vue-i18n'

// --- data ---
const { t } = useI18n()
const currentPeerId = configStore.metaConfig.INKCRE_PEER_ID
const selectedPeerId = ref(currentPeerId)
const peers = ref<Peer[]>([])
const extensions = ref<InstalledExtension[]>([])
const peersLoading = ref(false)
const extensionsLoading = ref(false)
const error = ref<string | null>(null)
const peerError = ref<string | null>(null)

const currentPeerFallback = Peer.parse({
  id: currentPeerId,
  name: t('extension.currentBrowser'),
  labels: [],
  config: {},
  config_schema: {},
  capabilities: [],
  lease_expires_at: new Date(Date.now() + 60_000),
  created_at: new Date(),
  updated_at: new Date(),
})
const selectedPeer = computed(
  () =>
    peers.value.find((peer) => peer.id === selectedPeerId.value) ??
    (selectedPeerId.value === currentPeerId ? currentPeerFallback : null)
)
const peerOptions = computed(() => {
  const options = peers.value.map((peer) => ({
    label:
      peer.id === currentPeerId ? `${peer.name} (${t('extension.currentBrowser')})` : peer.name,
    value: peer.id,
    description: peer.id,
  }))
  return peers.value.some((peer) => peer.id === currentPeerId)
    ? options
    : [
        {
          label: t('extension.currentBrowser'),
          value: currentPeerId,
          description: currentPeerId,
        },
        ...options,
      ]
})
const selectedControlMode = computed(() =>
  selectedPeer.value ? extensionPeerControlMode(selectedPeer.value, currentPeerId) : null
)
const isEnabledForSelectedPeer = (extension: InstalledExtension) =>
  extension.enabled.includes(selectedPeerId.value)

const refreshPeers = async () => {
  peersLoading.value = true
  peerError.value = null
  try {
    peers.value = await Peer.list()
  } catch (cause) {
    peers.value = []
    peerError.value = cause instanceof Error ? cause.message : String(cause)
  } finally {
    peersLoading.value = false
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
    // The app shell owns runtime-startup reporting; this list remains a recovery surface.
  }
  await Promise.all([refreshPeers(), refreshExtensions()])
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

const setEnabledForSelectedPeer = (
  extension: InstalledExtension,
  enabled: boolean
): Promise<InstalledExtension> => {
  const peer = selectedPeer.value
  if (!peer) throw new Error(t('extension.peerNotFound'))
  return setExtensionPeerEnabled({
    name: extension.name,
    peer,
    currentPeerId,
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
          v-model="selectedPeerId"
          :label="t('extension.peerSelector')"
          :placeholder="t('extension.peerSelectorPlaceholder')"
          :options="peerOptions"
        />
        <p v-if="selectedControlMode === 'desired-state'" class="extensions-view__notice">
          {{ t('extension.desiredStateOnly') }}
        </p>
        <p v-if="peerError" class="extensions-view__error">
          {{ t('extension.peerListUnavailable', { error: peerError }) }}
        </p>
      </div>

      <div v-if="extensionsLoading || peersLoading" class="flex items-center justify-center">
        <InkLoading />
      </div>
      <p v-else-if="error" class="extensions-view__error">{{ error }}</p>
      <extensionCard
        v-for="extension in extensions"
        v-else
        :key="extension.name"
        :extension="extension"
        :enabled="isEnabledForSelectedPeer(extension)"
        :controls-current-web-runtime="selectedControlMode === 'current-runtime'"
        :set-enabled="(enabled) => setEnabledForSelectedPeer(extension, enabled)"
        @updated="updExtension"
        @uninstalled="refreshExtensions"
      />
    </div>
  </main>
</template>

<style lang="scss" scoped src="./extensions.scss" />
