<script setup lang="ts">
import { computed, ref, useTemplateRef } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAsyncState } from '@vueuse/core'
import { useEAsyncState } from '@/composables/use-async-state'
import {
  InkLoading,
  InkButton,
  InkDoubleCheck,
  InkPopup,
  InkJsonEditor,
  InkDropdown,
  InkInput,
  type JsonEditorValidation,
} from '@inkcre/ui-web'
import sourceForm from '@/components/source/sourceForm/sourceForm.vue'
import JobCard from '@/components/job/JobCard/JobCard.vue'
import { Cron, CronForm, Job, JobManager, Source, SourceType } from '@inkcre/core'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const sourceId = computed(() => Number(route.params.id))
const newJobPopupOpen = ref(false)
const jobKind = ref<'ordinary' | 'backfill'>('ordinary')
const jobConfig = ref('{}')
const cronSchedule = ref('0 * * * *')
const editor = useTemplateRef('editor')
const sourceSaving = ref(false)
const sourceError = ref('')
const jobValidation = ref<JsonEditorValidation>()
const jobSaving = ref(false)
const jobError = ref('')
const canCreateJob = computed(
  () => jobValidation.value?.status === 'valid' && jobValidation.value.text === jobConfig.value
)

const { state: source } = useEAsyncState(() => Source.get(sourceId.value), null, {
  immediate: true,
  useLast: true,
})
const { state: sourceType } = useEAsyncState(
  async () => (source.value ? SourceType.get(source.value.type) : null),
  null,
  { immediate: true, useLast: true }
)
const {
  state: jobs,
  execute: refetchJobs,
  isLoading: jobsLoading,
} = useAsyncState(() => Job.getBySource(sourceId.value), [], { shallow: false })
const { state: crons, execute: refetchCrons } = useAsyncState(
  () => Cron.getBySource(sourceId.value),
  [],
  { shallow: false }
)

const jobSchema = computed(() =>
  jobKind.value === 'ordinary'
    ? sourceType.value?.collect_config_schema
    : sourceType.value?.backfill_config_schema
)

const onSaveSource = async () => {
  if (sourceSaving.value || !source.value || !editor.value?.canSave) return
  sourceSaving.value = true
  sourceError.value = ''
  try {
    const candidate = Source.parse({ ...source.value, config: editor.value.readConfig() })
    Object.assign(source.value, await candidate.save())
  } catch (cause) {
    sourceError.value = cause instanceof Error ? cause.message : t('common.saveFailed')
  } finally {
    sourceSaving.value = false
  }
}
const onDelete = async () => {
  await source.value?.delete()
  await router.push('/sources')
}
const onNewJob = () => {
  jobKind.value = 'ordinary'
  jobConfig.value = '{}'
  jobValidation.value = undefined
  jobError.value = ''
  newJobPopupOpen.value = true
}
const onCreateJob = async () => {
  if (jobSaving.value || !canCreateJob.value) return
  jobSaving.value = true
  jobError.value = ''
  try {
    const type = jobKind.value === 'ordinary' ? 'core.source.collect.v1' : 'core.source.backfill.v1'
    const job = await JobManager.create(type, {
      source: sourceId.value,
      config: JSON.parse(jobConfig.value),
    })
    newJobPopupOpen.value = false
    await refetchJobs()
    await router.push(`/jobs/${job.id}`)
  } catch (cause) {
    jobError.value = cause instanceof Error ? cause.message : t('common.saveFailed')
  } finally {
    jobSaving.value = false
  }
}
const onCreateCron = async () => {
  await new CronForm({
    schedule: cronSchedule.value,
    enabled: true,
    job_type: 'core.source.collect.v1',
    job_parameters: { source: sourceId.value, config: {} },
    job_timeout_seconds: null,
  }).create()
  await refetchCrons()
}
const onDeleteCron = async (cron: Cron) => {
  await cron.delete()
  await refetchCrons()
}
</script>

