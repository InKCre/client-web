<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { useAsyncState } from "@vueuse/core";
import {
  InkLoading,
  InkButton,
  InkField,
} from "@inkcre/web-design";
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
} = useAsyncState(async () => {
  if (job.value?.source) {
    return await Source.get(job.value.source);
  }
  return null;
}, null, { shallow: false });

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

const onStop = async () => {
  if (job.value && canStop.value) {
    await job.value.stop();
    await refetchJob();
  }
};

const onRetry = async () => {
  if (job.value && canRetry.value) {
    await job.value.retry();
    await refetchJob();
  }
};

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

        <InkField :label="t('collectJob.jobId')" layout="vertical">
          <span class="metadata__value">{{ job.id }}</span>
        </InkField>

        <InkField :label="t('collectJob.status')" layout="vertical">
          <span class="metadata__value" :class="statusColor">
            {{ job.status }}
          </span>
        </InkField>

        <InkField :label="t('collectJob.source')" layout="vertical">
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

        <InkField :label="t('collectJob.createdAt')" layout="vertical">
          <span class="metadata__value">{{ formatDate(job.created_at) }}</span>
        </InkField>

        <InkField :label="t('collectJob.startedAt')" layout="vertical">
          <span class="metadata__value">{{ formatDate(job.started_at) }}</span>
        </InkField>

        <InkField :label="t('collectJob.closedAt')" layout="vertical">
          <span class="metadata__value">{{ formatDate(job.closed_at) }}</span>
        </InkField>
      </section>

      <!-- Right Section: State and Actions -->
      <section class="collect-job-view__state">
        <h3 class="state__title">{{ t("collectJob.state") }}</h3>

        <div class="state__content">
          <pre class="state__data">{{ formattedState }}</pre>
        </div>

        <div class="state__actions">
          <InkButton
            :text="t('collectJob.stop')"
            type="danger"
            size="md"
            :disabled="!canStop"
            @click="onStop"
          />
          <InkButton
            :text="t('collectJob.retry')"
            type="primary"
            size="md"
            :disabled="!canRetry"
            @click="onRetry"
          />
        </div>
      </section>
    </div>
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

<style lang="scss" scoped src="./collectJob.scss" />
