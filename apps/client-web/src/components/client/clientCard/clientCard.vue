<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { InkButton, InkInput, InkDialog, InkJsonEditor } from '@inkcre/ui-web'
import { APIError, Client } from '@inkcre/core'
import { clientCardProps, clientCardEmits } from './clientCard'

const props = defineProps(clientCardProps)
const emit = defineEmits(clientCardEmits)

const { t } = useI18n()

const configPopupOpen = ref(false)
const configModel = ref('')
const clientSaving = ref(false)

const isJsonObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

const saveClient = async () => {
  clientSaving.value = true
  try {
    const updatedClient = Client.parse({
      ...props.client,
      rest_api_url: props.client.rest_api_url || null,
    })
    const response = await Client.dbApi
      .update({
        name: updatedClient.name,
        rest_api_url: updatedClient.rest_api_url,
      })
      .eq('id', props.client.id)
      .select()
      .single()
    if (response.error) {
      throw new APIError(
        `Client update failed: ${response.error.message}`,
        response.status,
        response.error
      )
    }
    emit('updated')
  } catch (error) {
    console.error('Failed to update client:', error)
    alert(error instanceof Error ? error.message : t('settings.saveError'))
  } finally {
    clientSaving.value = false
  }
}

const onEditConfigClick = () => {
  configModel.value = JSON.stringify(props.client.config ?? {}, null, 2)
  configPopupOpen.value = true
}

const onConfirmConfig = async () => {
  const previousConfig = props.client.config
  try {
    const nextConfig: unknown = JSON.parse(configModel.value)
    if (!isJsonObject(nextConfig)) {
      throw new TypeError('Client configuration must be a JSON object.')
    }
    props.client.config = nextConfig
    await props.client.saveConfig()
    emit('updated')
    configPopupOpen.value = false
  } catch (error) {
    props.client.config = previousConfig
    console.error('Failed to update client config:', error)
    alert(error instanceof Error ? error.message : t('settings.saveError'))
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
  <div class="client-card">
    <div class="client-card__item-info">
      <InkInput v-model="client.name" type="inline" />
      <span class="client-card__item-id">{{ client.id }}</span>
      <InkInput v-model="client.rest_api_url" type="inline" />
      <div class="client-card__edit-actions">
        <InkButton
          :text="t('settings.saveConfig')"
          size="sm"
          :loading="clientSaving"
          @click="saveClient"
        />
        <InkButton :text="t('settings.clientConfig')" size="sm" @click="onEditConfigClick" />
      </div>
    </div>
    <span :class="['client-card__item-status', `client-card__item-status--${status}`]">
      {{ getStatusText(status) }}
    </span>

    <InkDialog
      v-model="configPopupOpen"
      :title="t('settings.clientConfig')"
      @confirm="onConfirmConfig"
    >
      <InkJsonEditor v-model="configModel" />
    </InkDialog>
  </div>
</template>

<style lang="scss" scoped src="./clientCard.scss" />
