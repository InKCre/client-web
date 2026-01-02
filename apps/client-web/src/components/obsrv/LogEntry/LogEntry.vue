<script setup lang="ts">
import { ref } from "vue";
import { useEither } from "@/composables/use-either";
import { Log } from "@/business/obsrv";
import { logEntryEmits, type LogEntryProps } from "./LogEntry";
import dayjs from "dayjs";

const props = defineProps<LogEntryProps>();
defineEmits(logEntryEmits);

// --- data ---
const log = useEither(props.logId, props.log, (id) => Log.get(id));
const expanded = ref(false);

// --- methods ---
const onLogEntryClick = () => {
  expanded.value = !expanded.value;
};

// --- helpers ---
const formatDate = (date: Date): string => {
  return dayjs(date).format("HH:mm:ss.SSS");
};
</script>

<template>
  <div
    v-if="log"
    class="log-entry"
    :class="{ 'log-entry--expanded': expanded }"
  >
    <div class="log-entry__main" @click="onLogEntryClick">
      <div
        class="i-mdi-chevron-right log-entry__chevron"
        :class="{ 'log-entry__chevron--expanded': expanded }"
      />
      <span class="log-time">{{ formatDate(log.timestamp) }}</span>
      <span class="log-severity">{{ log.severity_text }}</span>
      <span class="log-body">{{ log.body }}</span>
    </div>
    <div v-if="expanded" class="log-entry__details">
      <div class="log-entry__detail-row">
        <span class="log-entry__detail-label">Trace ID</span>
        <span class="log-entry__detail-value">{{ log.trace_id || "N/A" }}</span>
      </div>
      <div class="log-entry__detail-row">
        <span class="log-entry__detail-label">Span ID</span>
        <span class="log-entry__detail-value">{{ log.span_id || "N/A" }}</span>
      </div>
      <div class="log-entry__detail-row">
        <span class="log-entry__detail-label">Severity Number</span>
        <span class="log-entry__detail-value">{{ log.severity_number }}</span>
      </div>
      <div
        v-if="Object.keys(log.attributes).length > 0"
        class="log-entry__detail-row"
      >
        <span class="log-entry__detail-label">Attributes</span>
        <pre class="log-entry__detail-value log-entry__detail-value--code">{{
          JSON.stringify(log.attributes, null, 2)
        }}</pre>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped src="./LogEntry.scss" />
