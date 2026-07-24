<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAsyncState } from '@vueuse/core'
import { useEAsyncState } from '@/composables/use-async-state'
import { InkLoading, InkButton, InkDoubleCheck, InkPopup, InkPagination } from '@inkcre/web-design'
import sourceForm from '@/components/source/sourceForm/sourceForm.vue'
import collectJobForm from '@/components/source/collectJobForm/collectJobForm.vue'
import sourceCollectJobCard from '@/components/source/sourceCollectJobCard/sourceCollectJobCard.vue'
import {
  Source,
  SourceCollectJob,
  SourceCollectJobForm,
  SourceCollectJobStatus,
} from '@inkcre/core'
import type { PaginationState } from '@/views/sources/source/source'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()

// --- data ---
const sourceId = computed(() => Number(route.params.id))
const newJobPopupOpen = ref(false)
const jobForm = ref<SourceCollectJobForm>(
  SourceCollectJobForm.parse({
    source: sourceId.value,
    created_at: new Date(),
    started_at: null,
    closed_at: null,
    status: SourceCollectJobStatus.PENDING,
    state: {},
    config: {},
  })
)

const pagination = ref<PaginationState>({
  page: 1,
  pageSize: 10,
  total: 0,
})

const { state: source, execute: refetchSource } = useEAsyncState(
  () => Source.get(sourceId.value),
  null,
  { immediate: true, useLast: true }
)

const {
  state: collectJobs,
  execute: refetchCollectJobs,
  isLoading: collectJobsLoading,
} = useAsyncState(
  async () => {
    const offset = (pagination.value.page - 1) * pagination.value.pageSize
    const result = await SourceCollectJob.getBySource(sourceId.value, {
      limit: pagination.value.pageSize,
      offset,
      order: 'desc',
    })
    pagination.value.total = result.count
    return result.data
  },
  [],
  { shallow: false }
)

// --- computed ---
const totalPages = computed(() => Math.ceil(pagination.value.total / pagination.value.pageSize))

// --- methods ---
const onSaveSource = async () => {
  await source.value!.save()
}

const onDelete = async () => {
  await source.value!.delete()
  router.push('/sources')
}

const onNewJob = () => {
  // Reset form
  jobForm.value = SourceCollectJobForm.parse({
    source: sourceId.value,
    created_at: new Date(),
    started_at: null,
    closed_at: null,
    status: SourceCollectJobStatus.PENDING,
    state: {},
    config: {},
  })
  newJobPopupOpen.value = true
}

const onCreateJob = async () => {
  try {
    const job = await jobForm.value.create()
    newJobPopupOpen.value = false
    router.push(`/sources/collectJob/${job.id}`)
  } catch (error) {
    console.error('Failed to create job:', error)
    // TODO: Show error toast to user
  }
}

const goToJob = (jobId: number) => {
  router.push(`/sources/collectJob/${jobId}`)
}

const goToPage = (page: number) => {
  pagination.value.page = page
}

// --- watchers ---
watch(
  () => pagination.value.page,
  () => {
    refetchCollectJobs()
  }
)
</script>

<template>
  <main class="source-view">
    <div v-if="!source" class="source-view__loading">
      <InkLoading />
    </div>
    <template v-else-if="source">
      <!-- Left Section: Source Details -->
      <section class="source-view__details">
        <div class="details__header">
          <h2 class="details__title">{{ t('source.detailTitle') }}</h2>
        </div>

        <sourceForm v-model="source" class="overflow-y-auto" />

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
          <InkButton :text="t('common.save')" theme="primary" size="sm" @click="onSaveSource" />
        </div>
      </section>

      <!-- Right Section: Collect Jobs -->
      <section class="source-view__jobs">
        <div class="jobs__header">
          <h3 class="jobs__title">{{ t('source.collectJobs') }}</h3>
          <InkButton
            :text="t('source.newJob')"
            theme="primary"
            size="md"
            class="w-full"
            @click="onNewJob"
          />
        </div>

        <div v-if="collectJobsLoading" class="jobs__loading">
          <InkLoading />
        </div>
        <div v-else-if="collectJobs.length === 0" class="jobs__empty">
          <span>{{ t('source.noJobs') }}</span>
        </div>
        <div class="jobs__list">
          <sourceCollectJobCard
            v-for="job in collectJobs"
            :key="job.id"
            :job="job"
            @click="goToJob(job.id)"
          />
        </div>

        <InkPagination
          v-if="totalPages > 1"
          class="jobs__pagination"
          type="text"
          :totalPages="totalPages"
          :currentPage="pagination.page"
          @page-change="goToPage"
        />
      </section>
    </template>
  </main>

  <!-- New Job Popup -->
  <InkPopup v-model:open="newJobPopupOpen" position="center">
    <div class="new-job-popup">
      <h3 class="new-job-popup__title">{{ t('source.newJobTitle') }}</h3>
      <collectJobForm v-model="jobForm" />
      <div class="new-job-popup__actions">
        <InkButton :text="t('common.cancel')" theme="subtle" @click="newJobPopupOpen = false" />
        <InkButton :text="t('common.confirm')" theme="primary" @click="onCreateJob" />
      </div>
    </div>
  </InkPopup>
</template>

<style lang="scss" scoped src="./source.scss" />
