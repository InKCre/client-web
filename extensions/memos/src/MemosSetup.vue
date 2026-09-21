<script setup lang="ts">
import { computed, inject, onMounted, onUnmounted, ref, shallowRef } from 'vue'
import { InkButton, InkDropdown, InkForm, InkInput, INK_I18N_KEY } from '@inkcre/ui-web'
import { ExtensionModel, type InstalledExtension, type Peer } from '@inkcre/core'
import {
  extensionName,
  generateToken,
  manageMemos,
  personalAccessToken,
  readSetup,
  serverUrl,
  tokenPattern,
} from './setup'

const emit = defineEmits<{ close: [] }>()
const i18n = inject(INK_I18N_KEY, undefined)
const zh = computed(() => i18n?.locale.value.startsWith('zh') ?? false)
const tr = (en: string, cn: string) => (zh.value ? cn : en)
const extension = shallowRef<InstalledExtension | null>(null)
const peers = shallowRef<Peer[]>([])
const selected = ref('')
const draft = ref('')
const busy = ref(false)
const loaded = ref(false)
const reveal = ref(false)
const error = ref('')
const notice = ref('')
let mounted = true
onUnmounted(() => {
  mounted = false
})

const peer = computed(() => peers.value.find((candidate) => candidate.id === selected.value))
const address = computed(() => (peer.value ? serverUrl(peer.value) : null))
const savedToken = computed(() => (extension.value ? personalAccessToken(extension.value) : null))
const enabled = computed(() => extension.value?.enabled.includes(selected.value) ?? false)
const ready = computed(() => loaded.value && address.value && savedToken.value && enabled.value)
const options = computed(() =>
  peers.value.map((candidate) => ({ label: candidate.name, value: candidate.id }))
)
const validDraft = computed(() => tokenPattern.test(draft.value))

async function refresh() {
  if (busy.value) return
  busy.value = true
  error.value = ''
  notice.value = ''
  reveal.value = false
  try {
    const current = await readSetup()
    if (!mounted) return
    extension.value = current.extension
    peers.value = current.peers
    if (!current.peers.some((candidate) => candidate.id === selected.value)) {
      selected.value = current.peers.length === 1 ? current.peers[0]!.id : ''
    }
    loaded.value = true
  } catch {
    loaded.value = false
    error.value = tr(
      'Unable to read the current setup. Check your instance connection and refresh.',
      '无法读取当前配置。请检查实例连接并刷新。'
    )
  } finally {
    busy.value = false
  }
}

async function prepare() {
  if (busy.value || !loaded.value || !peer.value || !address.value) return
  const target = peer.value
  const previousToken = savedToken.value
  const token = previousToken ?? draft.value
  if (!tokenPattern.test(token)) return
  busy.value = true
  error.value = ''
  notice.value = ''
  let phase: 'save' | 'enable' = 'save'
  try {
    // Recheck after user deliberation. A newly configured PAT must not be silently replaced.
    const current = await ExtensionModel.get(extensionName)
    if (!current) throw new Error('Memos is no longer installed.')
    extension.value = current
    if (personalAccessToken(current) !== previousToken) {
      error.value = tr(
        'Configuration changed elsewhere. Review the current PAT before continuing.',
        '配置已在其他位置变更。请核对当前 PAT 后继续。'
      )
      return
    }
    if (!previousToken) {
      extension.value = await manageMemos(target, {
        action: 'patch_config',
        extension: extensionName,
        patch: { personal_access_token: token },
      })
      if (personalAccessToken(extension.value) !== token) throw new Error('PAT readback differs.')
    }
    phase = 'enable'
    if (!extension.value.enabled.includes(target.id)) {
      extension.value = await manageMemos(target, { action: 'enable', extension: extensionName })
    }
    draft.value = ''
  } catch {
    // A lost response is not evidence of failure. Read canonical state before allowing a retry.
    try {
      const current = await ExtensionModel.get(extensionName)
      if (!current) throw new Error('Memos is no longer installed.')
      extension.value = current
      error.value =
        phase === 'enable'
          ? tr(
              'The PAT is saved. Check Core availability, then retry enabling with the same PAT.',
              'PAT 已保存。请检查 Core 是否可用，再用同一枚 PAT 重试启用。'
            )
          : tr(
              'The save was not confirmed. Current saved state has been refreshed; your draft is retained.',
              '保存未获确认。已刷新当前保存状态，并保留输入草稿。'
            )
    } catch {
      loaded.value = false
      error.value = tr(
        'The result is unknown. Refresh to read saved state before retrying; your draft is retained.',
        '结果未知。请先刷新已保存状态再重试；输入草稿已保留。'
      )
    }
  } finally {
    busy.value = false
  }
}

async function copy(value: string, kind: 'url' | 'pat') {
  notice.value = ''
  try {
    await navigator.clipboard.writeText(value)
    notice.value =
      kind === 'url'
        ? tr('Server URL copied.', '服务地址已复制。')
        : tr('PAT copied. Keep it private.', 'PAT 已复制，请妥善保管。')
  } catch {
    notice.value = tr(
      'Clipboard unavailable. Select the value and copy manually; reveal the PAT if needed.',
      '剪贴板不可用，请选中文字手动复制；需要时先显示 PAT。'
    )
  }
}

onMounted(refresh)
</script>

