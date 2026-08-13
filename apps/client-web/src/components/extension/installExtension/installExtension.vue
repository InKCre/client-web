<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { InkForm, InkInput, InkButton } from '@inkcre/ui-web'
import { installExtensionEmits } from './installExtension'
import { getExtensionHost } from '@/core'

const emit = defineEmits(installExtensionEmits)
const { t } = useI18n()

// --- data ---
const form = ref({ name: '', version: '' })
const isLoading = ref(false)
const error = ref<string | null>(null)

// --- methods ---
const onSubmit = async () => {
  isLoading.value = true
  try {
    error.value = null
    await getExtensionHost().install(form.value)
    emit('install')
    // Reset form on success
    form.value = { name: '', version: '' }
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : String(cause)
    console.error('Failed to install Registry extension:', cause)
    error.value = message
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="install-extension">
    <h2 class="title">{{ t('extension.installExtensionTitle') }}</h2>

    <InkForm class="form">
      <InkInput
        v-model="form.name"
        :label="t('extension.name')"
        :placeholder="t('extension.namePlaceholder')"
        required
      />
      <InkInput
        v-model="form.version"
        :label="t('extension.version')"
        :placeholder="t('extension.versionPlaceholder')"
        required
      />
    </InkForm>

    <p v-if="error" class="install-extension__error">{{ error }}</p>

    <div class="footer">
      <InkButton
        :text="t('extension.installNew')"
        theme="primary"
        size="md"
        @click="onSubmit"
        :loading="isLoading"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped src="./installExtension.scss" />
