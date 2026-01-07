<script setup lang="ts">
import { ref, computed } from "vue";
import { useI18n } from "vue-i18n";
import {
  InkButton,
  InkInput,
  InkDialog,
  InkJsonEditor,
} from "@inkcre/web-design";
import { Client, CreateClientForm } from "@inkcre/core";
import { clientCardProps, clientCardEmits } from "./clientCard";

const props = defineProps(clientCardProps);
const emit = defineEmits(clientCardEmits);

const { t } = useI18n();

const configPopupOpen = ref(false);
const configModel = computed({
  get: () => JSON.stringify(props.client.config ?? {}, null, 2),
  set: (newValue: string) => {
    props.client.config = JSON.parse(newValue);
  },
});

const saveClient = async () => {
  try {
    const form = new CreateClientForm(props.client);
    await form.upsert();
    emit("updated");
  } catch (error) {
    console.error("Failed to update client:", error);
    alert("Failed to update client");
  }
};

const onEditConfigClick = () => {
  configPopupOpen.value = true;
};

const onConfirmConfig = async () => {
  try {
    await props.client.saveConfig();
    emit("updated");
    configPopupOpen.value = false;
  } catch (error) {
    console.error("Failed to update client config:", error);
    alert("Failed to update client config");
  }
};

const getStatusText = (status: "online" | "offline" | "unknown") => {
  const statusMap = {
    online: t("client.statusOnline"),
    offline: t("client.statusOffline"),
    unknown: t("client.statusUnknown"),
  };
  return statusMap[status];
};
</script>

<template>
  <div class="client-card">
    <div class="client-card__item-info">
      <InkInput v-model="client.name" type="inline" @confirm="saveClient" />
      <span class="client-card__item-id">{{ client.id }}</span>
      <InkInput
        v-model="client.rest_api_url"
        type="inline"
        @confirm="saveClient"
      />
      <InkButton
        :text="t('client.editConfig')"
        size="sm"
        @click="onEditConfigClick"
      />
    </div>
    <span
      :class="[
        'client-card__item-status',
        `client-card__item-status--${status}`,
      ]"
    >
      {{ getStatusText(status) }}
    </span>

    <InkDialog
      v-model="configPopupOpen"
      :title="t('client.editConfigTitle')"
      @confirm="onConfirmConfig"
    >
      <InkJsonEditor v-model="configModel" />
    </InkDialog>
  </div>
</template>

<style lang="scss" scoped src="./clientCard.scss" />
