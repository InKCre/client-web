<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { InkButton, InkSwitch, InkDialog, InkJsonEditor } from '@inkcre/ui-web'
import { extensionCardProps, extensionCardEmits } from './extensionCard'

const props = defineProps(extensionCardProps)
const emit = defineEmits(extensionCardEmits)
const { t } = useI18n()

// --- data ---
const configPopupOpen = ref<boolean | Promise<boolean>>(false)
const togglePromise = ref<Promise<boolean> | null>(null)

// --- computed ---
const configModel = computed({
  get: () => {
    return JSON.stringify(props.extension.config ?? {}, null, 2)
  },
  set: (newValue: string) => {
    props.extension.config = JSON.parse(newValue)
  },
})

const toggleModel = computed({
  get: () => {
    return togglePromise.value
      ? togglePromise.value
      : props.extension.isEnabledForPeer(props.peerId)
  },
  set: async (newValue: boolean) => {
    togglePromise.value = (async () => {
      if (props.extension.isEnabledForPeer(props.peerId)) {
        await props.extension.disableForPeer(props.peerId)
      } else {
        await props.extension.enableForPeer(props.peerId)
      }
      emit('toggle', props.extension)
      togglePromise.value = null
      return props.extension.isEnabledForPeer(props.peerId)
    })()
  },
})

const onEditConfigClick = () => {
  configPopupOpen.value = true
}

const onConfirmConfig = () => {
  if (props.extension) {
    configPopupOpen.value = (async () => {
      try {
        const updatedExtension = await props.extension.updateConfig(props.peerId)
        emit('edit-config', updatedExtension)
        return false // close dialog
      } catch (error) {
        // JSON parsing error - keep dialog open
        console.error('Invalid JSON config:', error)
        return true // keep dialog open on error
      }
    })()
  }
}
</script>

<template>
  <div v-if="extension" class="extension-card">
    <div class="extension-card__header">
      <div class="flex flex-col">
        <div v-if="extension.nickname" class="extension-card__nickname">
          {{ extension.nickname }}
        </div>
        <div class="flex flex-row items-center gap-2">
          <span class="extension-card__id">{{ extension.id }}</span>
          <span class="extension-card__version">v{{ extension.version }}</span>
        </div>
      </div>
      <InkSwitch v-model="toggleModel" size="xs" />
    </div>

    <div class="extension-card__actions">
      <InkButton @click="onEditConfigClick" :text="t('extension.editConfig')" size="sm" />
    </div>

    <InkDialog
      v-model="configPopupOpen"
      :title="t('extension.editConfigTitle')"
      @confirm="onConfirmConfig"
    >
      <InkJsonEditor v-model="configModel" :schema="extension.config_schema ?? undefined" />
    </InkDialog>
  </div>
</template>

<style lang="scss" scoped src="./extensionCard.scss" />
