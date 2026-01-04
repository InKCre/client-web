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
import {
  configStore,
  localStorageAdapter,
  httpAdapter,
  devAdapter,
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
import ClientList from "@/components/client/clientList/clientList.vue";

const { t } = useI18n();

// Local reactive copy of config for form editing
const formConfig = reactive({ ...configStore.config });

// Adapter options
const adapterOptions: DropdownOption[] = [
  { value: "localStorage", label: t("settings.adapterLocalStorage") },
  { value: "http", label: t("settings.adapterHttp") },
  { value: "dev", label: t("settings.adapterDev") },
];

// Map adapter type to actual adapter instance
const adapterMap: Record<
  Exclude<AdapterType, "webext">,
  ConfigAdapterWithWrite
> = {
  localStorage: localStorageAdapter,
  http: httpAdapter,
  dev: devAdapter,
};

// Current adapter type (from localStorage or default)
const currentAdapterType = ref<Exclude<AdapterType, "webext">>("localStorage");

// Current adapter (computed for v-model)
const currentAdapter = computed({
  get: () => currentAdapterType.value,
  set: async (value: string) => {
    const adapterKey = value as Exclude<AdapterType, "webext">;
    currentAdapterType.value = adapterKey;
    localStorage.setItem("inkcre_config_adapter", value);
    // Reload config from new adapter
    await configStore.load([adapterMap[adapterKey]]);
    Object.assign(formConfig, configStore.config);
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
    Object.assign(configStore.config, formConfig);
    // Save to current adapter
    const adapter = adapterMap[currentAdapterType.value];
    await configStore.save(adapter);
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
  Object.assign(formConfig, structuredClone(configStore.config));
};

// Export config
const onExport = () => {
  const configJson = JSON.stringify(configStore.config, null, 2);
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
      Object.assign(configStore.config, imported);
      // Save to current adapter
      const adapter = adapterMap[currentAdapterType.value];
      await configStore.save(adapter);
      // Reload form config after import
      Object.assign(formConfig, structuredClone(configStore.config));
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

      <InkInput
        v-model="formConfig.INKCRE_CLIENT_ID"
        :label="t('settings.clientId')"
        placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
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

    <!-- Clients Section -->
    <ClientList />
  </main>
</template>

<style lang="scss" scoped src="./settings.scss"></style>
