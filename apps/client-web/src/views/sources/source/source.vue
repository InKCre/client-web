<script setup lang="ts">
import { computed, ref, useTemplateRef, watch } from 'vue'
import {
  RouterLink,
  onBeforeRouteLeave,
  onBeforeRouteUpdate,
  useRoute,
  useRouter,
} from 'vue-router'
import { useI18n } from 'vue-i18n'
import {
  InkLoading,
  InkSkeleton,
  InkButton,
  InkDialog,
  InkPopup,
  InkJsonEditor,
  InkDropdown,
  InkInput,
  InkForm,
  type JsonEditorValidation,
} from '@inkcre/ui-web'
import SourceForm from '@/components/source/sourceForm/sourceForm.vue'
import JobCard from '@/components/job/JobCard/JobCard.vue'
import { Cron, CronForm, Job, JobManager, Source } from '@inkcre/core'
import { usePageObjectTitle } from '@/composables/use-page-object-title'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const sourceId = computed(() => Number(route.params.id))
const source = ref<Source | null>(null)
usePageObjectTitle(
  computed(() =>
    source.value?.id === sourceId.value ? source.value.nickname || undefined : undefined
  )
)
const draft = ref<Source | null>(null)
const editor = useTemplateRef('editor')
const sourceLoading = ref(false)
const sourceLoadError = ref(false)
const sourceSaving = ref(false)
const sourceError = ref('')
const sourceSaved = ref(false)
const deleteOpen = ref(false)
const sourceDeleting = ref(false)
const deleteError = ref('')
const jobs = ref<Job[]>([])
const jobsLoading = ref(false)
const jobsError = ref(false)
const crons = ref<Cron[]>([])
const cronsLoading = ref(false)
const cronsError = ref(false)
let sourceRequest = 0
let jobsRequest = 0
let cronsRequest = 0

// Each region loads independently; late responses must not replace another source's context.
async function loadSource() {
  const request = ++sourceRequest
  sourceLoading.value = true
  sourceLoadError.value = false
  try {
    const loaded = await Source.get(sourceId.value)
    if (request !== sourceRequest) return
    source.value = loaded
    draft.value = Source.parse(loaded)
  } catch {
    if (request === sourceRequest) sourceLoadError.value = true
  } finally {
    if (request === sourceRequest) sourceLoading.value = false
  }
}
async function loadJobs() {
  const request = ++jobsRequest
  jobsLoading.value = true
  jobsError.value = false
  try {
    const loaded = await Job.getBySource(sourceId.value)
    if (request === jobsRequest) jobs.value = loaded
  } catch {
    if (request === jobsRequest) jobsError.value = true
  } finally {
    if (request === jobsRequest) jobsLoading.value = false
  }
}
async function loadCrons() {
  const request = ++cronsRequest
  cronsLoading.value = true
  cronsError.value = false
  try {
    const loaded = await Cron.getBySource(sourceId.value)
    if (request === cronsRequest) crons.value = loaded
  } catch {
    if (request === cronsRequest) cronsError.value = true
  } finally {
    if (request === cronsRequest) cronsLoading.value = false
  }
}

const newJobOpen = ref(false)
const jobKind = ref<'ordinary' | 'backfill'>('ordinary')
const jobConfig = ref('{}')
const jobValidation = ref<JsonEditorValidation>()
const jobSaving = ref(false)
const jobError = ref('')
const sourceType = computed(() =>
  editor.value?.sourceTypes.find((type) => type.id === source.value?.type)
)
const jobSchema = computed(() =>
  jobKind.value === 'ordinary'
    ? sourceType.value?.collect_config_schema
    : sourceType.value?.backfill_config_schema
)
const canCreateJob = computed(
  () =>
    Boolean(jobSchema.value) &&
    jobValidation.value?.status === 'valid' &&
    jobValidation.value.text === jobConfig.value
)
watch(
  jobSchema,
  () => {
    jobValidation.value = undefined
  },
  { flush: 'sync' }
)

