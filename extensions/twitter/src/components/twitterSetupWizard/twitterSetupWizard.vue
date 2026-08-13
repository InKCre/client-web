<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { InkButton, InkInput, InkLoading } from '@inkcre/ui-web'
import {
  discoverCoreCandidates,
  TwitterSetupAPI,
  type CoreCandidate,
  type OAuthTransaction,
  type TwitterSetupStatus,
} from '../../setup-api'
import { TWITTER_SETUP_STEPS, twitterSetupWizardEmits } from './twitterSetupWizard'

const emit = defineEmits(twitterSetupWizardEmits)
const candidates = ref<CoreCandidate[]>([])
const selectedClientId = ref<string | null>(null)
const status = ref<TwitterSetupStatus | null>(null)
const currentStep = ref(0)
const loading = ref(true)
const busy = ref(false)
const error = ref<string | null>(null)
const clientId = ref('')
const clientSecret = ref('')
const transaction = ref<OAuthTransaction | null>(null)
const sourceId = ref<number | null>(null)
const sourceNickname = ref('Twitter Bookmarks')
const sourceHour = ref(0)
const sourceMinute = ref(0)
let polling: AbortController | null = null
const lifecycle = new AbortController()

const selectedCandidate = computed(
  () => candidates.value.find((candidate) => candidate.client.id === selectedClientId.value) ?? null
)
const api = computed(() =>
  selectedCandidate.value ? new TwitterSetupAPI(selectedCandidate.value.client) : null
)
const selectedCoreEnabled = computed(() => selectedCandidate.value?.enabled ?? false)

function message(cause: unknown): string {
  return cause instanceof Error ? cause.message : String(cause)
}

function deriveStep(next: TwitterSetupStatus): number {
  if (!next.oauth_app_configured || !next.connected) return 1
  if (next.bookmark_source_id === null) return 2
  return 3
}

function applyStatus(next: TwitterSetupStatus): void {
  status.value = next
  clientId.value = next.client_id ?? ''
  clientSecret.value = ''
  sourceId.value = next.bookmark_source_id ?? next.bookmark_sources[0]?.source_id ?? null
  const source = next.bookmark_sources.find((item) => item.source_id === sourceId.value)
  if (source) {
    sourceNickname.value = source.nickname
    sourceHour.value = source.collect_at.hour
    sourceMinute.value = source.collect_at.minute
  }
  currentStep.value = deriveStep(next)
}

async function reloadStatus(): Promise<void> {
  if (!api.value || !selectedCoreEnabled.value) return
  applyStatus(await api.value.status(lifecycle.signal))
}

async function initialize(): Promise<void> {
  loading.value = true
  error.value = null
  try {
    candidates.value = await discoverCoreCandidates(lifecycle.signal)
    const selected = candidates.value.find((candidate) => candidate.enabled) ?? candidates.value[0]
    selectedClientId.value = selected?.client.id ?? null
    if (selected?.enabled) await reloadStatus()
  } catch (cause) {
    error.value = message(cause)
  } finally {
    loading.value = false
  }
}

async function enableSelectedCore(): Promise<void> {
  if (!api.value || !selectedCandidate.value) return
  busy.value = true
  error.value = null
  try {
    const extension = await api.value.enableCore(lifecycle.signal)
    selectedCandidate.value.extension = extension
    selectedCandidate.value.enabled = extension.enabled.includes(selectedCandidate.value.client.id)
    await reloadStatus()
  } catch (cause) {
    error.value = message(cause)
  } finally {
    busy.value = false
  }
}

async function saveOAuthApp(): Promise<void> {
  if (!api.value) return
  busy.value = true
  error.value = null
  try {
    try {
      applyStatus(
        await api.value.saveOAuthApp(clientId.value, clientSecret.value, false, lifecycle.signal)
      )
    } catch (cause) {
      const causeMessage = message(cause)
      if (!causeMessage.includes('requires confirmation')) throw cause
      if (!window.confirm(`${causeMessage}\n\nDisconnect the current account and continue?`)) return
      applyStatus(
        await api.value.saveOAuthApp(clientId.value, clientSecret.value, true, lifecycle.signal)
      )
    }
  } catch (cause) {
    error.value = message(cause)
  } finally {
    busy.value = false
  }
}

