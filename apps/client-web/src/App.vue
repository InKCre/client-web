<script setup lang="ts">
import { computed, ref, provide, watchEffect, watch, onMounted } from 'vue'
import { InkButton, InkHeader, InkLoading } from '@inkcre/ui-web'
import AppSidePanel from './components/common/AppSidePanel/AppSidePanel.vue'
import router from './router'
import { createInkRouterAdapter } from './router'
import { INK_ROUTER_KEY } from '@inkcre/ui-web'
import { useRoute } from 'vue-router'
import RecallSearch from './components/recall/RecallSearch.vue'
import { useI18n } from 'vue-i18n'
import { configStore } from '@inkcre/core'
import {
  currentWebPeer,
  extensionHostConnectionReady,
  webPeerConnectionState,
  initializeCore,
  shouldLoadPeerConfigAtBootstrap,
  startExtensionHost,
  shutdownCore,
} from './core'
import { pageObjectTitle } from './composables/use-page-object-title'

const route = useRoute()
const { t } = useI18n()
const startupState = ref<'loading' | 'ready' | 'failed'>('loading')
const connectionNoticeKey = computed(() => {
  if (webPeerConnectionState.value === 'failed') return 'startup.peerFailed'
  if (webPeerConnectionState.value === 'disabled') return 'startup.peerDisabled'
  return 'startup.peerConnecting'
})
const reload = () => window.location.reload()

onMounted(async () => {
  const loadPeerConfig = shouldLoadPeerConfigAtBootstrap(window.location.pathname)
  try {
    await initializeCore({ loadPeerConfig })
  } catch (error) {
    console.error('[Core] Startup failed:', error)
    startupState.value = 'failed'
    return
  }
  startupState.value = 'ready'

  window.addEventListener('beforeunload', () => {
    // Browsers may end the page before cleanup completes, but never deliberately
    // dispose Extension resources while our Job handlers are still draining.
    void shutdownCore().catch((error: unknown) => console.error('[Core] Shutdown failed', error))
  })
})

watch([startupState, extensionHostConnectionReady], ([startup, connectionReady]) => {
  if (startup !== 'ready' || !connectionReady) return
  void startExtensionHost().catch((error: unknown) => {
    console.error('[Web Extension Host] Startup failed:', error)
  })
})

const pageLabel = computed(() =>
  t(typeof route.meta.titleKey === 'string' ? route.meta.titleKey : 'sidePanel.infoBase')
)
provide(INK_ROUTER_KEY, createInkRouterAdapter(router, route))
watchEffect(() => {
  const parts: string[] = []
  const objectTitle =
    pageObjectTitle.value?.path === route.fullPath ? pageObjectTitle.value.value : undefined
  if (route.name === 'Source')
    parts.push(objectTitle || `${t('navigation.source')} #${route.params.id}`, pageLabel.value)
  else if (route.name === 'Job') parts.push(`${t('navigation.job')} #${route.params.id}`)
  else if (route.name === 'Extensions')
    parts.push(...(objectTitle ? [objectTitle] : []), pageLabel.value)
  else if (route.params.block || route.params.relation) {
    const kind = route.params.relation
      ? 'relation'
      : String(route.name).endsWith('SolvedContent')
        ? 'content'
        : 'block'
    parts.push(`${t(`navigation.${kind}`)} #${route.params.relation || route.params.block}`)
    if (route.path.startsWith('/info-base/graph')) parts.push(t('navigation.graph'))
  } else if (route.name !== 'InfoBaseListOverview' && route.name) parts.push(pageLabel.value)
  else if (
    configStore.metaConfig.INKCRE_PGREST_URL &&
    currentWebPeer.value?.id === configStore.metaConfig.INKCRE_PEER_ID &&
    currentWebPeer.value.name
  )
    parts.push(currentWebPeer.value.name)
  document.title = [...parts, 'InKCre'].join(' - ')
})

// --- data ---
const sidebarExpanded = ref(false)
</script>

<template>
  <div class="app">
    <InkHeader
      title="InKCre"
      :page-title="pageLabel"
      logo-src="/logo/32.svg"
      @menu-click="sidebarExpanded = !sidebarExpanded"
      @title-click="startupState === 'ready' && router.push('/')"
    />
    <div
      v-if="
        startupState === 'ready' &&
        ['connecting', 'disabled', 'failed'].includes(webPeerConnectionState)
      "
      class="app-connection"
      :role="webPeerConnectionState === 'failed' ? 'alert' : 'status'"
    >
      <span>{{ t(connectionNoticeKey) }}</span>
      <InkButton v-if="webPeerConnectionState === 'failed'" @click="reload">
        {{ t('common.retry') }}
      </InkButton>
      <a href="/settings">{{ t('common.settings') }}</a>
    </div>
    <div class="app-content">
      <router-view v-if="startupState === 'ready'" />
      <main v-else class="app-startup">
        <InkLoading v-if="startupState === 'loading'" :label="t('startup.loading')" />
        <p v-else role="alert">{{ t('startup.failed') }}</p>
        <div class="app-startup__actions">
          <InkButton v-if="startupState === 'failed'" @click="reload">
            {{ t('common.retry') }}
          </InkButton>
          <!-- Full navigation opens Settings' recovery bootstrap without the partial runtime. -->
          <a href="/settings">{{ t('common.settings') }}</a>
        </div>
      </main>
      <AppSidePanel v-model:expanded="sidebarExpanded" :ready="startupState === 'ready'" />
    </div>
    <RecallSearch v-if="startupState === 'ready'" />
  </div>
</template>

<style lang="scss" scoped>
@use '@inkcre/ui-web/styles/functions' as *;
@use '@inkcre/ui-web/styles/mixins' as *;

.app-startup {
  box-sizing: border-box;
  flex: 1;
  padding: sys-var(space, lg);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: sys-var(space, md);
  text-align: center;

  p {
    margin: 0;
  }

  &__actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    gap: sys-var(space, md);
  }
}

.app {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.app-connection {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: sys-var(space, sm);
  padding: sys-var(space, sm) sys-var(space, md);
  border-bottom: 1px solid sys-var(color, border, base);
}

.app-content {
  position: relative;
  flex: 1;
  overflow: hidden;
  display: flex;
}
</style>

<style>
.info-base-inspector-surface {
  border: 1px solid var(--sys-color-border-base);
  box-shadow: 0 3px 12px rgb(0 0 0 / 16%);
}

body {
  margin: 0;
  font-family: var(--sys-typo-family-sans);
  font-size: var(--sys-font-body-md-font-size);
  font-weight: var(--sys-font-body-md-font-weight);
  letter-spacing: var(--sys-font-body-md-letter-spacing);
  line-height: var(--sys-font-body-md-line-height);
  color: var(--sys-color-text-base);
  background: var(--sys-color-surface-base);
}

a {
  color: inherit;
}
</style>
