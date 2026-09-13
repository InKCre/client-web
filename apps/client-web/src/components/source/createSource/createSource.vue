<script setup lang="ts">
import { reactive, ref, useTemplateRef } from 'vue'
import { InkButton } from '@inkcre/ui-web'
import sourceForm from '../sourceForm/sourceForm.vue'
import { createSourceEmits } from './createSource'
import { SourceForm } from '@inkcre/core'
import { refManualReset } from '@vueuse/core'
import { useI18n } from 'vue-i18n'

const emit = defineEmits(createSourceEmits)
const { t } = useI18n()
const editor = useTemplateRef('editor')
const saving = ref(false)
const error = ref('')

// --- data ---
const form = refManualReset(() =>
  reactive(
    new SourceForm({
      nickname: '',
      type: '',
      config: {},
      state: {},
      storage: null,
    })
  )
)

// --- methods ---
const onCreate = async () => {
  if (saving.value || !editor.value?.canSave) return
  saving.value = true
  error.value = ''
  try {
    const candidate = SourceForm.parse({ ...form.value, config: editor.value.readConfig() })
    const created = await candidate.create()
    emit('create', created)
    form.reset()
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : t('common.saveFailed')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="create-source">
    <h2 class="title">Create Source</h2>

    <sourceForm ref="editor" v-model="form" class="form" :disabled="saving" />
    <p v-if="error" role="alert" class="text-feedback-error">{{ error }}</p>

    <div class="footer">
      <InkButton
        text="Create"
        theme="primary"
        size="md"
        :is-loading="saving"
        :disabled="!editor?.canSave"
        @click="onCreate"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped src="./createSource.scss" />
