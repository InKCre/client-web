<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { InkButton, InkInput, InkPopup, InkJsonEditor, InkDoubleCheck } from '@inkcre/ui-web'
import { sourceCardEmits, type SourceCardProps } from './sourceCard'
import { Job, JobManager, JobStatus, Source, SourceType } from '@inkcre/core'
import { computedAsync } from '@vueuse/core'

const props = defineProps<SourceCardProps>()
const emit = defineEmits(sourceCardEmits)
const { t } = useI18n()
const router = useRouter()

// --- data ---
const sourceData = computedAsync(
  async (): Promise<Source> => {
    if (props.source) {
      return props.source
    } else if (props.sourceId) {
      return await Source.get(props.sourceId)
    }
    throw new Error("Either 'source' or 'sourceId' must be provided")
  },
  undefined,
  { shallow: false }
)
const sourceType = computedAsync(
  async (): Promise<SourceType | undefined> => {
    if (sourceData.value?.type) {
      return await SourceType.get(sourceData.value.type)
    }
    return undefined
  },
  undefined,
  { shallow: false }
)
const latestOpenJob = computedAsync(
  async (): Promise<Job | null> => {
    if (sourceData.value?.id) {
      const jobs = await Job.getBySource(sourceData.value.id)
      return (
        jobs.find((job) => job.status === JobStatus.PENDING || job.status === JobStatus.RUNNING) ??
        null
      )
    }
    return null
  },
  null,
  { shallow: true }
)
const configPopupOpen = ref(false)
const configModel = ref('')
const nicknameModel = ref('')

// --- watchers ---
watch(
  () => sourceData.value?.nickname,
  (newVal) => {
    nicknameModel.value = newVal || ''
  },
  { immediate: true }
)

// --- computed ---
const formattedConfig = computed(() => {
  return JSON.stringify(sourceData.value?.config || {}, null, 2)
})

// --- methods ---
const onNicknameSave = (newNickname: string) => {
  if (sourceData.value) {
    sourceData.value.nickname = newNickname
    sourceData.value.save()
  }
}

const onEditConfig = () => {
  configModel.value = formattedConfig.value
  configPopupOpen.value = true
}

const onRunNow = async () => {
  const job = await JobManager.create('core.source.collect.v1', {
    source: sourceData.value!.id,
    config: {},
  })
  router.push(`/jobs/${job.id}`)
}

const onDelete = () => {
  emit('delete', sourceData.value!)
}

const onCheckOpenJob = () => {
  if (latestOpenJob.value) {
    router.push(`/jobs/${latestOpenJob.value.id}`)
  }
}

const onCardClick = () => {
  if (sourceData.value) {
    router.push(`/sources/${sourceData.value.id}`)
  }
}

const onConfirmConfig = () => {
  try {
    const parsedConfig = JSON.parse(configModel.value)
    sourceData.value!.config = parsedConfig
    sourceData.value!.save()
    configPopupOpen.value = false
  } catch (error) {
    // Handle JSON parse error, maybe show a toast or something
    console.error('Invalid JSON:', error)
  }
}
</script>

<template>
  <div v-if="sourceData" class="source-card" @click="onCardClick">
    <div class="source-card__metadata">
      <div class="source-card__left">
        <span class="source-card__type">{{ sourceData.type }}</span>
        <InkInput
          :modelValue="nicknameModel"
          type="inline"
          placeholder="Click to edit nickname"
          @click.stop
          @update:modelValue="
            (value: string) => {
              nicknameModel = value
              onNicknameSave(value)
            }
          "
        >
          <span class="source-card__nickname">{{ nicknameModel }}</span>
        </InkInput>
      </div>
      <div class="source-card__right">
        <span class="source-card__id-label">#</span>
        <span class="source-card__id">{{ sourceData.id }}</span>
      </div>
    </div>

    <div class="source-card__config">
      <pre class="source-card__config-text">{{ formattedConfig }}</pre>
    </div>

    <div v-if="latestOpenJob" class="source-card__open-job" @click.stop="onCheckOpenJob">
      {{ t('source.checkOpenJob') }}
    </div>

    <div class="source-card__operations" @click.stop>
      <div class="source-card__operations-left">
        <InkDoubleCheck
          :title="t('source.deleteConfirmTitle')"
          :message="t('source.deleteConfirmMessage')"
          :confirmText="t('common.confirm')"
          :cancelText="t('common.cancel')"
          @confirm="onDelete"
        >
          <InkButton text="Delete" theme="danger" size="sm" />
        </InkDoubleCheck>
      </div>
      <div class="source-card__operations-right">
        <InkButton text="Edit Config" theme="subtle" size="sm" @click="onEditConfig" />
        <InkButton text="Run Now" theme="subtle" size="sm" @click="onRunNow" />
      </div>
    </div>
  </div>

  <InkPopup v-model:open="configPopupOpen" position="center">
    <div class="config-editor">
      <h3 class="config-editor__title">Edit Config</h3>
      <InkJsonEditor
        v-model="configModel"
        :schema="sourceType?.config_schema"
        placeholder="Enter JSON config..."
        :rows="6"
      />
      <div class="config-editor__actions">
        <InkButton text="Cancel" theme="subtle" @click="configPopupOpen = false" />
        <InkButton text="Confirm" theme="primary" @click="onConfirmConfig" />
      </div>
    </div>
  </InkPopup>
</template>

<style lang="scss" scoped src="./sourceCard.scss" />