<template>
  <section class="memos-setup" :aria-busy="busy">
    <p>
      {{
        tr(
          'Connect a Memos-compatible app to this InKCre instance. No separate Memos server is needed.',
          '将兼容 Memos 的 App 连接到此 InKCre 实例，无需另建 Memos 服务器。'
        )
      }}
    </p>
    <p v-if="error" role="alert" class="memos-setup__error">{{ error }}</p>
    <InkButton :text="tr('Refresh status', '刷新状态')" :is-loading="busy" @click="refresh" />
    <template v-if="loaded">
      <p v-if="!peers.length" role="status">
        {{
          tr(
            'No online Core can manage Memos. Start Core, then refresh.',
            '没有可管理 Memos 的在线 Core。请启动 Core 后刷新。'
          )
        }}
      </p>
      <InkForm v-else layout="col" @submit="prepare">
        <InkDropdown
          v-if="peers.length > 1"
          v-model="selected"
          :options="options"
          :label="tr('Core providing Memos', '提供 Memos 服务的 Core')"
          :disabled="busy"
          required
        />
        <p v-else>{{ tr('Core', 'Core') }}: {{ peer?.name }}</p>
        <p v-if="peer && !address" role="alert">
          {{
            tr(
              'Set this Core’s Public HTTP Base URL in Clients → Config, then refresh. Use the externally reachable Core address, not PostgREST.',
              '请在 Clients → Config 配置此 Core 的公共 HTTP 基址，再刷新。填写外部可访问的 Core 地址，不是 PostgREST 地址。'
            )
          }}
        </p>
        <template v-if="peer && address">
          <template v-if="!ready">
            <p>
              {{
                savedToken
                  ? tr(
                      'Your saved PAT will be reused. This does not replace credentials in existing apps.',
                      '将复用已保存的 PAT，不会替换已有 App 的凭据。'
                    )
                  : tr(
                      'Generate a PAT or enter your own. It is not usable until saved.',
                      '生成一枚 PAT，或输入自备 PAT。保存前只是草稿，尚不可使用。'
                    )
              }}
            </p>
            <template v-if="!savedToken">
              <InkInput
                v-model="draft"
                label="Personal Access Token"
                native-type="password"
                autocomplete="off"
                :disabled="busy"
                :error="
                  draft && !validDraft
                    ? tr(
                        'Use memos_pat_ followed by 32 ASCII letters or digits.',
                        '格式为 memos_pat_ 加 32 个英文字母或数字。'
                      )
                    : ''
                "
              />
              <InkButton
                :text="tr('Generate PAT', '生成 PAT')"
                :disabled="busy"
                @click="draft = generateToken()"
              />
            </template>
            <InkButton
              native-type="submit"
              theme="primary"
              :text="
                savedToken
                  ? tr('Enable Memos on this Core', '在此 Core 启用 Memos')
                  : tr('Save PAT and enable Memos', '保存 PAT 并启用 Memos')
              "
              :disabled="!savedToken && !validDraft"
              :is-loading="busy"
            />
          </template>
          <template v-else>
            <h3>{{ tr('Connection details are ready', '连接信息已准备好') }}</h3>
            <p>
              {{
                tr(
                  'Paste these values into your app. This page cannot confirm that the app has connected.',
                  '请将下面两项填入 App。本页不能确认外部 App 已成功连接。'
                )
              }}
            </p>
            <InkInput :model-value="address" label="Server URL" readonly />
            <InkButton
              :text="tr('Copy server URL', '复制服务地址')"
              @click="copy(address, 'url')"
            />
            <InkInput
              :model-value="savedToken"
              label="Personal Access Token"
              :native-type="reveal ? 'text' : 'password'"
              readonly
              autocomplete="off"
            />
            <div class="memos-setup__actions">
              <InkButton
                :text="reveal ? tr('Hide PAT', '隐藏 PAT') : tr('Show PAT', '显示 PAT')"
                :aria-pressed="reveal"
                @click="reveal = !reveal"
              />
              <InkButton :text="tr('Copy PAT', '复制 PAT')" @click="copy(savedToken!, 'pat')" />
            </div>
            <ol>
              <li>
                {{
                  tr(
                    'Open your client’s server sign-in screen. The tested compatibility baseline is MoeMemos Android 2.0.4.',
                    '打开客户端的服务器登录界面。已验证的兼容基线是 MoeMemos Android 2.0.4。'
                  )
                }}
              </li>
              <li>
                {{
                  tr(
                    'Paste the Server URL exactly as shown, including /memos. Paste the PAT into its token field, then sign in.',
                    '原样填写 Server URL（包括 /memos），将 PAT 填入 token 栏，然后登录。'
                  )
                }}
              </li>
              <li>
                {{
                  tr(
                    'If sign-in fails, check that your device can reach this Core and that Memos remains enabled.',
                    '如果登录失败，请检查设备能否访问此 Core，以及 Memos 是否仍已启用。'
                  )
                }}
              </li>
            </ol>
            <p>
              {{
                tr(
                  'To replace or revoke the PAT, use Extension Config. Replacement disconnects every app using the old PAT.',
                  '如需替换或撤销 PAT，请使用 Extension Config。替换后，所有使用旧 PAT 的 App 都需更新凭据。'
                )
              }}
            </p>
          </template>
        </template>
      </InkForm>
    </template>
    <p v-if="notice" role="status">{{ notice }}</p>
    <InkButton :text="tr('Close', '关闭')" :disabled="busy" @click="emit('close')" />
  </section>
</template>

<style scoped>
.memos-setup {
  display: grid;
  gap: var(--sys-space-md, 1rem);
  min-width: 0;
}
.memos-setup p {
  margin: 0;
}
.memos-setup h3 {
  margin: 0;
  font-size: var(--sys-font-title-sm-font-size);
}
.memos-setup__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sys-space-sm, 0.5rem);
}
.memos-setup__error {
  color: var(--sys-color-feedback-error);
}
.memos-setup ol {
  padding-inline-start: 1.5rem;
}
.memos-setup li + li {
  margin-top: 0.5rem;
}
</style>
