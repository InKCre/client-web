<script setup lang="ts">
import { reactive } from 'vue'
import { InkButton } from '@inkcre/ui-web'
import sourceForm from '../sourceForm/sourceForm.vue'
import { createSourceEmits } from './createSource'
import { CollectAt, SourceForm } from '@inkcre/core'
import { refManualReset } from '@vueuse/core'

const emit = defineEmits(createSourceEmits)

// --- data ---
const form = refManualReset(() =>
  reactive(
    new SourceForm({
      nickname: '',
      type: '',
      config: {},
      collect_at: CollectAt.parse({}),
    })
  )
)

// --- methods ---
const onCreate = () => {
  form.value.create().then(() => {
    emit('create', form.value)
    // Reset form on success
    form.reset()
  })
}
</script>

<template>
  <div class="create-source">
    <h2 class="title">Create Source</h2>

    <sourceForm v-model="form" class="form" />

    <div class="footer">
      <InkButton text="Create" theme="primary" size="md" @click="onCreate" />
    </div>
  </div>
</template>

<style lang="scss" scoped src="./createSource.scss" />
