<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { InkForm, InkJsonEditor } from '@inkcre/ui-web'
import { collectJobFormProps, collectJobFormEmits } from './collectJobForm'

const props = defineProps(collectJobFormProps)
const emit = defineEmits(collectJobFormEmits)
const { t } = useI18n()

const configJson = computed<string>({
  get: () => {
    return JSON.stringify(props.modelValue.config || {}, null, 2)
  },
  set: (newVal: string) => {
    props.modelValue.config = JSON.parse(newVal)
  },
})
</script>

<template>
  <InkForm class="collect-job-form">
    <InkJsonEditor
      v-model="configJson"
      :label="t('collectJob.config')"
      :placeholder="t('source.configPlaceholder')"
      :rows="6"
    />
  </InkForm>
</template>

<style lang="scss" scoped src="./collectJobForm.scss" />
