<script setup lang="ts">
import { computed, ref, watch, onUnmounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { useAsyncState } from "@vueuse/core";
import { useEAsyncState } from "@/composables/use-async-state";
import { InkLoading, InkButton, InkField } from "@inkcre/web-design";
import LogsViewer from "@/components/obsrv/LogsViewer/LogsViewer.vue";
import {
  SourceCollectJob,
  SourceCollectJobStatus,
  Source,
} from "@/business/info-base/source";
import dayjs from "dayjs";

const route = useRoute();
const { t } = useI18n();

// --- data ---
const jobId = computed(() => Number(route.params.id));
const pollingInterval = computed(() => (isRunning.value ? 1500 : 5000));
const jobPollingIntervalId = ref<ReturnType<typeof setInterval> | null>(null);

const { state: job, execute: refetchJob } = useEAsyncState(
  () => SourceCollectJob.get(jobId.value),
  null,
  { immediate: true, useLast: true }
);

const {
  state: source,
  execute: refetchSource,
  isLoading: sourceLoading,
} = useAsyncState(
  async () => {
    if (job.value?.source) {
      return await Source.get(job.value.source);
    }
    return null;
  },
  null,
  { shallow: false }
);

// --- logs ---
const enableLogsPolling = computed(() => isRunning.value);

// --- computed ---
const isRunning = computed(
  () => job.value?.status === SourceCollectJobStatus.RUNNING
);

const isPending = computed(
  () => job.value?.status === SourceCollectJobStatus.PENDING
);

const isFinished = computed(
  () => job.value?.status === SourceCollectJobStatus.FINISHED
);

const isFailed = computed(
  () => job.value?.status === SourceCollectJobStatus.FAILED
);

const formattedState = computed(() => {
  return JSON.stringify(job.value?.state || {}, null, 2);
});

const statusColor = computed(() => {
  if (!job.value) return "";
  switch (job.value.status) {
    case SourceCollectJobStatus.PENDING:
      return "status--pending";
    case SourceCollectJobStatus.RUNNING:
      return "status--running";
    case SourceCollectJobStatus.FINISHED:
      return "status--finished";
    case SourceCollectJobStatus.FAILED:
      return "status--failed";
    default:
      return "";
  }
});

// --- methods ---
const formatDate = (date: Date | null) => {
  if (!date) return t("collectJob.notAvailable");
  return dayjs(date).format("YYYY-MM-DD HH:mm:ss");
};

// --- watchers ---
watch(
  () => job.value?.source,
  (newSourceId) => {
    if (newSourceId) {
      refetchSource();
    }
  },
  { immediate: true }
);

watch(
  [() => job.value?.status, () => job.value?.isFinal],
  ([newStatus]) => {
    if (!newStatus || job.value?.isFinal) {
      // Clear polling when job reaches final state or status becomes null
      if (jobPollingIntervalId.value) {
        clearInterval(jobPollingIntervalId.value);
        jobPollingIntervalId.value = null;
      }
      return;
    }

    // Start polling if not already running
    if (!jobPollingIntervalId.value) {
      jobPollingIntervalId.value = setInterval(() => {
        refetchJob();
      }, pollingInterval.value);
    }
  },
  { immediate: true }
);

watch(
  () => pollingInterval.value,
  (newInterval) => {
    // Update interval if polling is active and not in final state
    if (jobPollingIntervalId.value && !job.value?.isFinal) {
      clearInterval(jobPollingIntervalId.value);
      jobPollingIntervalId.value = setInterval(() => {
        refetchJob();
      }, newInterval);
    }
  }
);

// Clean up interval on component unmount
onUnmounted(() => {
  if (jobPollingIntervalId.value) {
    clearInterval(jobPollingIntervalId.value);
  }
});
</script>

<template>
  <main class="collect-job-view">
    <div v-if="!job" class="collect-job-view__loading">
      <InkLoading />
    </div>
    <!-- Content -->
    <template v-else-if="job">
      <!-- Left Section: Metadata -->
      <section class="collect-job-view__metadata">
        <div class="metadata__header">
          <h2 class="metadata__title">{{ t("collectJob.title") }}</h2>
        </div>

        <InkField :label="t('collectJob.jobId')">
          <span class="metadata__value">{{ job.id }}</span>
        </InkField>

        <InkField :label="t('collectJob.status')">
          <span class="metadata__value" :class="statusColor">
            {{ job.status }}
          </span>
        </InkField>

        <InkField :label="t('collectJob.source')">
          <div v-if="sourceLoading" class="metadata__value">
            {{ t("common.loading") }}
          </div>
          <div v-else-if="source" class="metadata__value">
            <div class="source-info">
              <span class="source-info__type">{{ source.type }}</span>
              <span class="source-info__nickname">{{ source.nickname }}</span>
              <span class="source-info__id">#{{ source.id }}</span>
            </div>
          </div>
          <span v-else class="metadata__value">
            {{ t("collectJob.sourceNotFound") }}
          </span>
        </InkField>

        <InkField :label="t('collectJob.createdAt')">
          <span class="metadata__value">{{ formatDate(job.created_at) }}</span>
        </InkField>

        <InkField :label="t('collectJob.startedAt')">
          <span class="metadata__value">{{ formatDate(job.started_at) }}</span>
        </InkField>

        <InkField :label="t('collectJob.closedAt')">
          <span class="metadata__value">{{ formatDate(job.closed_at) }}</span>
        </InkField>

        <InkField :label="t('collectJob.state')">
          <pre class="metadata__value whitespace-pre">{{ formattedState }}</pre>
        </InkField>
      </section>

      <!-- Right Section: Logs -->
      <section class="collect-job-view__logs">
        <h3 class="collect-job-view__logs__title">{{ t("logs.title") }}</h3>
        <LogsViewer
          v-if="job"
          class="flex-1 w-full"
          :trace-id="`source_collect_job.${job.id}`"
          :enable-polling="enableLogsPolling"
          :polling-interval="pollingInterval"
        />
      </section>
    </template>
    <!-- TODO: use inkPlaceholder -->
    <div v-else class="collect-job-view__error">
      <span>{{ t("collectJob.notFound") }}</span>
      <InkButton
        :text="t('common.back')"
        type="subtle"
        size="sm"
        @click="$router.back()"
      />
    </div>
  </main>
</template>

<style lang="scss" scoped src="./sourceCollectJob.scss" />
