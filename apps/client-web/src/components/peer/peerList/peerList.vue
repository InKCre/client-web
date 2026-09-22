<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { InkButton, InkLoading, InkPlaceholder } from '@inkcre/ui-web'
import { configStore, Peer, PeerManager } from '@inkcre/core'
import PeerCard from '../peerCard/peerCard.vue'

const { t } = useI18n()
const peers = ref<Peer[]>([])
const livePeers = ref(new Set<string>())
const loading = ref(false)
const error = ref('')
const currentPeerId = configStore.metaConfig.INKCRE_PEER_ID

const refreshPeers = async () => {
  if (loading.value) return
  loading.value = true
  error.value = ''
  try {
    const [all, live] = await Promise.all([Peer.list(), PeerManager.listLive()])
    peers.value = all
    livePeers.value = new Set(live.map((peer) => peer.id))
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : String(cause)
  } finally {
    loading.value = false
  }
}

const getPeerStatus = (peer: Peer): 'online' | 'offline' | 'unknown' => {
  if (peer.lease_expires_at === null) return 'unknown'
  return livePeers.value.has(peer.id) ? 'online' : 'offline'
}

onMounted(refreshPeers)
</script>

<template>
  <section class="peer-list">
    <div class="peer-list__header">
      <InkButton :text="t('peer.refresh')" size="sm" :is-loading="loading" @click="refreshPeers" />
    </div>

    <InkLoading v-if="loading && peers.length === 0" />
    <InkPlaceholder
      v-else-if="error"
      state="error"
      :title="t('peer.listFailed')"
      :description="error"
    >
      <template #actions>
        <InkButton :text="t('common.refresh')" @click="refreshPeers" />
      </template>
    </InkPlaceholder>
    <InkPlaceholder v-else-if="peers.length === 0" :title="t('peer.empty')" />
    <div v-else class="peer-list__list">
      <PeerCard
        v-for="peer in peers"
        :key="peer.id"
        :peer="peer"
        :status="getPeerStatus(peer)"
        :current="peer.id === currentPeerId"
        @updated="refreshPeers"
      />
    </div>
  </section>
</template>

<style lang="scss" scoped src="./peerList.scss" />
