<script setup lang="ts">
import { ref, computed } from "vue";
import { useI18n } from "vue-i18n";
import { InkButton, InkSwitch, InkPopup, InkJsonEditor } from "@inkcre/web-design";
import { extensionCardProps, extensionCardEmits } from "./extensionCard";

const props = defineProps(extensionCardProps);
const emit = defineEmits(extensionCardEmits);
const { t } = useI18n();

// --- data ---
const configPopupOpen = ref(false);
const togglePromise = ref<Promise<boolean> | null>(null);

// --- computed ---
const configModel = computed({
  get: () => {
    return JSON.stringify(props.extension.config ?? {}, null, 2);
  },
  set: (newValue: string) => {
    props.extension.config = JSON.parse(newValue);
  },
});

const toggleModel = computed({
  get: () => {
    return togglePromise.value
      ? togglePromise.value
      : !props.extension.disabled;
  },
  set: async (newValue: boolean) => {
    togglePromise.value = (async () => {
      const updatedExtension = props.extension.disabled
        ? await props.extension.enable()
        : await props.extension.disable();
      emit("toggle", updatedExtension);
      return !updatedExtension.disabled;
    })();
  },
});

const onEditConfigClick = () => {
  configPopupOpen.value = true;
};

const onConfirmConfig = async () => {
  try {
    if (props.extension) {
      await props.extension.updateConfig();
      configPopupOpen.value = false;
      emit("edit-config", props.extension);
    }
  } catch (error) {
    // JSON parsing error - show validation error
    console.error("Invalid JSON config:", error);
  }
};

const onCancelConfig = () => {
  configPopupOpen.value = false;
};
</script>

<template>
  <div v-if="extension" class="extension-card">
    <div class="extension-card__header">
      <div class="extension-card__info">
        <span class="extension-card__id">{{ extension.id }}</span>
        <span class="extension-card__version">v{{ extension.version }}</span>
      </div>
      <InkSwitch v-model="toggleModel" size="xs" />
    </div>

    <div v-if="extension.nickname" class="extension-card__nickname">
      {{ extension.nickname }}
    </div>

    <div class="extension-card__actions">
      <InkButton
        @click="onEditConfigClick"
        :text="t('extension.editConfig')"
        size="sm"
      />
    </div>

    <InkPopup :open="configPopupOpen">
      <h2 class="config-popup__title">{{ t("extension.editConfigTitle") }}</h2>
      <InkJsonEditor v-model="configModel" />
      <div class="config-popup__actions">
        <InkButton @click="onCancelConfig" :text="t('common.cancel')" />
        <InkButton
          @click="onConfirmConfig"
          :text="t('common.confirm')"
          type="primary"
        />
      </div>
    </InkPopup>
  </div>
</template>

<style lang="scss" scoped src="./extensionCard.scss" />
