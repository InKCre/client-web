<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { sourceCollectJobCardProps, sourceCollectJobCardEmits } from "./sourceCollectJobCard";
import { SourceCollectJobStatus } from "@/business/info-base/source";
import dayjs from "dayjs";

const props = defineProps(sourceCollectJobCardProps);
const emit = defineEmits(sourceCollectJobCardEmits);
const { t } = useI18n();

// --- computed ---
const statusColor = computed(() => {
  switch (props.job.status) {
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

const onClick = () => {
  emit("click");
};
</script>

<template>
  <div class="source-collect-job-card" @click="onClick">
    <div class="source-collect-job-card__header">
      <span class="source-collect-job-card__id">#{{ job.id }}</span>
      <span class="source-collect-job-card__status" :class="statusColor">
        {{ job.status }}
      </span>
    </div>
    <div class="source-collect-job-card__dates">
      <span class="source-collect-job-card__date">
        {{ t("collectJob.createdAt") }}: {{ formatDate(job.created_at) }}
      </span>
    </div>
  </div>
</template>

<style lang="scss" scoped src="./sourceCollectJobCard.scss" />
