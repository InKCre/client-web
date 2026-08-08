<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { InkButton, InkDialog, InkInput, InkJsonEditor } from '@inkcre/ui-web'
import { peerCardEmits, peerCardProps } from './peerCard'

const props = defineProps(peerCardProps)
const emit = defineEmits(peerCardEmits)
const { t } = useI18n()

const configPopupOpen = ref(false)
const configModel = computed({
  get: () => JSON.stringify(props.peer.config ?? {}, null, 2),
  set: (newValue: string) => {
    props.peer.config = JSON.parse(newValue)
  },
})

const savePeer = async () => {
  try {
    await props.peer.save()
    emit('updated')
  } catch (error) {
    console.error('Failed to update Peer:', error)
    alert('Failed to update client')
  }
}

const onConfirmConfig = async () => {
  try {
    await props.peer.saveConfig()
    emit('updated')
    configPopupOpen.value = false
  } catch (error) {
    console.error('Failed to update Peer config:', error)
    alert('Failed to update client config')
  }
}

const getStatusText = (status: 'online' | 'offline' | 'unknown') => {
  const statusMap = {
    online: t('client.statusOnline'),
    offline: t('client.statusOffline'),
    unknown: t('client.statusUnknown'),
  }
  return statusMap[status]
}
</script>

<template>
  <div class="peer-card">
    <div class="peer-card__item-info">
      <InkInput v-model="peer.name" type="inline" @confirm="savePeer" />
      <span class="peer-card__item-id">{{ peer.id }}</span>
      <span class="peer-card__item-capabilities">
        {{ peer.capabilities.length }} capabilities
      </span>
      <InkButton :text="t('client.editConfig')" size="sm" @click="configPopupOpen = true" />
    </div>
    <span :class="['peer-card__item-status', `peer-card__item-status--${status}`]">
      {{ getStatusText(status) }}
    </span>

    <InkDialog
      v-model="configPopupOpen"
      :title="t('client.editConfigTitle')"
      @confirm="onConfirmConfig"
    >
      <InkJsonEditor v-model="configModel" :schema="peer.config_schema" />
    </InkDialog>
  </div>
</template>

<style lang="scss" scoped src="./peerCard.scss" />
