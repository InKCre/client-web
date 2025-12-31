<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import { useI18n } from "vue-i18n";
import {
  InkForm,
  InkInput,
  InkDropdown,
  InkButton,
  InkDoubleCheck,
  type DropdownOption,
} from "@inkcre/web-design";
import { CONFIG, configManager, type AdapterType } from "@/config";
import {
  setLocale,
  SUPPORT_LOCALES,
  LOCALE_NAMES,
  type SupportLocale,
} from "@/locales";
import i18n from "@/locales";

const { t } = useI18n();

// Local reactive copy of config for form editing
const formConfig = reactive({ ...CONFIG });

// Adapter options
const adapterOptions: DropdownOption[] = [
  { value: "localStorage", label: t("settings.adapterLocalStorage") },
  { value: "http", label: t("settings.adapterHttp") },
];

// Current adapter (computed for v-model)
const currentAdapter = computed({
  get: () => configManager.currentAdapterType.value,
  set: async (value: string) => {
    await configManager.setAdapterType(value as AdapterType);
    // Reload form config after adapter change
    Object.assign(formConfig, CONFIG);
  },
});

// Language options
const languageOptions: DropdownOption[] = SUPPORT_LOCALES.map((locale) => ({
  value: locale,
  label: LOCALE_NAMES[locale],
}));

// Current locale (computed for v-model)
const currentLocale = computed({
  get: () => i18n.global.locale.value as string,
  set: (value: string) => {
    setLocale(value as SupportLocale);
  },
});

// Save config
const onSave = async () => {
  try {
    configManager.update(formConfig);
    await configManager.save();
    alert(t("settings.saveSuccess"));
  } catch (error) {
    console.error("Failed to save config:", error);
    alert("Failed to save configuration");
  }
};

// Reset config
const onReset = () => {
  configManager.reset();
  // Reload form config after reset
  Object.assign(formConfig, CONFIG);
};

// Export config
const onExport = () => {
  const configJson = JSON.stringify(CONFIG, null, 2);
  const blob = new Blob([configJson], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "inkcre-config.json";
  a.click();
  URL.revokeObjectURL(url);
};

// Import config
const fileInput = ref<HTMLInputElement | null>(null);

const onImport = () => {
  fileInput.value?.click();
};

const onFileSelected = (event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const content = e.target?.result as string;
      configManager.import(content);
      // Reload form config after import
      Object.assign(formConfig, CONFIG);
    } catch (error) {
      console.error("Failed to import config:", error);
      alert(t("settings.importError"));
    }
  };
  reader.readAsText(file);

  // Reset file input
  input.value = "";
};
</script>

<template>
  <main class="settings-view">
    <h1 class="settings-view__title">{{ t("settings.title") }}</h1>

    <InkForm layout="col" class="settings-view__form">
      <!-- Config Adapter Selection -->
      <InkDropdown
        v-model="currentAdapter"
        :label="t('settings.configAdapter')"
        :options="adapterOptions"
      />

      <!-- Config Fields -->
      <InkInput
        v-model="formConfig.INKCRE_CORE_URL"
        :label="t('settings.coreUrl')"
        placeholder="http://127.0.0.1:8000"
      />

      <InkInput
        v-model="formConfig.INKCRE_PGREST_URL"
        :label="t('settings.pgrestUrl')"
        placeholder="https://..."
      />

      <InkInput
        v-model="formConfig.INKCRE_EXTENSION_REGISTRY_URL"
        :label="t('settings.extensionRegistryUrl')"
        placeholder="https://..."
      />

      <InkInput
        v-model="formConfig.INKCRE_JWT_SECRET"
        :label="t('settings.jwtSecret')"
        placeholder="..."
      />

      <!-- Language Selection -->
      <InkDropdown
        v-model="currentLocale"
        :label="t('settings.languageLabel')"
        :options="languageOptions"
      />
    </InkForm>

    <!-- Action Buttons -->
    <div class="settings-view__actions">
      <InkButton
        :text="t('settings.saveConfig')"
        theme="primary"
        @click="onSave"
      />

      <InkDoubleCheck
        :title="t('settings.resetConfirmTitle')"
        :message="t('settings.resetConfirmMessage')"
        @confirm="onReset"
      >
        <InkButton :text="t('settings.resetConfig')" theme="danger" />
      </InkDoubleCheck>

      <InkButton :text="t('settings.exportConfig')" @click="onExport" />
      <InkButton :text="t('settings.importConfig')" @click="onImport" />
    </div>

    <!-- Hidden file input for import -->
    <input
      ref="fileInput"
      type="file"
      accept=".json"
      style="display: none"
      @change="onFileSelected"
    />
  </main>
</template>

<style lang="scss" scoped src="./settings.scss"></style>
