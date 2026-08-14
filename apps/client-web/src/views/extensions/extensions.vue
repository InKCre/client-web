<script setup lang="ts">
import { onMounted, ref } from 'vue'
import extensionCard from '@/components/extension/extensionCard/extensionCard.vue'
import installExtension from '@/components/extension/installExtension/installExtension.vue'
import { InkLoading } from '@inkcre/ui-web'
import { configStore, type InstalledExtension } from '@inkcre/core'
import { getExtensionHost, startExtensionHost } from '@/core'
import { useI18n } from 'vue-i18n'

// --- data ---
const { t } = useI18n()
const currentPeerId = configStore.metaConfig.client_id
const extensions = ref<InstalledExtension[]>([])
const extensionsLoading = ref(false)
const error = ref<string | null>(null)

const isEnabledForCurrentPeer = (extension: InstalledExtension) =>
  currentPeerId ? extension.enabled.includes(currentPeerId) : false

const refreshExtensions = async () => {
  extensionsLoading.value = true
  error.value = null
  try {
    extensions.value = await getExtensionHost().list()
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : String(cause)
  } finally {
    extensionsLoading.value = false
  }
}

onMounted(async () => {
  try {
    await startExtensionHost()
  } catch {
    // The app shell owns runtime-startup reporting. The installed list remains a
    // useful recovery surface even when one enabled Extension fails to start.
  }
  await refreshExtensions()
})

// --- methods ---
const onInstallExtension = () => {
  void refreshExtensions()
}

const updExtension = (updatedExtension: InstalledExtension) => {
  extensions.value = extensions.value.map((extension) =>
    extension.name === updatedExtension.name ? updatedExtension : extension
  )
}
</script>

<template>
  <main class="extensions-view">
    <installExtension @install="onInstallExtension" />

    <div class="extensions-view__list">
      <div v-if="extensionsLoading" class="flex items-center justify-center">
        <InkLoading />
      </div>
      <p v-else-if="error" class="extensions-view__error">{{ error }}</p>
      <extensionCard
        v-for="extension in extensions"
        v-else
        :key="extension.name"
        :extension="extension"
        :enabled="isEnabledForCurrentPeer(extension)"
        @changed="refreshExtensions"
        @updated="updExtension"
        @uninstalled="refreshExtensions"
      />
    </div>
  </main>
</template>

<style lang="scss" scoped src="./extensions.scss" />