function stopPolling(): void {
  polling?.abort()
  polling = null
}

async function wait(milliseconds: number, signal: AbortSignal): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    if (signal.aborted) {
      reject(new DOMException('Polling cancelled', 'AbortError'))
      return
    }
    const onAbort = () => {
      window.clearTimeout(timer)
      reject(new DOMException('Polling cancelled', 'AbortError'))
    }
    const timer = window.setTimeout(() => {
      signal.removeEventListener('abort', onAbort)
      resolve()
    }, milliseconds)
    signal.addEventListener('abort', onAbort, { once: true })
  })
}

async function pollTransaction(id: string): Promise<void> {
  if (!api.value) return
  stopPolling()
  const controller = new AbortController()
  polling = controller
  try {
    while (!controller.signal.aborted) {
      await wait(2000, controller.signal)
      const next = await api.value.oauthTransaction(id, controller.signal)
      transaction.value = next
      if (!['pending', 'exchanging'].includes(next.status)) {
        if (next.status === 'succeeded') await reloadStatus()
        else error.value = next.error ?? 'Twitter authorization did not complete.'
        return
      }
    }
  } catch (cause) {
    if (!controller.signal.aborted) error.value = message(cause)
  } finally {
    if (polling === controller) polling = null
  }
}

async function beginOAuth(): Promise<void> {
  if (!api.value) return
  busy.value = true
  error.value = null
  try {
    transaction.value = await api.value.beginOAuth(lifecycle.signal)
    void pollTransaction(transaction.value.id)
  } catch (cause) {
    error.value = message(cause)
  } finally {
    busy.value = false
  }
}

async function disconnect(): Promise<void> {
  if (!api.value) return
  busy.value = true
  error.value = null
  try {
    stopPolling()
    transaction.value = null
    applyStatus(await api.value.disconnect(lifecycle.signal))
  } catch (cause) {
    error.value = message(cause)
  } finally {
    busy.value = false
  }
}

async function saveBookmarkSource(): Promise<void> {
  if (!api.value) return
  busy.value = true
  error.value = null
  try {
    applyStatus(
      await api.value.ensureBookmarkSource(
        {
          ...(sourceId.value === null ? {} : { source_id: sourceId.value }),
          nickname: sourceNickname.value,
          collect_at: {
            day_of_week: null,
            hour: sourceHour.value,
            minute: sourceMinute.value,
          },
        },
        lifecycle.signal
      )
    )
  } catch (cause) {
    error.value = message(cause)
  } finally {
    busy.value = false
  }
}

async function finish(): Promise<void> {
  if (!api.value) return
  busy.value = true
  error.value = null
  try {
    applyStatus(await api.value.finish(lifecycle.signal))
  } catch (cause) {
    error.value = message(cause)
  } finally {
    busy.value = false
  }
}

onMounted(() => void initialize())
onBeforeUnmount(() => {
  lifecycle.abort()
  stopPolling()
})
</script>

