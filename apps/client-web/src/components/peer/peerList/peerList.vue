<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAsyncState } from '@vueuse/core'
import { InkButton, InkLoading } from '@inkcre/ui-web'
import { Peer, PeerManager } from '@inkcre/core'
import PeerCard from '../peerCard/peerCard.vue'

const { t } = useI18n()
const {
  state: peers,
  execute: refreshPeers,
  isLoading: peersLoading,
} = useAsyncState(() => Peer.list(), [], { immediate: true })
const livePeers = ref(new Set<string>())
const healthCheckLoading = ref(false)

const checkAllHealth = async () => {
  healthCheckLoading.value = true
  try {
    livePeers.value = new Set((await PeerManager.listLive()).map((peer) => peer.id))
  } finally {
    healthCheckLoading.value = false
  }
}

const getPeerStatus = (peer: Peer): 'online' | 'offline' | 'unknown' => {
  if (peer.lease_expires_at === null) return 'unknown'
  return livePeers.value.has(peer.id) ? 'online' : 'offline'
}
</script>

<template>
  <section class="peer-list">
    <div class="peer-list__header">
      <h2 class="peer-list__title">{{ t('client.listTitle') }}</h2>
      <div class="peer-list__actions">
        <InkButton
          :text="t('client.refresh')"
          size="sm"
          :loading="peersLoading"
          @click="() => refreshPeers()"
        />
        <InkButton
          :text="t('client.checkHealth')"
          size="sm"
          :loading="healthCheckLoading"
          @click="checkAllHealth"
        />
      </div>
    </div>

    <InkLoading v-if="peersLoading && peers.length === 0" />
    <div v-else-if="peers.length === 0" class="peer-list__empty">
      {{ t('client.noClients') }}
    </div>
    <div v-else class="peer-list__list">
      <PeerCard
        v-for="peer in peers"
        :key="peer.id"
        :peer="peer"
        :status="getPeerStatus(peer)"
        @updated="refreshPeers"
      />
    </div>
  </section>
</template>

<style lang="scss" scoped src="./peerList.scss" />
