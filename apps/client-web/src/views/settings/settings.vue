<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { InkForm, InkInput, InkButton, InkDoubleCheck } from '@inkcre/web-design'
import { configStore, MetaConfigSchema, type MetaConfig } from '@inkcre/core'
import { setLocale, SUPPORT_LOCALES, LOCALE_NAMES, type SupportLocale } from '@/locales'
import i18n from '@/locales'

const { t } = useI18n()

// Local reactive copy of metaConfig for form editing
const metaFormConfig = reactive<MetaConfig>({ ...configStore.metaConfig })

// Synchronize metaFormConfig with configStore.metaConfig
watch(
  () => configStore.metaConfig,
  (newMetaConfig) => {
    Object.assign(metaFormConfig, newMetaConfig)
  },
  { deep: true }
)

// Current locale (computed for v-model)
const currentLocale = computed({
  get: () => i18n.global.locale.value as string,
  set: (value: string) => {
    setLocale(value as SupportLocale)
  },
})

// Save config
const onSave = async () => {
  try {
    const validated = MetaConfigSchema.parse(metaFormConfig)
    Object.assign(configStore.metaConfig, validated)
    await configStore.saveMeta()
    await configStore.loadClientConfig()
    alert(t('settings.saveSuccess'))
  } catch (error) {
    console.error('Failed to save config:', error)
    alert('Failed to save configuration')
  }
}

// Reset config
const onReset = async () => {
  await configStore.resetMeta()
  Object.assign(metaFormConfig, configStore.metaConfig)
}

// Export config
const onExport = () => {
  const portableConfig = {
    version: 1,
    containsCredential: false,
    metaConfig: {
      INKCRE_PGREST_URL: configStore.metaConfig.INKCRE_PGREST_URL,
      INKCRE_CLIENT_ID: configStore.metaConfig.INKCRE_CLIENT_ID,
    },
  }
  const configJson = JSON.stringify(portableConfig, null, 2)
  const blob = new Blob([configJson], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'inkcre-config.json'
  a.click()
  URL.revokeObjectURL(url)
}

// Import config
const fileInput = ref<HTMLInputElement | null>(null)

const onImport = () => {
  fileInput.value?.click()
}

const onFileSelected = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = async (e) => {
    try {
      const content = e.target?.result as string
      const imported = JSON.parse(content)
      const validated = MetaConfigSchema.parse({
        ...configStore.metaConfig,
        ...imported.metaConfig,
      })
      Object.assign(configStore.metaConfig, validated)
      await configStore.saveMeta()
      await configStore.loadClientConfig()
      Object.assign(metaFormConfig, configStore.metaConfig)
      alert(t('settings.saveSuccess'))
    } catch (error) {
      console.error('Failed to import config:', error)
      alert(t('settings.importError'))
    }
  }
  reader.readAsText(file)

  // Reset file input
  input.value = ''
}
</script>

<template>
  <main class="settings-view">
    <h1 class="settings-view__title">{{ t('settings.title') }}</h1>

    <InkForm layout="col" class="settings-view__form">
      <!-- Meta Configuration -->
      <h2 class="settings-view__section-title">
        {{ t('settings.metaConfig') }}
      </h2>
      <p class="settings-view__notice">{{ t('settings.storageNotice') }}</p>
      <InkInput
        v-model="metaFormConfig.INKCRE_PGREST_URL"
        :label="t('settings.pgrestUrl')"
        placeholder="https://..."
      />

      <label class="settings-view__secret">
        <span>{{ t('settings.jwtSecret') }}</span>
        <input
          v-model="metaFormConfig.INKCRE_JWT_SECRET"
          type="password"
          autocomplete="off"
          placeholder="••••••••"
        />
        <small>{{ t('settings.jwtStoredLocally') }}</small>
      </label>

      <InkInput
        v-model="metaFormConfig.INKCRE_CLIENT_ID"
        :label="t('settings.clientId')"
        placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
      />

      <!-- Language Selection -->
      <h2 class="settings-view__section-title">{{ t('settings.language') }}</h2>
      <label class="settings-view__locale">
        <span>{{ t('settings.languageLabel') }}</span>
        <select v-model="currentLocale">
          <option v-for="locale in SUPPORT_LOCALES" :key="locale" :value="locale">
            {{ LOCALE_NAMES[locale] }}
          </option>
        </select>
      </label>
    </InkForm>

    <!-- Action Buttons -->
    <div class="settings-view__actions">
      <InkButton :text="t('settings.saveConfig')" theme="primary" @click="onSave" />

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
    <p class="settings-view__export-note">{{ t('settings.exportExcludesSecret') }}</p>

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