<template>
  <section class="twitter-setup">
    <ol class="twitter-setup__steps" aria-label="Twitter setup progress">
      <li
        v-for="(step, index) in TWITTER_SETUP_STEPS"
        :key="step"
        :class="{ 'is-current': currentStep === index, 'is-complete': currentStep > index }"
      >
        <span>{{ index + 1 }}</span
        >{{ step }}
      </li>
    </ol>

    <div v-if="loading" class="twitter-setup__loading"><InkLoading /></div>
    <template v-else>
      <p v-if="error" class="twitter-setup__error" role="alert">{{ error }}</p>

      <div v-if="currentStep === 0" class="twitter-setup__panel">
        <h3>Choose a Core Peer</h3>
        <p>
          The setup commands run on a Core Peer, but configure Twitter for the whole deployment.
        </p>
        <label v-if="candidates.length" class="twitter-setup__field">
          Core Peer
          <select v-model="selectedClientId">
            <option
              v-for="candidate in candidates"
              :key="candidate.client.id"
              :value="candidate.client.id"
            >
              {{ candidate.client.name }}{{ candidate.enabled ? ' — enabled' : '' }}
            </option>
          </select>
        </label>
        <p v-else>No reachable Core Peer exposes the installed Twitter Extension.</p>
        <InkButton
          v-if="selectedCandidate && !selectedCoreEnabled"
          text="Enable Twitter on this Core Peer"
          theme="primary"
          :loading="busy"
          @click="enableSelectedCore"
        />
      </div>

      <div v-else-if="currentStep === 1" class="twitter-setup__panel">
        <h3>Connect an X account</h3>
        <p>
          Register your own X OAuth 2.0 application and use this callback URL:
          <code>{{ status?.callback_url }}</code>
        </p>
        <InkInput v-model="clientId" label="Client ID" required />
        <label class="twitter-setup__field">
          Client Secret
          <input v-model="clientSecret" type="password" autocomplete="off" required />
        </label>
        <div class="twitter-setup__actions">
          <InkButton
            text="Save OAuth App"
            :loading="busy"
            :disabled="!clientId || !clientSecret"
            @click="saveOAuthApp"
          />
          <InkButton
            v-if="status?.oauth_app_configured"
            text="Create authorization link"
            theme="primary"
            :loading="busy"
            @click="beginOAuth"
          />
          <InkButton
            v-if="status?.connected"
            text="Disconnect"
            theme="danger"
            @click="disconnect"
          />
        </div>
        <a
          v-if="transaction?.authorize_url"
          :href="transaction.authorize_url"
          target="_blank"
          rel="noopener noreferrer"
          class="twitter-setup__oauth-link"
        >
          Open X authorization
        </a>
        <p v-if="transaction && ['pending', 'exchanging'].includes(transaction.status)">
          Waiting for the standalone Core callback…
        </p>
        <p v-if="status?.connected">Connected as @{{ status.handle }}.</p>
      </div>

      <div v-else-if="currentStep === 2" class="twitter-setup__panel">
        <h3>Choose a Bookmark Source</h3>
        <label v-if="status?.bookmark_sources.length" class="twitter-setup__field">
          Existing Source
          <select v-model="sourceId">
            <option :value="null">Create a new Source</option>
            <option
              v-for="source in status.bookmark_sources"
              :key="source.source_id ?? 0"
              :value="source.source_id"
            >
              {{ source.nickname }}
            </option>
          </select>
        </label>
        <InkInput v-model="sourceNickname" label="Source nickname" :disabled="sourceId !== null" />
        <div class="twitter-setup__schedule">
          <label>
            Daily hour
            <input
              v-model.number="sourceHour"
              type="number"
              min="0"
              max="23"
              :disabled="sourceId !== null"
            />
          </label>
          <label>
            Minute
            <input
              v-model.number="sourceMinute"
              type="number"
              min="0"
              max="59"
              :disabled="sourceId !== null"
            />
          </label>
        </div>
        <p v-if="sourceId !== null">Change an existing Source schedule from the Sources page.</p>
        <InkButton
          text="Use this Source"
          theme="primary"
          :loading="busy"
          @click="saveBookmarkSource"
        />
      </div>

      <div v-else class="twitter-setup__panel">
        <h3>{{ status?.ready ? 'Twitter is ready' : 'Review and start' }}</h3>
        <dl>
          <dt>Account</dt>
          <dd>@{{ status?.handle }}</dd>
          <dt>Bookmark Source</dt>
          <dd>#{{ status?.bookmark_source_id }}</dd>
          <dt>Initial collection</dt>
          <dd>{{ status?.bookmark_source_ready ? 'accepted' : 'not started' }}</dd>
        </dl>
        <div class="twitter-setup__actions">
          <InkButton
            v-if="!status?.ready"
            text="Start collecting bookmarks"
            theme="primary"
            :loading="busy"
            @click="finish"
          />
          <InkButton text="Close" theme="subtle" @click="emit('close')" />
        </div>
      </div>
    </template>
  </section>
</template>

<style lang="scss" scoped src="./twitterSetupWizard.scss" />
