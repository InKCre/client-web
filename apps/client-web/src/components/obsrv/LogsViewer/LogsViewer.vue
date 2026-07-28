<script setup lang="ts">
import { computed, ref, watch, onMounted, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { useIntervalFn } from '@vueuse/core'
import { InkLoading } from '@inkcre/ui-web'
import LogEntry from '@/components/obsrv/LogEntry/LogEntry.vue'
import { Log } from '@inkcre/core'
import { logsViewerEmits, logsViewerProps } from './LogsViewer'

const props = defineProps(logsViewerProps)
defineEmits(logsViewerEmits)
const { t } = useI18n()

// --- data ---
const logs = ref<Log[]>([])
const isLoading = ref(false)
const error = ref<string | null>(null)
const tailMarker = ref<HTMLDivElement>()

// --- lifecycle ---
onMounted(async () => {
  await loadLogs()
})

// --- methods ---
/**
 * Incrementally loads logs.
 */
const loadLogs = async () => {
  if (isLoading.value) {
    return
  }
  isLoading.value = true
  error.value = null
  try {
    const fetched = await Log.getByTraceId(props.traceId || '', {
      cursor: logs.value[logs.value.length - 1]?.id,
    })
    logs.value.push(...fetched)
    logs.value = logs.value.sort((a, b) => a.id - b.id)
    setTimeout(() => {
      tailMarker.value?.scrollIntoView({ behavior: 'smooth' })
    }, 200)
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to load logs'
  } finally {
    isLoading.value = false
  }
}

// --- polling ---
const {
  pause: pausePolling,
  resume: resumePolling,
  isActive,
} = useIntervalFn(loadLogs, props.pollingInterval, { immediateCallback: true })

// --- watchers ---
watch(
  () => props.enablePolling,
  (enabled) => {
    if (enabled && !isActive.value) {
      resumePolling()
    } else if (!enabled && isActive.value) {
      pausePolling()
    }
  },
  { immediate: true }
)

watch(
  () => props.traceId,
  async () => {
    pausePolling()
    logs.value = []
    await loadLogs()
    if (props.enablePolling) {
      resumePolling()
    }
  }
)

// --- computed ---
const isEmpty = computed(
  () => logs.value.length === 0 && !isActive.value && !isLoading.value && !error.value
)
</script>

<template>
  <div class="logs-viewer">
    <div v-if="error" class="logs-viewer__error">
      <span>{{ error }}</span>
    </div>
    <template v-else>
      <LogEntry v-for="log in logs" :key="log.id" :log="log" />
      <div ref="tailMarker"></div>
      <div v-if="isActive || isLoading" class="logs-viewer__loading">
        <InkLoading size="sm" density="sm" />
      </div>
    </template>
    <div v-if="isEmpty" class="logs-viewer__empty">
      {{ t('logs.empty') || 'No logs' }}
    </div>
  </div>
</template>

<style lang="scss" scoped src="./LogsViewer.scss" />
