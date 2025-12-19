<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { useAsyncState, useIntervalFn } from "@vueuse/core";
import { InkLoading, InkButton, InkField } from "@inkcre/web-design";
import {
  SourceCollectJob,
  SourceCollectJobStatus,
  Source,
} from "@/business/info-base/source";
import dayjs from "dayjs";

const route = useRoute();
const router = useRouter();
const { t } = useI18n();

// --- data ---
const jobId = computed(() => Number(route.params.id));

const {
  state: job,
  execute: refetchJob,
  isLoading: jobLoading,
} = useAsyncState(() => SourceCollectJob.get(jobId.value), null);

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

const {
  state: logs,
  execute: refetchLogs,
  isLoading: logsLoading,
} = useAsyncState(async () => {
  if (job.value) {
    const fetchedLogs = await job.value.getLogs();
    return fetchedLogs.sort(
      (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
    );
  }
  return [];
}, []);

const { pause: pauseLogsPolling, resume: resumeLogsPolling } = useIntervalFn(
  () => {
    if (job.value) {
      refetchLogs();
    }
  },
  5000
);

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

const canStop = computed(() => isRunning.value || isPending.value);

const canRetry = computed(() => isFailed.value || isFinished.value);

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

// const onStop = async () => {
//   if (job.value && canStop.value) {
//     await job.value.stop();
//     await refetchJob();
//   }
// };

// const onRetry = async () => {
//   if (job.value && canRetry.value) {
//     await job.value.retry();
//     await refetchJob();
//   }
// };

const onBack = () => {
  router.push("/sources");
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
  job,
  () => {
    if (job.value) {
      refetchLogs();
      resumeLogsPolling();
    } else {
      pauseLogsPolling();
    }
  },
  { immediate: true }
);
</script>

<template>
  <main class="collect-job-view">
    <div v-if="jobLoading" class="collect-job-view__loading">
      <InkLoading />
    </div>
    <div v-else-if="job" class="collect-job-view__content">
      <!-- Left Section: Metadata -->
      <section class="collect-job-view__metadata">
        <div class="metadata__header">
          <h2 class="metadata__title">{{ t("collectJob.title") }}</h2>
          <InkButton
            :text="t('common.back')"
            type="subtle"
            size="sm"
            @click="onBack"
          />
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
          <pre class="metadata__value">{{ formattedState }}</pre>
        </InkField>
      </section>

      <!-- Right Section: Logs -->
      <section class="collect-job-view__logs">
        <h3 class="logs__title">{{ t("collectJob.logs") }}</h3>

        <div v-if="logsLoading" class="logs__loading">
          <InkLoading />
        </div>
        <div v-else class="logs__content">
          <div v-for="log in logs" :key="log.id" class="log-entry">
            <!-- TODO: obsrv/log -->
            <span class="log-time">{{ formatDate(log.timestamp) }}</span>
            <span class="log-severity">{{ log.severity_text }}</span>
            <span class="log-body">{{ log.body }}</span>
          </div>
          <div v-if="logs.length === 0" class="logs__empty">
            {{ t("collectJob.noLogs") }}
          </div>
        </div>
      </section>
    </div>
    <!-- TODO: use inkPlaceholder -->
    <div v-else class="collect-job-view__error">
      <span>{{ t("collectJob.notFound") }}</span>
      <InkButton
        :text="t('common.back')"
        type="subtle"
        size="sm"
        @click="onBack"
      />
    </div>
  </main>
</template>

<style lang="scss" scoped src="./sourceCollectJob.scss" />