const newCronOpen = ref(false)
const cronSchedule = ref('0 * * * *')
const cronSaving = ref(false)
const cronAction = ref<{ id: number; kind: 'run' | 'delete' } | null>(null)
const cronToDelete = ref<Cron | null>(null)
const cronError = ref('')
const cronCreateError = ref('')
const busy = computed(
  () =>
    sourceSaving.value ||
    sourceDeleting.value ||
    jobSaving.value ||
    cronSaving.value ||
    Boolean(cronAction.value)
)
function canLeave() {
  const dirty =
    Boolean(draft.value && editor.value?.isDirty) ||
    (newJobOpen.value && jobConfig.value !== '{}') ||
    (newCronOpen.value && cronSchedule.value !== '0 * * * *')
  return !busy.value && (!dirty || window.confirm(t('source.discardChanges')))
}
onBeforeRouteLeave(canLeave)
onBeforeRouteUpdate((to) => to.params.id === route.params.id || canLeave())
watch(
  sourceId,
  () => {
    source.value = null
    draft.value = null
    jobs.value = []
    crons.value = []
    sourceSaved.value = false
    sourceError.value = ''
    deleteError.value = ''
    cronError.value = ''
    deleteOpen.value = false
    newJobOpen.value = false
    newCronOpen.value = false
    void loadSource()
    void loadJobs()
    void loadCrons()
  },
  { immediate: true }
)

async function onSaveSource() {
  if (busy.value || !draft.value || !editor.value?.canSave) return
  sourceSaving.value = true
  sourceError.value = ''
  sourceSaved.value = false
  try {
    const candidate = Source.parse({ ...draft.value, config: editor.value.readConfig() })
    const updated = await candidate.save()
    source.value = updated
    draft.value = Source.parse(updated)
    sourceSaved.value = true
  } catch {
    sourceError.value = t('common.saveFailed')
  } finally {
    sourceSaving.value = false
  }
}
function onRequestDeleteSource() {
  deleteError.value = ''
  deleteOpen.value = true
}
function onRequestDeleteCron(cron: Cron) {
  cronError.value = ''
  cronToDelete.value = cron
}
async function onDeleteSource() {
  if (busy.value || !source.value) return
  sourceDeleting.value = true
  deleteError.value = ''
  try {
    await source.value.delete()
  } catch {
    deleteError.value = t('source.deleteFailed')
    return
  } finally {
    sourceDeleting.value = false
  }
  deleteOpen.value = false
  draft.value = null
  await router.push('/sources')
}
function onNewJob() {
  jobKind.value = 'ordinary'
  jobConfig.value = '{}'
  jobValidation.value = undefined
  jobError.value = ''
  newJobOpen.value = true
}
function onCloseJob() {
  if (jobSaving.value) return
  if (jobConfig.value !== '{}' && !window.confirm(t('source.discardChanges'))) return
  newJobOpen.value = false
}
async function onCreateJob() {
  if (busy.value || !canCreateJob.value) return
  jobSaving.value = true
  jobError.value = ''
  let created: Job
  try {
    created = await JobManager.create(
      jobKind.value === 'ordinary' ? 'core.source.collect.v1' : 'core.source.backfill.v1',
      { source: sourceId.value, config: JSON.parse(jobConfig.value) }
    )
    jobs.value = [created, ...jobs.value]
    newJobOpen.value = false
  } catch {
    jobError.value = t('source.runFailed')
    return
  } finally {
    jobSaving.value = false
  }
  await router.push(`/jobs/${created.id}`)
}
function onNewCron() {
  cronSchedule.value = '0 * * * *'
  cronCreateError.value = ''
  newCronOpen.value = true
}
function onCloseCron() {
  if (cronSaving.value) return
  if (cronSchedule.value !== '0 * * * *' && !window.confirm(t('source.discardChanges'))) return
  newCronOpen.value = false
}
async function onCreateCron() {
  if (busy.value || !cronSchedule.value.trim()) return
  cronSaving.value = true
  cronCreateError.value = ''
  try {
    const created = await new CronForm({
      schedule: cronSchedule.value,
      enabled: true,
      job_type: 'core.source.collect.v1',
      job_parameters: { source: sourceId.value, config: {} },
      job_timeout_seconds: null,
    }).create()
    crons.value = [...crons.value, created]
    newCronOpen.value = false
  } catch {
    cronCreateError.value = t('source.scheduleFailed')
  } finally {
    cronSaving.value = false
  }
}
async function onRunCron(cron: Cron) {
  if (busy.value) return
  cronAction.value = { id: cron.id, kind: 'run' }
  cronError.value = ''
  let created: Job
  try {
    created = await cron.runNow()
    jobs.value = [created, ...jobs.value]
  } catch {
    cronError.value = t('source.runFailed')
    return
  } finally {
    cronAction.value = null
  }
  await router.push(`/jobs/${created.id}`)
}
async function onDeleteCron() {
  if (busy.value || !cronToDelete.value) return
  const cron = cronToDelete.value
  cronAction.value = { id: cron.id, kind: 'delete' }
  cronError.value = ''
  try {
    await cron.delete()
    crons.value = crons.value.filter((item) => item.id !== cron.id)
    cronToDelete.value = null
  } catch {
    cronError.value = t('source.deleteFailed')
  } finally {
    cronAction.value = null
  }
}
</script>

