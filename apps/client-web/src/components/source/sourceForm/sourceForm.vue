<script setup lang="ts">
import { computed, ref } from 'vue'
import { InkInput, InkJsonEditor, InkDropdown, type DropdownOption, InkForm } from '@inkcre/ui-web'
import { sourceFormProps, sourceFormEmits } from './sourceForm'
import { SourceType } from '@inkcre/core'
import { useI18n } from 'vue-i18n'

const props = defineProps(sourceFormProps)
const emit = defineEmits(sourceFormEmits)
const { t } = useI18n()

// --- data ---
const sourceTypes = ref<(DropdownOption & SourceType)[]>([])

const configJson = computed<string>({
  get: () => {
    return JSON.stringify(props.modelValue.config, null, 2)
  },
  set: (newVal: string) => {
    props.modelValue.config = JSON.parse(newVal)
  },
})

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
  <InkForm class="source-form">
    <InkInput v-model="modelValue.nickname" :label="t('source.nickname')" editable />

    <InkDropdown
      v-model="modelValue.type"
      v-model:options="sourceTypes"
      :refresher="loadSourceTypes"
      :label="t('source.type')"
    />

    <InkJsonEditor
      v-model="configJson"
      :schema="currentSourceType?.config_schema"
      :label="t('source.config')"
      :placeholder="t('source.configPlaceholder')"
      :rows="6"
    />
  </InkForm>
</template>

<style lang="scss" scoped src="./sourceForm.scss" />
