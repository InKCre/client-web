<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { InkForm, InkInput, InkButton, InkDoubleCheck } from '@inkcre/ui-web'
import { configStore, MetaConfigSchema, type MetaConfig } from '@inkcre/core'
import { z } from 'zod'
import { setLocale, SUPPORT_LOCALES, LOCALE_NAMES, type SupportLocale } from '@/locales'
import i18n from '@/locales'
import {
  adoptWebPeerRuntime,
  startConfiguredWebPeerRuntime,
  stopWebPeerRuntime,
  WEB_PEER_IDENTITY,
} from '@/core'

const { t } = useI18n()

const metaFormConfig = reactive<MetaConfig>({ ...configStore.metaConfig })
const saving = ref(false)
const hasConnectedConfig = computed(
  () =>
    Boolean(configStore.metaConfig.INKCRE_PGREST_URL) &&
    Boolean(configStore.metaConfig.INKCRE_JWT_SECRET)
)
const formBusy = computed(() => saving.value)
const SettingsExportSchema = z.object({
  version: z.literal(2),
  metaConfig: MetaConfigSchema,
  locale: z.enum(SUPPORT_LOCALES),
})

// Synchronize metaFormConfig with configStore.metaConfig
watch(
  () => configStore.metaConfig,
  (newMetaConfig) => {
    Object.assign(metaFormConfig, newMetaConfig)
  },
  { deep: true }
)
onMounted(async () => {
  if (!hasConnectedConfig.value) return
  try {
    await startConfiguredWebPeerRuntime()
  } catch (error) {
    console.warn('Configured Web Peer could not start from Settings.', error)
  }
})

// Current locale (computed for v-model)
const currentLocale = computed({
  get: () => i18n.global.locale.value as string,
  set: (value: string) => {
    setLocale(value as SupportLocale)
  },
})

const onSave = async () => {
  if (formBusy.value) return
  saving.value = true
  try {
    const validatedMeta = MetaConfigSchema.parse(metaFormConfig)
    const runtime = await configStore.connectAndSave(validatedMeta, WEB_PEER_IDENTITY)
    adoptWebPeerRuntime(runtime)
    Object.assign(metaFormConfig, configStore.metaConfig)
    alert(t('settings.saveSuccess'))
  } catch (error) {
    console.error('Failed to save config:', error)
    alert('Failed to save configuration')
  } finally {
    saving.value = false
  }
}

const onReset = async () => {
  await stopWebPeerRuntime()
  await configStore.resetMeta()
  Object.assign(metaFormConfig, configStore.metaConfig)
}

const onExport = () => {
  const portableConfig = SettingsExportSchema.parse({
    version: 2,
    metaConfig: configStore.metaConfig,
    locale: currentLocale.value,
  })
  const configJson = JSON.stringify(portableConfig, null, 2)
  const blob = new Blob([configJson], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'inkcre-config.json'
  a.click()
  URL.revokeObjectURL(url)
}

const fileInput = ref<HTMLInputElement | null>(null)

const onImport = () => {
  if (formBusy.value) return
  fileInput.value?.click()
}

const onFileSelected = async (event: Event) => {
  if (formBusy.value) return
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  saving.value = true
  try {
    const imported = SettingsExportSchema.parse(JSON.parse(await file.text()))
    const runtime = await configStore.connectAndSave(imported.metaConfig, WEB_PEER_IDENTITY)
    adoptWebPeerRuntime(runtime)
    await setLocale(imported.locale)
    Object.assign(metaFormConfig, configStore.metaConfig)
    alert(t('settings.saveSuccess'))
  } catch (error) {
    console.error('Failed to import config:', error)
    alert(t('settings.importError'))
  } finally {
    saving.value = false
  }
  input.value = ''
}
</script>

<template>
  <main class="settings-view">
    <h1 class="settings-view__title">{{ t('settings.title') }}</h1>

    <InkForm layout="col" class="settings-view__form" @submit="onSave">
      <h2 class="settings-view__section-title">
        {{ t('settings.metaConfig') }}
      </h2>
      <InkInput
        v-model="metaFormConfig.INKCRE_PGREST_URL"
        :label="t('settings.pgrestUrl')"
        placeholder="https://..."
      />
      <InkInput
        v-model="metaFormConfig.INKCRE_JWT_SECRET"
        :label="t('settings.jwtSecret')"
        native-type="password"
        autocomplete="off"
        placeholder="••••••••"
      />

      <div class="settings-view__identity">
        <span>{{ t('settings.peerId') }}</span>
        <code>{{ metaFormConfig.INKCRE_PEER_ID }}</code>
      </div>

      <label class="settings-view__locale">
        <span>{{ t('settings.languageLabel') }}</span>
        <select v-model="currentLocale">
          <option v-for="locale in SUPPORT_LOCALES" :key="locale" :value="locale">
            {{ LOCALE_NAMES[locale] }}
          </option>
        </select>
      </label>

      <div class="settings-view__actions">
        <InkButton
          :text="t('settings.saveConfig')"
          theme="primary"
          :disabled="formBusy"
          :is-loading="saving"
          native-type="submit"
        />

        <InkDoubleCheck
          :title="t('settings.resetConfirmTitle')"
          :message="t('settings.resetConfirmMessage')"
          @confirm="onReset"
        >
          <InkButton :text="t('settings.resetConfig')" theme="danger" />
        </InkDoubleCheck>

        <InkButton :text="t('settings.exportConfig')" @click="onExport" />
        <InkButton :text="t('settings.importConfig')" :disabled="formBusy" @click="onImport" />
      </div>
      <p class="settings-view__export-note">{{ t('settings.exportIncludesSecret') }}</p>

      <input
        ref="fileInput"
        type="file"
        accept=".json"
        style="display: none"
        @change="onFileSelected"
      />
    </InkForm>
  </main>
</template>

<style lang="scss" scoped src="./settings.scss"></style>
