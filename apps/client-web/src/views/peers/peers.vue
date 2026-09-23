<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import PeerList from '@/components/peer/peerList/peerList.vue'

const { t } = useI18n()
</script>

<template>
  <main class="peers-view" :aria-label="t('peer.title')">
    <PeerList />
  </main>
</template>

<style lang="scss" scoped src="./peers.scss" />
