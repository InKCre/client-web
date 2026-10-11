<script setup lang="ts">
import { watch } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import router from '@/router'
import { appSidePanelProps, appSidePanelEmits } from './AppSidePanel'
import { InkButton } from '@inkcre/ui-web'

const props = defineProps(appSidePanelProps)
const emit = defineEmits(appSidePanelEmits)
const route = useRoute()
const { t } = useI18n()

// --- methods ---
const onSourcesClick = () => {
  router.push('/sources')
}

const onExtensionsClick = () => {
  router.push('/extensions')
}

const onSettingsClick = () => {
  if (!props.ready) window.location.assign('/settings')
  else router.push('/settings')
}

const onPeersClick = () => {
  router.push('/peers')
}

const onExploreClick = () => {
  router.push('/info-base/graph')
}

watch(
  () => route.name,
  () => {
    // Navigation destinations own the primary surface; the menu opens only on explicit request.
    emit('update:expanded', false)
  }
)
</script>

<template>
  <aside class="app-side-panel" v-show="props.expanded">
    <div class="app-side-panel__content">
      <h2 class="app-side-panel__title">{{ t('sidePanel.managing') }}</h2>
      <InkButton
        :text="t('sidePanel.sources')"
        class="w-full"
        :disabled="!props.ready"
        @click="onSourcesClick"
      />
      <InkButton
        :text="t('sidePanel.extensions')"
        class="w-full"
        :disabled="!props.ready"
        @click="onExtensionsClick"
      />
      <InkButton
        :text="t('sidePanel.peers')"
        class="w-full"
        :disabled="!props.ready"
        @click="onPeersClick"
      />
      <InkButton :text="t('sidePanel.settings')" class="w-full" @click="onSettingsClick" />
    </div>

    <div class="app-side-panel__content">
      <h2 class="app-side-panel__title">{{ t('sidePanel.infoBase') }}</h2>
      <InkButton
        :text="t('sidePanel.explore')"
        class="w-full"
        :disabled="!props.ready"
        @click="onExploreClick"
      />
    </div>
  </aside>
</template>

<style lang="scss" scoped src="./AppSidePanel.scss"></style>
