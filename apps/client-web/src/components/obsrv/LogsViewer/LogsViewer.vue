<script setup lang="ts">
import { computed, ref, watch, onUnmounted, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { useIntervalFn } from '@vueuse/core'
import { InkButton, InkLoading } from '@inkcre/ui-web'
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
let generation = 0
onUnmounted(() => generation++)

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
  const current = generation
  try {
    const fetched = await Log.getByTraceId(props.traceId || '', {
      cursor: logs.value[logs.value.length - 1]?.id,
    })
    if (current !== generation) return
    logs.value.push(...fetched)
    logs.value = logs.value.sort((a, b) => a.id - b.id)
    if (fetched.length) {
      await nextTick()
      if (current !== generation) return
      tailMarker.value?.scrollIntoView({ behavior: 'smooth' })
    }
    if (props.enablePolling) resumePolling()
  } catch (e) {
    if (current !== generation) return
    error.value = e instanceof Error ? e.message : 'Failed to load logs'
    pausePolling()
  } finally {
    if (current === generation) isLoading.value = false
  }
}

// --- polling ---
const {
  pause: pausePolling,
  resume: resumePolling,
  isActive,
} = useIntervalFn(loadLogs, () => props.pollingInterval, { immediate: false })

// --- watchers ---
watch(
  () => props.enablePolling,
  (enabled) => {
    if (enabled && !error.value && !isActive.value) {
      resumePolling()
    } else if (!enabled && isActive.value) {
      pausePolling()
    }
  },
  { immediate: true }
)

watch(
  () => props.traceId,
  () => {
    generation++
    pausePolling()
    logs.value = []
    isLoading.value = false
    void loadLogs()
  },
  { immediate: true }
)

// --- computed ---
const isEmpty = computed(() => logs.value.length === 0 && !isLoading.value && !error.value)
</script>

<template>
  <div class="logs-viewer">
    <LogEntry v-for="log in logs" :key="log.id" :log="log" />
    <div ref="tailMarker"></div>
    <div v-if="error" class="logs-viewer__error" role="alert">
      <span>{{ t('logs.loadFailed') }}</span>
      <details>
        <summary>{{ t('common.errorDetails') }}</summary>
        <p>{{ error }}</p>
      </details>
      <InkButton :text="t('common.retry')" @click="loadLogs" />
    </div>
    <div v-if="isLoading" class="logs-viewer__loading">
      <InkLoading variant="spinner" size="sm" density="sm" :label="t('logs.loading')" />
    </div>
    <span v-else-if="isActive" class="logs-viewer__polling">{{ t('logs.autoUpdating') }}</span>
    <div v-if="isEmpty" class="logs-viewer__empty">
      {{ t('logs.empty') }}
    </div>
  </div>
</template>

<style lang="scss" scoped src="./LogsViewer.scss" />
