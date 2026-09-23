<script setup lang="ts">
import { computed, ref, provide, watchEffect } from 'vue'
import { InkHeader } from '@inkcre/ui-web'
import AppSidePanel from './components/common/AppSidePanel/AppSidePanel.vue'
import router from './router'
import { createInkRouterAdapter } from './router'
import { INK_ROUTER_KEY } from '@inkcre/ui-web'
import { useRoute } from 'vue-router'
import RecallSearch from './components/recall/RecallSearch.vue'
import { useI18n } from 'vue-i18n'
import { configStore } from '@inkcre/core'
import { currentWebPeer } from './core'
import { pageObjectTitle } from './composables/use-page-object-title'

const route = useRoute()
const { t } = useI18n()
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
      @title-click="router.push('/')"
    />
    <div class="app-content">
      <router-view />
      <AppSidePanel v-model:expanded="sidebarExpanded" />
    </div>
    <RecallSearch />
  </div>
</template>

<style lang="scss" scoped>
.app {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.app-content {
  position: relative;
  flex: 1;
  overflow: hidden;
  display: flex;
}
</style>

<style>
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
