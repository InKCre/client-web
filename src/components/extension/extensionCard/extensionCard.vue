<script setup lang="ts">
import { ref, computed } from "vue";
import { useI18n } from "vue-i18n";
import InkButton from "@/components/common/inkButton/inkButton.vue";
import InkSwitch from "@/components/common/InkSwitch/InkSwitch.vue";
import InkPopup from "@/components/common/InkPopup/InkPopup.vue";
import InkJsonEditor from "@/components/common/InkJsonEditor/InkJsonEditor.vue";
import { extensionCardProps, extensionCardEmits } from "./extensionCard";

const props = defineProps(extensionCardProps);
const emit = defineEmits(extensionCardEmits);
const { t } = useI18n();

// --- data ---
const configPopupOpen = ref(false);
const configModel = ref("");

// --- computed ---
const formattedConfig = computed(() => {
  if (!props.extension) return "{}";
  return JSON.stringify(props.extension.config || {}, null, 2);
});

const isDisabled = computed(() => props.extension?.disabled ?? false);

// --- methods ---
const onToggle = () => {
  if (props.extension) {
    emit("toggle", props.extension);
  }
};

const onEditConfigClick = () => {
  configModel.value = formattedConfig.value;
  configPopupOpen.value = true;
};

const onConfirmConfig = async () => {
  try {
    const parsedConfig = JSON.parse(configModel.value);
    if (props.extension) {
      await props.extension.updateConfig(parsedConfig);
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
        <h3 class="extension-card__id">{{ extension.id }}</h3>
        <span class="extension-card__version">v{{ extension.version }}</span>
      </div>
      <InkSwitch :model-value="!isDisabled" @update:model-value="onToggle" />
    </div>

    <div v-if="extension.nickname" class="extension-card__nickname">
      {{ extension.nickname }}
    </div>

    <div class="extension-card__actions">
      <InkButton @click="onEditConfigClick" :text="t('extension.editConfig')" />
    </div>

    <InkPopup
      :open="configPopupOpen"
      :title="t('extension.editConfigTitle')"
      @confirm="onConfirmConfig"
      @cancel="onCancelConfig"
    >
      <InkJsonEditor v-model="configModel" />
    </InkPopup>
  </div>
</template>

<style lang="scss" scoped src="./extensionCard.scss" />
