<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import {
  InkForm,
  InkInput,
  InkDropdown,
  InkButton,
  InkDoubleCheck,
  type DropdownOption,
} from "@inkcre/web-design";
import {
  configStore,
  localStorageAdapter,
  httpAdapter,
  envAdapter,
  type AdapterType,
  type ConfigAdapterWithWrite,
} from "@inkcre/core";
import {
  setLocale,
  SUPPORT_LOCALES,
  LOCALE_NAMES,
  type SupportLocale,
} from "@/locales";
import i18n from "@/locales";

const { t } = useI18n();

// Local reactive copy of metaConfig for form editing
const metaFormConfig = reactive({ ...configStore.metaConfig });

// Synchronize metaFormConfig with configStore.metaConfig
watch(
  () => configStore.metaConfig,
  (newMetaConfig) => {
    Object.assign(metaFormConfig, newMetaConfig);
  },
  { deep: true }
);

// Adapter options
const adapterOptions: DropdownOption[] = [
  { value: "localStorage", label: t("settings.adapterLocalStorage") },
  { value: "http", label: t("settings.adapterHttp") },
  { value: "env", label: t("settings.adapterEnv") },
];

// Map adapter type to actual adapter instance
const adapterMap: Record<
  Exclude<AdapterType, "webext">,
  ConfigAdapterWithWrite
> = {
  localStorage: localStorageAdapter,
  http: httpAdapter,
  env: envAdapter,
};

// Current adapter (computed for v-model)
const currentAdapter = computed({
  get: () => configStore.metaAdapter.name,
  set: async (value: string) => {
    const adapterKey = value as Exclude<AdapterType, "webext">;
    localStorage.setItem("inkcre_config_adapter", value);
    // Reload config from new adapter
    configStore.metaAdapter = adapterMap[adapterKey];
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
    // Update store config
    Object.assign(configStore.metaConfig, metaFormConfig);
    await configStore.saveMeta();
    alert(t("settings.saveSuccess"));
  } catch (error) {
    console.error("Failed to save config:", error);
    alert("Failed to save configuration");
  }
};

// Reset config
const onReset = () => {
  configStore.reset();
  // Reload form config after reset
  Object.assign(metaFormConfig, configStore.metaConfig);
};

// Export config
const onExport = () => {
  const fullConfig = {
    metaConfig: configStore.metaConfig,
  };
  const configJson = JSON.stringify(fullConfig, null, 2);
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

const onFileSelected = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const content = e.target?.result as string;
      const imported = JSON.parse(content);
      // Update store config
      if (imported.metaConfig) {
        Object.assign(configStore.metaConfig, imported.metaConfig);
      }
      // Save
      await configStore.saveMeta();
      // Reload form config after import
      alert(t("settings.saveSuccess"));
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

      <!-- Meta Configuration -->
      <h2 class="settings-view__section-title">
        {{ t("settings.metaConfig") }}
      </h2>
      <InkInput
        v-model="metaFormConfig.INKCRE_PGREST_URL"
        :label="t('settings.pgrestUrl')"
        placeholder="https://..."
      />

      <InkInput
        v-model="metaFormConfig.INKCRE_JWT_SECRET"
        :label="t('settings.jwtSecret')"
        placeholder="..."
      />

      <InkInput
        v-model="metaFormConfig.INKCRE_CLIENT_ID"
        :label="t('settings.clientId')"
        placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
      />

      <!-- Language Selection -->
      <h2 class="settings-view__section-title">{{ t("settings.language") }}</h2>
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
