<script setup lang="ts">
import { computed, ref, watch, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { useIntervalFn } from "@vueuse/core";
import { InkLoading } from "@inkcre/web-design";
import LogEntry from "@/components/obsrv/LogEntry/LogEntry.vue";
import { Log } from "@/business/obsrv";
import { logsViewerEmits, logsViewerProps } from "./LogsViewer";

const props = defineProps(logsViewerProps);
defineEmits(logsViewerEmits);
const { t } = useI18n();

// --- data ---
const logs = ref<Log[]>([]);
const isLoading = ref(false);
const error = ref<string | null>(null);

// --- lifecycle ---
onMounted(async () => {
  await loadLogs();
});

// --- methods ---
const loadLogs = async () => {
  isLoading.value = true;
  error.value = null;
  try {
    const fetched = await Log.getByTraceId(props.traceId || "");
    logs.value = fetched.sort((a, b) => a.id - b.id);
  } catch (e) {
    error.value = e instanceof Error ? e.message : "Failed to load logs";
  } finally {
    isLoading.value = false;
  }
};

const pollLogs = async () => {
  try {
    error.value = null;
    const lastLog = logs.value[logs.value.length - 1];
    if (lastLog) {
      const newLogs = await Log.getByTraceId(props.traceId || "", {
        cursor: lastLog.id,
      });
      if (newLogs.length > 0) {
        logs.value.push(...newLogs);
      }
    }
  } catch (e) {
    error.value = e instanceof Error ? e.message : "Failed to poll logs";
  }
};

// --- polling ---
const {
  pause: pausePolling,
  resume: resumePolling,
  isActive,
} = useIntervalFn(pollLogs, props.pollingInterval, { immediate: true });

// --- watchers ---
watch(
  () => props.enablePolling,
  (enabled) => {
    if (enabled) {
      resumePolling();
    } else {
      pausePolling();
    }
  },
  { immediate: true }
);

watch(
  () => props.traceId,
  async () => {
    pausePolling();
    logs.value = [];
    await loadLogs();
    if (props.enablePolling) {
      resumePolling();
    }
  }
);

// --- computed ---
const isEmpty = computed(
  () => logs.value.length === 0 && !isLoading.value && !error.value
);
</script>

<template>
  <div class="logs-viewer">
    <div v-if="error" class="logs-viewer__error">
      <span>{{ error }}</span>
    </div>
    <template v-else>
      <LogEntry v-for="log in logs" :key="log.id" :log="log" />
      <div v-if="isActive" class="logs-viewer__loading">
        <InkLoading size="sm" density="sm" />
      </div>
    </template>
    <div v-if="isEmpty" class="logs-viewer__empty">
      {{ t("logs.empty") || "No logs" }}
    </div>
  </div>
</template>

<style lang="scss" scoped src="./LogsViewer.scss" />
