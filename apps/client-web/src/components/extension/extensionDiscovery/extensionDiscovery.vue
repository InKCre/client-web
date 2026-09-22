<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { InkButton, InkDropdown, InkInput, InkLoading, InkPlaceholder } from '@inkcre/ui-web'
import type { InstalledExtension } from '@inkcre/core'
import {
  preferredPublishedRelease,
  sortPublishedReleases,
  type ExtensionRecord,
  type ExtensionSummary,
  type ReleaseRecord,
} from '@inkcre/extension-runtime-client-web'
import { getExtensionHost, getExtensionRegistry } from '@/core'

const props = defineProps<{ installed: InstalledExtension[] }>()
const emit = defineEmits<{ installed: [extension: InstalledExtension] }>()
const { t } = useI18n()

const catalog = ref<ExtensionSummary[]>([])
const catalogLoading = ref(false)
const catalogError = ref<string | null>(null)
const search = ref('')
const selectedName = ref<string | null>(null)
const detail = ref<ExtensionRecord | null>(null)
const detailLoading = ref(false)
const detailError = ref<string | null>(null)
const selectedVersion = ref('')
const installing = ref(false)
const installError = ref<string | null>(null)
let detailRequest = 0

const filteredCatalog = computed(() => {
  const query = search.value.trim().toLocaleLowerCase()
  if (!query) return catalog.value
  return catalog.value.filter(({ name, nickname }) =>
    `${nickname} ${name}`.toLocaleLowerCase().includes(query)
  )
})
const releases = computed(() => sortPublishedReleases(detail.value?.releases ?? []))
const versionOptions = computed(() =>
  releases.value.map((release) => ({
    label: release.version.includes('-')
      ? `${release.version} · ${t('extension.prerelease')}`
      : release.version,
    value: release.version,
    description: distributionLabel(release),
  }))
)
const selectedRelease = computed(
  () => releases.value.find(({ version }) => version === selectedVersion.value) ?? null
)
const installedExtension = computed(
  () => props.installed.find(({ name }) => name === selectedName.value) ?? null
)

function distributionLabel(release: ReleaseRecord): string {
  const hosts = [
    release.python ? t('extension.hostCore') : null,
    release.module_federation ? t('extension.hostWeb') : null,
  ].filter(Boolean)
  return hosts.join(' · ')
}

async function loadCatalog(): Promise<void> {
  catalogLoading.value = true
  catalogError.value = null
  try {
    catalog.value = await getExtensionRegistry().list()
    selectedName.value ??= catalog.value[0]?.name ?? null
  } catch (error) {
    catalog.value = []
    catalogError.value = error instanceof Error ? error.message : String(error)
  } finally {
    catalogLoading.value = false
  }
}

async function loadDetail(name: string | null): Promise<void> {
  const request = ++detailRequest
  detail.value = null
  selectedVersion.value = ''
  detailError.value = null
  installError.value = null
  if (!name) return
  detailLoading.value = true
  try {
    const loaded = await getExtensionRegistry().getExtension(name)
    if (request !== detailRequest) return
    detail.value = loaded
    selectedVersion.value = preferredPublishedRelease(loaded.releases ?? [])?.version ?? ''
  } catch (error) {
    if (request === detailRequest) {
      detailError.value = error instanceof Error ? error.message : String(error)
    }
  } finally {
    if (request === detailRequest) detailLoading.value = false
  }
}

async function install(): Promise<void> {
  if (!selectedName.value || !selectedVersion.value || installing.value) return
  installing.value = true
  installError.value = null
  try {
    const extension = await getExtensionHost().install({
      name: selectedName.value,
      version: selectedVersion.value,
    })
    emit('installed', extension)
  } catch (error) {
    installError.value = error instanceof Error ? error.message : String(error)
  } finally {
    installing.value = false
  }
}

watch(filteredCatalog, (visible) => {
  if (!visible.some(({ name }) => name === selectedName.value)) {
    selectedName.value = visible[0]?.name ?? null
  }
})
watch(selectedName, loadDetail)
onMounted(loadCatalog)
</script>

<template>
  <section class="extension-discovery">
    <div class="extension-discovery__catalog">
      <InkInput
        v-model="search"
        :label="t('extension.searchRegistry')"
        :placeholder="t('extension.searchRegistryPlaceholder')"
      />

      <div v-if="catalogLoading" class="extension-discovery__feedback">
        <InkLoading />
      </div>
      <InkPlaceholder
        v-else-if="catalogError"
        state="error"
        :title="t('extension.registryUnavailable')"
        :description="catalogError"
      >
        <template #actions>
          <InkButton :text="t('common.retry')" @click="loadCatalog" />
        </template>
      </InkPlaceholder>
      <InkPlaceholder v-else-if="catalog.length === 0" :title="t('extension.registryEmpty')" />
      <InkPlaceholder
        v-else-if="filteredCatalog.length === 0"
        :title="t('extension.noSearchResults')"
        :description="t('extension.noSearchResultsDescription', { query: search.trim() })"
      />
      <div v-else class="extension-discovery__results">
        <button
          v-for="extension in filteredCatalog"
          :key="extension.name"
          type="button"
          class="extension-discovery__result"
          :class="{ 'extension-discovery__result--selected': extension.name === selectedName }"
          :aria-pressed="extension.name === selectedName"
          @click="selectedName = extension.name"
        >
          <span class="extension-discovery__nickname">{{ extension.nickname }}</span>
          <span class="extension-discovery__name">{{ extension.name }}</span>
        </button>
      </div>
    </div>

    <div class="extension-discovery__detail">
      <div v-if="detailLoading" class="extension-discovery__feedback">
        <InkLoading />
      </div>
      <InkPlaceholder
        v-else-if="detailError"
        state="error"
        :title="t('extension.releaseUnavailable')"
        :description="detailError"
      >
        <template #actions>
          <InkButton :text="t('common.retry')" @click="loadDetail(selectedName)" />
        </template>
      </InkPlaceholder>
      <InkPlaceholder v-else-if="!detail" :title="t('extension.selectExtension')" />
      <template v-else>
        <header class="extension-discovery__detail-header">
          <div>
            <h2>{{ detail.nickname }}</h2>
            <p>{{ detail.name }}</p>
          </div>
          <span v-if="installedExtension" class="extension-discovery__installed">
            {{ t('extension.installedVersion', { version: installedExtension.version }) }}
          </span>
        </header>

        <div v-if="installedExtension" class="extension-discovery__installed-actions">
          <p>{{ t('extension.alreadyInstalled') }}</p>
          <RouterLink :to="{ path: '/extensions' }">{{ t('extension.manage') }}</RouterLink>
        </div>
        <InkPlaceholder
          v-else-if="releases.length === 0"
          :title="t('extension.noPublishedReleases')"
        />
        <div v-else class="extension-discovery__install">
          <InkDropdown
            v-model="selectedVersion"
            :label="t('extension.version')"
            :options="versionOptions"
            :disabled="installing"
          />
          <InkButton
            theme="primary"
            :text="t('extension.install')"
            :disabled="!selectedRelease"
            :is-loading="installing"
            @click="install"
          />
        </div>
        <p v-if="installError" role="alert" class="extension-discovery__error">
          {{ installError }}
        </p>
      </template>
    </div>
  </section>
</template>

<style lang="scss" scoped src="./extensionDiscovery.scss" />
