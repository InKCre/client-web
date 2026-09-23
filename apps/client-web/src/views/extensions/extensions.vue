<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { InkButton, InkDropdown, InkLoading, InkPlaceholder, InkTabs } from '@inkcre/ui-web'
import { configStore, Peer, type InstalledExtension } from '@inkcre/core'
import extensionCard from '@/components/extension/extensionCard/extensionCard.vue'
import extensionDiscovery from '@/components/extension/extensionDiscovery/extensionDiscovery.vue'
import { getExtensionHost, startExtensionHost, WEB_PEER_IDENTITY } from '@/core'
import { extensionPeerControlMode, setExtensionPeerEnabled } from '@/extension-peer-control'

const { t } = useI18n()
const route = useRoute()
const currentPeerId = configStore.metaConfig.INKCRE_PEER_ID
const selectedPeerId = ref(currentPeerId)
const peers = ref<Peer[]>([])
const extensions = ref<InstalledExtension[]>([])
const peersLoading = ref(false)
const extensionsLoading = ref(false)
const extensionError = ref<string | null>(null)
const peerError = ref<string | null>(null)

const activeView = computed(() => (route.query.view === 'discover' ? 'discover' : 'installed'))
const viewTabs = computed(() => [
  { value: 'installed', label: t('extension.installed'), to: '/extensions' },
  {
    value: 'discover',
    label: t('extension.discover'),
    to: { path: '/extensions', query: { view: 'discover' } },
  },
])
const currentPeerFallback = Peer.parse({
  id: currentPeerId,
  name: t('extension.currentBrowser'),
  application_version: WEB_PEER_IDENTITY.applicationVersion,
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
const peerLabel = (peer: Peer) =>
  `${peer.name} · ${peer.application_version ? `v${peer.application_version}` : t('peer.versionUnknown')}`
const peerOptions = computed(() => {
  const options = peers.value.map((peer) => ({
    label:
      peer.id === currentPeerId
        ? `${peerLabel(peer)} (${t('extension.currentBrowser')})`
        : peerLabel(peer),
    value: peer.id,
    description: peer.id,
  }))
  return peers.value.some((peer) => peer.id === currentPeerId)
    ? options
    : [
        {
          label: `${t('extension.currentBrowser')} · v${WEB_PEER_IDENTITY.applicationVersion}`,
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

async function refreshPeers(): Promise<void> {
  peersLoading.value = true
  peerError.value = null
  try {
    peers.value = await Peer.list()
  } catch (error) {
    peers.value = []
    peerError.value = error instanceof Error ? error.message : String(error)
  } finally {
    peersLoading.value = false
  }
}

async function refreshExtensions(): Promise<void> {
  extensionsLoading.value = true
  extensionError.value = null
  try {
    extensions.value = await getExtensionHost().list()
  } catch (error) {
    extensionError.value = error instanceof Error ? error.message : String(error)
  } finally {
    extensionsLoading.value = false
  }
}

function updateExtension(updated: InstalledExtension): void {
  const existing = extensions.value.find(({ name }) => name === updated.name)
  extensions.value = existing
    ? extensions.value.map((extension) => (extension.name === updated.name ? updated : extension))
    : [...extensions.value, updated].sort((left, right) => left.name.localeCompare(right.name))
}

function setEnabledForSelectedPeer(
  extension: InstalledExtension,
  enabled: boolean
): Promise<InstalledExtension> {
  const peer = selectedPeer.value
  if (!peer) throw new Error(t('extension.peerNotFound'))
  return setExtensionPeerEnabled({
    name: extension.name,
    peer,
    currentPeerId,
    enabled,
    manager: getExtensionHost(),
  })
}

onMounted(() => {
  void startExtensionHost().catch(() => {
    // The app shell owns runtime-startup reporting; this page remains a recovery surface.
  })
  void refreshExtensions()
  void refreshPeers()
})
</script>

<template>
  <main class="extensions-view">
    <header class="extensions-view__page-header">
      <h1>{{ t('extension.title') }}</h1>
      <InkTabs
        :tabs="viewTabs"
        :model-value="activeView"
        :label="t('extension.title')"
        :link-component="RouterLink"
      />
    </header>

    <extensionDiscovery
      v-if="activeView === 'discover'"
      :installed="extensions"
      @installed="updateExtension"
    />

    <template v-else>
      <section class="extensions-view__peer-control">
        <InkDropdown
          v-model="selectedPeerId"
          :label="t('extension.runOnPeer')"
          :placeholder="t('extension.peerSelectorPlaceholder')"
          :options="peerOptions"
          :disabled="peersLoading"
        />
        <InkLoading v-if="peersLoading" size="sm" />
        <p v-else-if="selectedControlMode === 'desired-state'" class="extensions-view__notice">
          {{ t('extension.desiredStateOnly') }}
        </p>
        <p v-if="peerError" role="alert" class="extensions-view__error">
          {{ t('extension.peerListUnavailable', { error: peerError }) }}
        </p>
      </section>

      <section class="extensions-view__list">
        <div v-if="extensionsLoading" class="extensions-view__loading">
          <InkLoading />
        </div>
        <InkPlaceholder
          v-else-if="extensionError"
          state="error"
          :title="t('extension.installedUnavailable')"
          :description="extensionError"
        >
          <template #actions>
            <InkButton :text="t('common.retry')" @click="refreshExtensions" />
          </template>
        </InkPlaceholder>
        <InkPlaceholder
          v-else-if="extensions.length === 0"
          :title="t('extension.noneInstalled')"
          :description="t('extension.noneInstalledDescription')"
        >
          <template #actions>
            <RouterLink :to="{ path: '/extensions', query: { view: 'discover' } }">
              {{ t('extension.discover') }}
            </RouterLink>
          </template>
        </InkPlaceholder>
        <extensionCard
          v-for="extension in extensions"
          v-else
          :key="extension.name"
          :extension="extension"
          :enabled="isEnabledForSelectedPeer(extension)"
          :controls-current-web-runtime="selectedControlMode === 'current-runtime'"
          :set-enabled="(enabled) => setEnabledForSelectedPeer(extension, enabled)"
          @updated="updateExtension"
          @uninstalled="refreshExtensions"
        />
      </section>
    </template>
  </main>
</template>

<style lang="scss" scoped src="./extensions.scss" />