<template>
  <main class="source-view">
    <div v-if="!source" class="source-view__loading"><InkLoading /></div>
    <template v-else>
      <section class="source-view__details">
        <div class="details__header">
          <h2 class="details__title">{{ t('source.detailTitle') }}</h2>
        </div>
        <sourceForm
          ref="editor"
          :model-value="source"
          class="overflow-y-auto"
          :disabled="sourceSaving"
        />
        <p v-if="sourceError" role="alert" class="text-feedback-error">{{ sourceError }}</p>
        <div class="details__actions">
          <InkDoubleCheck
            :title="t('source.deleteConfirmTitle')"
            :message="t('source.deleteConfirmMessage')"
            :confirmText="t('common.confirm')"
            :cancelText="t('common.cancel')"
            @confirm="onDelete"
          >
            <InkButton :text="t('source.delete')" theme="danger" size="sm" />
          </InkDoubleCheck>
          <InkButton
            :text="t('common.save')"
            theme="primary"
            size="sm"
            :is-loading="sourceSaving"
            :disabled="!editor?.canSave"
            @click="onSaveSource"
          />
        </div>
      </section>

      <section class="source-view__jobs">
        <div class="jobs__header">
          <h3 class="jobs__title">{{ t('source.jobs') }}</h3>
          <InkButton
            :text="t('source.newJob')"
            theme="primary"
            size="md"
            class="w-full"
            @click="onNewJob"
          />
        </div>
        <div class="flex flex-col gap-2 border-b pb-4">
          <div class="flex gap-2 items-end">
            <InkInput v-model="cronSchedule" label="Cron schedule" />
            <InkButton text="Schedule ordinary collect" theme="subtle" @click="onCreateCron" />
          </div>
          <div v-for="cron in crons" :key="cron.id" class="flex gap-2 items-center text-sm">
            <code>{{ cron.schedule }}</code>
            <span>{{ cron.enabled ? 'enabled' : 'disabled' }}</span>
            <InkButton text="Run now" size="sm" theme="subtle" @click="cron.runNow()" />
            <InkButton text="Delete" size="sm" theme="danger" @click="onDeleteCron(cron)" />
          </div>
        </div>
        <div v-if="jobsLoading" class="jobs__loading"><InkLoading /></div>
        <div v-else-if="jobs.length === 0" class="jobs__empty">
          <span>{{ t('source.noJobs') }}</span>
        </div>
        <div class="jobs__list">
          <JobCard
            v-for="job in jobs"
            :key="job.id"
            :job="job"
            @click="router.push(`/jobs/${job.id}`)"
          />
        </div>
      </section>
    </template>
  </main>

  <InkPopup
    v-model:open="newJobPopupOpen"
    position="center"
    :aria-label="t('source.newJobTitle')"
    :close-on-scrim="!jobSaving"
    :close-on-escape="!jobSaving"
  >
    <div class="new-job-popup">
      <h3 class="new-job-popup__title">{{ t('source.newJobTitle') }}</h3>
      <InkDropdown
        v-model="jobKind"
        :options="[
          { label: 'Ordinary collect', value: 'ordinary' },
          { label: 'Historical backfill', value: 'backfill' },
        ]"
        label="Collection intent"
        :disabled="jobSaving"
      />
      <InkJsonEditor
        v-model="jobConfig"
        :schema="jobSchema ?? undefined"
        :label="t('job.config')"
        :rows="6"
        :disabled="jobSaving"
        @validation="jobValidation = $event"
      />
      <p v-if="jobError" role="alert" class="text-feedback-error">{{ jobError }}</p>
      <div class="new-job-popup__actions">
        <InkButton
          :text="t('common.cancel')"
          theme="subtle"
          :disabled="jobSaving"
          @click="newJobPopupOpen = false"
        />
        <InkButton
          :text="t('common.confirm')"
          theme="primary"
          :disabled="!canCreateJob"
          :is-loading="jobSaving"
          @click="onCreateJob"
        />
      </div>
    </div>
  </InkPopup>
</template>

<style lang="scss" scoped src="./source.scss" />
