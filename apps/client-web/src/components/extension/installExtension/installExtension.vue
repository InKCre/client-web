<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { InkForm, InkInput, InkButton } from '@inkcre/ui-web'
import { installExtensionEmits, installExtensionProps } from './installExtension'

const props = defineProps(installExtensionProps)
const emit = defineEmits(installExtensionEmits)
const { t } = useI18n()

// --- data ---
const form = ref({ name: '', version: '' })
const isLoading = ref(false)
const error = ref<string | null>(null)

// --- methods ---
const onSubmit = async () => {
  if (isLoading.value || props.disabled) return
  isLoading.value = true
  emit('busy', true)
  try {
    error.value = null
    await props.install({ name: form.value.name.trim(), version: form.value.version.trim() })
    emit('install')
    // Reset form on success
    form.value = { name: '', version: '' }
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : String(cause)
    error.value = message
  } finally {
    isLoading.value = false
    emit('busy', false)
  }
}
</script>

<template>
  <div class="install-extension">
    <h2 class="title">{{ t('extension.installExtensionTitle') }}</h2>

    <InkForm class="form" layout="col" @submit="onSubmit">
      <InkInput
        v-model="form.name"
        :label="t('extension.name')"
        :placeholder="t('extension.namePlaceholder')"
        :disabled="isLoading"
        required
      />
      <InkInput
        v-model="form.version"
        :label="t('extension.version')"
        :placeholder="t('extension.versionPlaceholder')"
        :disabled="isLoading"
        required
      />

      <p v-if="error" role="alert" class="install-extension__error">{{ error }}</p>

      <div class="footer">
        <InkButton
          :text="t('extension.installNew')"
          theme="primary"
          size="md"
          native-type="submit"
          :is-loading="isLoading"
          :disabled="disabled"
        />
      </div>
    </InkForm>
  </div>
</template>

<style lang="scss" scoped src="./installExtension.scss" />
