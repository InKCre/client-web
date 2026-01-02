<script setup lang="ts">
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import { useAsyncState } from "@vueuse/core";
import { InkButton, InkLoading } from "@inkcre/web-design";
import { Client } from "@/business/client";

const { t } = useI18n();

// --- data ---
const {
  state: clients,
  execute: refreshClients,
  isLoading: clientsLoading,
} = useAsyncState(() => Client.list(), [], { immediate: true });

const clientHealthStatus = ref<Record<string, "online" | "offline" | "unknown">>(
  {}
);
const healthCheckLoading = ref(false);

// --- methods ---
const checkAllHealth = async () => {
  healthCheckLoading.value = true;
  const results: Record<string, "online" | "offline" | "unknown"> = {};
  await Promise.all(
    clients.value.map(async (client) => {
      results[client.id] = client.rest_api_url ? await client.ping() : "unknown";
    })
  );
  clientHealthStatus.value = results;
  healthCheckLoading.value = false;
};

const getStatusText = (status: "online" | "offline" | "unknown") => {
  const statusMap = {
    online: t("client.statusOnline"),
    offline: t("client.statusOffline"),
    unknown: t("client.statusUnknown"),
  };
  return statusMap[status];
};

const getClientStatus = (clientId: string) => {
  return clientHealthStatus.value[clientId] || "unknown";
};
</script>

<template>
  <section class="client-list">
    <div class="client-list__header">
      <h2 class="client-list__title">{{ t("client.listTitle") }}</h2>
      <div class="client-list__actions">
        <InkButton
          :text="t('client.refresh')"
          size="sm"
          :loading="clientsLoading"
          @click="() => refreshClients()"
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

    <div v-else-if="clients.length === 0" class="client-list__empty">
      {{ t("client.noClients") }}
    </div>

    <div v-else class="client-list__list">
      <div v-for="client in clients" :key="client.id" class="client-list__item">
        <div class="client-list__item-info">
          <span class="client-list__item-name">{{ client.name }}</span>
          <span class="client-list__item-id">{{ client.id }}</span>
          <span class="client-list__item-url">{{ client.rest_api_url || "-" }}</span>
        </div>
        <span
          :class="[
            'client-list__item-status',
            `client-list__item-status--${getClientStatus(client.id)}`,
          ]"
        >
          {{ getStatusText(getClientStatus(client.id)) }}
        </span>
      </div>
    </div>
  </section>
</template>

<style lang="scss" scoped src="./clientList.scss" />