<template>
  <main class="source-view">
    <RouterLink :to="{ path: '/sources', hash: `#source-${sourceId}` }" class="source-view__back">{{
      t('sidePanel.sources')
    }}</RouterLink>
    <div
      v-if="sourceLoading"
      class="source-view__skeleton"
      role="status"
      :aria-label="t('common.loading')"
    >
      <InkSkeleton style="width: 40%; height: 1.5rem" /><InkSkeleton style="width: 65%" />
    </div>
    <div v-else-if="sourceLoadError" class="source-view__feedback">
      <p role="alert" class="text-feedback-error">{{ t('source.detailFailed') }}</p>
      <InkButton :text="t('source.retry')" theme="subtle" @click="loadSource" />
    </div>
    <template v-else-if="source && draft">
      <header class="source-view__header">
        <h1>{{ source.nickname || t('source.unnamed') }}</h1>
        <div class="source-view__metadata">
          <code>{{ source.type }}</code
          ><span>#{{ source.id }}</span>
        </div>
      </header>
      <div class="source-view__content">
        <section class="source-view__details" :aria-label="t('source.editConfig')">
          <h2>{{ t('source.editConfig') }}</h2>
          <SourceForm ref="editor" :model-value="draft" :disabled="busy" @submit="onSaveSource">
            <p v-if="sourceError" role="alert" class="text-feedback-error">{{ sourceError }}</p>
            <p v-else-if="sourceSaved && !editor?.isDirty" role="status">{{ t('source.saved') }}</p>
            <div class="source-view__actions">
              <InkButton
                :text="t('source.delete')"
                theme="danger"
                size="sm"
                :disabled="busy"
                @click="onRequestDeleteSource"
              />
              <InkButton
                :text="t('common.save')"
                theme="primary"
                native-type="submit"
                :is-loading="sourceSaving"
                :disabled="!editor?.canSave || !editor?.isDirty || (busy && !sourceSaving)"
              />
            </div>
          </SourceForm>
        </section>
        <div class="source-view__activity">
          <section class="source-view__schedules" :aria-label="t('source.schedules')">
            <div class="source-view__section-header">
              <h2>{{ t('source.schedules') }}</h2>
              <InkButton
                :text="t('source.addSchedule')"
                theme="subtle"
                size="sm"
                :disabled="busy"
                @click="onNewCron"
              />
            </div>
            <InkLoading
              v-if="cronsLoading"
              variant="spinner"
              size="xs"
              :label="t('common.loading')"
            />
            <div v-else-if="cronsError" class="source-view__feedback">
              <p role="alert" class="text-feedback-error">{{ t('source.schedulesFailed') }}</p>
              <InkButton :text="t('source.retry')" theme="subtle" size="sm" @click="loadCrons" />
            </div>
            <p v-else-if="!crons.length">{{ t('source.noSchedules') }}</p>
            <div v-for="cron in crons" :key="cron.id" class="source-view__schedule">
              <code>{{ cron.schedule }}</code
              ><span>{{ t(cron.enabled ? 'source.enabled' : 'source.disabled') }}</span>
              <InkButton
                :text="t('source.runNow')"
                theme="subtle"
                size="sm"
                :is-loading="cronAction?.id === cron.id && cronAction.kind === 'run'"
                :disabled="busy && cronAction?.id !== cron.id"
                @click="onRunCron(cron)"
              />
              <InkButton
                :text="t('source.delete')"
                theme="subtle"
                size="sm"
                :disabled="busy"
                @click="onRequestDeleteCron(cron)"
              />
            </div>
            <p v-if="cronError && !cronToDelete" role="alert" class="text-feedback-error">
              {{ cronError }}
            </p>
          </section>
          <section class="source-view__jobs" :aria-label="t('source.jobs')">
            <div class="source-view__section-header">
              <h2>{{ t('source.jobs') }}</h2>
              <InkButton
                :text="t('source.newJob')"
                theme="subtle"
                size="sm"
                :disabled="busy || !sourceType"
                @click="onNewJob"
              />
            </div>
            <InkLoading
              v-if="jobsLoading"
              variant="spinner"
              size="xs"
              :label="t('source.jobsLoading')"
            />
            <div v-else-if="jobsError" class="source-view__feedback">
              <p role="alert" class="text-feedback-error">{{ t('source.jobsFailed') }}</p>
              <InkButton :text="t('source.retry')" theme="subtle" size="sm" @click="loadJobs" />
            </div>
            <p v-else-if="!jobs.length">{{ t('source.noJobs') }}</p>
            <div class="source-view__job-list">
              <RouterLink
                v-for="job in jobs"
                :key="job.id"
                :to="`/jobs/${job.id}`"
                class="source-view__job-link"
                ><JobCard :job="job"
              /></RouterLink>
            </div>
          </section>
        </div>
      </div>
    </template>
  </main>

  <InkDialog
    v-model="deleteOpen"
    :title="t('source.deleteConfirmTitle')"
    :confirm-text="t('source.delete')"
    :cancel-text="t('common.cancel')"
    :is-loading="sourceDeleting"
    @confirm="onDeleteSource"
  >
    <p>{{ source?.nickname || t('source.unnamed') }} · #{{ source?.id }}</p>
    <p>{{ t('source.deleteConfirmMessage') }}</p>
    <p v-if="deleteError" role="alert" class="text-feedback-error">{{ deleteError }}</p>
  </InkDialog>
  <InkDialog
    :model-value="Boolean(cronToDelete)"
    :title="t('source.deleteSchedule')"
    :confirm-text="t('source.delete')"
    :cancel-text="t('common.cancel')"
    :is-loading="cronAction?.kind === 'delete'"
    @update:model-value="cronToDelete = null"
    @confirm="onDeleteCron"
  >
    <p>{{ t('source.deleteScheduleMessage') }}</p>
    <code>{{ cronToDelete?.schedule }}</code>
    <p v-if="cronError" role="alert" class="text-feedback-error">{{ cronError }}</p>
  </InkDialog>
  <InkPopup
    :open="newJobOpen"
    position="center"
    :aria-label="t('source.newJobTitle')"
    :close-on-scrim="!jobSaving"
    :close-on-escape="!jobSaving"
    @update:open="onCloseJob"
  >
    <InkForm class="source-view__popup" layout="col" @submit="onCreateJob">
      <h2>{{ t('source.newJobTitle') }}</h2>
      <InkDropdown
        v-model="jobKind"
        :options="[
          { label: t('source.ordinary'), value: 'ordinary' },
          ...(sourceType?.backfill_config_schema
            ? [{ label: t('source.backfill'), value: 'backfill' }]
            : []),
        ]"
        :label="t('source.collectionIntent')"
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
      <div class="source-view__actions">
        <InkButton
          :text="t('common.cancel')"
          theme="subtle"
          :disabled="jobSaving"
          @click="onCloseJob"
        /><InkButton
          :text="t('source.createJob')"
          theme="primary"
          native-type="submit"
          :disabled="!canCreateJob"
          :is-loading="jobSaving"
        />
      </div>
    </InkForm>
  </InkPopup>
  <InkPopup
    :open="newCronOpen"
    position="center"
    :aria-label="t('source.addSchedule')"
    :close-on-scrim="!cronSaving"
    :close-on-escape="!cronSaving"
    @update:open="onCloseCron"
  >
    <InkForm class="source-view__popup" layout="col" @submit="onCreateCron">
      <h2>{{ t('source.addSchedule') }}</h2>
      <InkInput v-model="cronSchedule" :label="t('source.cronSchedule')" :disabled="cronSaving" />
      <p v-if="cronCreateError" role="alert" class="text-feedback-error">{{ cronCreateError }}</p>
      <div class="source-view__actions">
        <InkButton
          :text="t('common.cancel')"
          theme="subtle"
          :disabled="cronSaving"
          @click="onCloseCron"
        /><InkButton
          :text="t('source.addSchedule')"
          theme="primary"
          native-type="submit"
          :disabled="!cronSchedule.trim()"
          :is-loading="cronSaving"
        />
      </div>
    </InkForm>
  </InkPopup>
</template>

<style lang="scss" scoped src="./source.scss" />
