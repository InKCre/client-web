<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { InkForm, InkInput, InkButton, InkDoubleCheck } from '@inkcre/ui-web'
import {
  configStore,
  MetaConfigSchema,
  PeerConfigSchema,
  type MetaConfig,
  type PeerConfig,
} from '@inkcre/core'
import { setLocale, SUPPORT_LOCALES, LOCALE_NAMES, type SupportLocale } from '@/locales'
import i18n from '@/locales'
import PeerList from '@/components/peer/peerList/peerList.vue'
import { adoptWebPeerRuntime, startConfiguredWebPeerRuntime, stopWebPeerRuntime } from '@/core'

const { t } = useI18n()

// Local reactive copy of metaConfig for form editing
const metaFormConfig = reactive<MetaConfig>({ ...configStore.metaConfig })
const peerFormConfig = reactive<PeerConfig>(PeerConfigSchema.parse(configStore.peerConfig))
const allPeersRevision = ref(0)
const peerConfigLoading = ref(false)
const saving = ref(false)
const hasConnectedConfig = computed(
  () =>
    Boolean(configStore.metaConfig.INKCRE_PGREST_URL) &&
    Boolean(configStore.metaConfig.INKCRE_JWT_SECRET)
)
const formBusy = computed(() => peerConfigLoading.value || saving.value)

// Synchronize metaFormConfig with configStore.metaConfig
watch(
  () => configStore.metaConfig,
  (newMetaConfig) => {
    Object.assign(metaFormConfig, newMetaConfig)
  },
  { deep: true }
)
watch(
  () => configStore.peerConfig,
  (newPeerConfig) => Object.assign(peerFormConfig, PeerConfigSchema.parse(newPeerConfig)),
  { deep: true }
)

onMounted(async () => {
  if (!hasConnectedConfig.value) return
  peerConfigLoading.value = true
  try {
    await configStore.loadPeerConfig()
    Object.assign(peerFormConfig, PeerConfigSchema.parse(configStore.peerConfig))
    await startConfiguredWebPeerRuntime()
  } catch (error) {
    console.warn('Configured Web Peer could not start from Settings.', error)
  } finally {
    peerConfigLoading.value = false
  }
})

// Current locale (computed for v-model)
const currentLocale = computed({
  get: () => i18n.global.locale.value as string,
  set: (value: string) => {
    setLocale(value as SupportLocale)
  },
})

// Save config
const onSave = async () => {
  if (formBusy.value) return
  saving.value = true
  try {
    const validatedMeta = MetaConfigSchema.parse(metaFormConfig)
    const validatedPeer = PeerConfigSchema.parse(peerFormConfig)
    const runtime = await configStore.connectAndSave(validatedMeta, validatedPeer)
    adoptWebPeerRuntime(runtime)
    Object.assign(metaFormConfig, configStore.metaConfig)
    Object.assign(peerFormConfig, PeerConfigSchema.parse(configStore.peerConfig))
    allPeersRevision.value += 1
    alert(t('settings.saveSuccess'))
  } catch (error) {
    console.error('Failed to save config:', error)
    alert('Failed to save configuration')
  } finally {
    saving.value = false
  }
}

// Reset config
const onReset = async () => {
  await configStore.resetMeta()
  stopWebPeerRuntime()
  Object.assign(metaFormConfig, configStore.metaConfig)
  Object.assign(peerFormConfig, PeerConfigSchema.parse(configStore.peerConfig))
}

// Export config
const onExport = () => {
  const portableConfig = {
    version: 1,
    containsCredential: false,
    metaConfig: {
      INKCRE_PGREST_URL: configStore.metaConfig.INKCRE_PGREST_URL,
      INKCRE_PEER_ID: configStore.metaConfig.INKCRE_PEER_ID,
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
  if (formBusy.value) return
  fileInput.value?.click()
}

const onFileSelected = async (event: Event) => {
  if (formBusy.value) return
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = async (e) => {
    if (formBusy.value) return
    saving.value = true
    try {
      const content = e.target?.result as string
      const imported = JSON.parse(content)
      const validated = MetaConfigSchema.parse({
        ...configStore.metaConfig,
        ...imported.metaConfig,
      })
      const runtime = await configStore.connectAndSave(
        validated,
        PeerConfigSchema.parse(peerFormConfig)
      )
      adoptWebPeerRuntime(runtime)
      Object.assign(metaFormConfig, configStore.metaConfig)
      Object.assign(peerFormConfig, PeerConfigSchema.parse(configStore.peerConfig))
      allPeersRevision.value += 1
      alert(t('settings.saveSuccess'))
    } catch (error) {
      console.error('Failed to import config:', error)
      alert(t('settings.importError'))
    } finally {
      saving.value = false
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

      <div class="settings-view__identity">
        <span>{{ t('settings.peerId') }}</span>
        <code>{{ metaFormConfig.INKCRE_PEER_ID }}</code>
        <small>{{ t('settings.peerIdGenerated') }}</small>
      </div>

      <h2 class="settings-view__section-title">{{ t('settings.peerConfig') }}</h2>
      <p class="settings-view__notice">{{ t('settings.peerConfigNotice') }}</p>
      <InkInput
        v-model="peerFormConfig.extension_registry_url"
        :label="t('settings.extensionRegistryUrl')"
        placeholder="https://registry.inkcre.dev"
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
      <InkButton
        :text="t('settings.saveConfig')"
        theme="primary"
        :disabled="formBusy"
        :loading="saving"
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
      <InkButton :text="t('settings.importConfig')" :disabled="formBusy" @click="onImport" />
    </div>
    <p class="settings-view__export-note">{{ t('settings.exportExcludesSecret') }}</p>

    <PeerList v-if="hasConnectedConfig" :key="allPeersRevision" />

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
