<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAsyncState } from '@vueuse/core'
import { InkButton, InkLoading } from '@inkcre/ui-web'
import { Client } from '@inkcre/core'
import ClientCard from '../clientCard/clientCard.vue'

const { t } = useI18n()

// --- data ---
const {
  state: clients,
  execute: loadClients,
  isLoading: clientsLoading,
  error: clientsError,
} = useAsyncState(() => Client.list(), [], { immediate: true })

const clientHealthStatus = ref<Record<string, 'online' | 'offline' | 'unknown'>>({})
const healthCheckLoading = ref(false)

// --- methods ---
const refreshClients = async () => {
  clientHealthStatus.value = {}
  await loadClients()
}

const checkAllHealth = async () => {
  healthCheckLoading.value = true
  const results: Record<string, 'online' | 'offline' | 'unknown'> = {}
  try {
    await Promise.all(
      clients.value.map(async (client) => {
        results[client.id] = client.rest_api_url ? await client.ping() : 'unknown'
      })
    )
    clientHealthStatus.value = results
  } finally {
    healthCheckLoading.value = false
  }
}

const getClientStatus = (clientId: string) => {
  return clientHealthStatus.value[clientId] || 'unknown'
}

const clientsErrorMessage = computed(() => {
  if (!clientsError.value) return ''
  return clientsError.value instanceof Error
    ? clientsError.value.message
    : String(clientsError.value)
})
</script>

<template>
  <section class="client-list">
    <div class="client-list__header">
      <div>
        <h2 class="client-list__title">{{ t('settings.allClientsScope') }}</h2>
        <p class="client-list__notice">{{ t('settings.allClientsNotice') }}</p>
      </div>
      <div class="client-list__actions">
        <InkButton
          :text="t('client.refresh')"
          size="sm"
          :loading="clientsLoading"
          @click="refreshClients"
        />
        <InkButton
          :text="t('client.checkHealth')"
          size="sm"
          :loading="healthCheckLoading"
          @click="checkAllHealth"
        />
      </div>
    </div>

    <InkLoading v-if="clientsLoading && clients.length === 0" />

    <div v-else-if="clientsError" class="client-list__error" role="alert">
      {{ clientsErrorMessage }}
    </div>

    <div v-else-if="clients.length === 0" class="client-list__empty">
      {{ t('client.noClients') }}
    </div>

    <div v-else class="client-list__list">
      <ClientCard
        v-for="client in clients"
        :key="client.id"
        :client="client"
        :status="getClientStatus(client.id)"
        @updated="refreshClients"
      />
    </div>
  </section>
</template>

<style lang="scss" scoped src="./clientList.scss" />
