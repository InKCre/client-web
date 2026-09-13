<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  InkInput,
  InkJsonEditor,
  InkDropdown,
  type DropdownOption,
  type JsonEditorValidation,
  InkForm,
} from '@inkcre/ui-web'
import { sourceFormProps, sourceFormEmits } from './sourceForm'
import { SourceType } from '@inkcre/core'
import { useI18n } from 'vue-i18n'

const props = defineProps(sourceFormProps)
const emit = defineEmits(sourceFormEmits)
const { t } = useI18n()

// --- data ---
const sourceTypes = ref<(DropdownOption & SourceType)[]>([])

const configJson = ref(JSON.stringify(props.modelValue.config, null, 2))
const validation = ref<JsonEditorValidation>()
const canSave = computed(
  () =>
    validation.value?.status === 'valid' &&
    validation.value.text === configJson.value &&
    Boolean(props.modelValue.type)
)
watch(
  () => props.modelValue,
  (source) => {
    configJson.value = JSON.stringify(source.config, null, 2)
    validation.value = undefined
  }
)
function readConfig(): unknown {
  if (!canSave.value) throw new Error(t('common.invalidConfig'))
  return JSON.parse(configJson.value)
}
defineExpose({ canSave, readConfig })

const currentSourceType = computed(() => {
  return sourceTypes.value.find((type) => type.value === props.modelValue.type)
})

// --- methods ---
const loadSourceTypes = async (): Promise<(DropdownOption & SourceType)[]> => {
  const result = await SourceType.getAll()
  return result.map((type) => ({
    label: type.id,
    value: type.id,
    ...type,
  }))
}
</script>

<template>
  <InkForm class="source-form" layout="col">
    <InkInput v-model="modelValue.nickname" :label="t('source.nickname')" :disabled="disabled" />

    <InkDropdown
      v-model="modelValue.type"
      v-model:options="sourceTypes"
      :refresher="loadSourceTypes"
      :label="t('source.type')"
      :disabled="disabled"
    />

    <InkJsonEditor
      v-model="configJson"
      :schema="currentSourceType?.config_schema"
      :label="t('source.config')"
      :placeholder="t('source.configPlaceholder')"
      :rows="6"
      :disabled="disabled"
      @validation="validation = $event"
    />
  </InkForm>
</template>

<style lang="scss" scoped src="./sourceForm.scss" />
