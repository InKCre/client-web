<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import DOMPurify from 'dompurify'
import { getInfoBaseRouter, type SolvedContentRendererProps } from '@inkcre/core'

import type { EmailResolver } from '../../resolver'
import MimePartItem from '../contentMimePart/MimePartItem.vue'
import type { SolvedEmail, SolvedMimePart } from '../../schema'

const props = defineProps<SolvedContentRendererProps<SolvedEmail, EmailResolver>>()
const router = getInfoBaseRouter()
const email = ref(props.solvedContent)
const materializing = ref<Set<number>>(new Set())
const materializeErrors = ref<Map<number, string>>(new Map())

watch(
  () => props.solvedContent,
  (value) => {
    email.value = value
  }
)

const participants = computed(() => {
  const grouped = new Map<string, string[]>()
  for (const participant of [...email.value.participants].sort(
    (left, right) => left.relation.order - right.relation.order
  )) {
    const values = grouped.get(participant.relation.role) ?? []
    const name = participant.relation.display_name
    const address = participant.address.solvedContent.address
    values.push(name ? `${name} <${address}>` : address)
    grouped.set(participant.relation.role, values)
  }
  return [...grouped.entries()]
})

const sender = computed(() => {
  const from = email.value.participants.filter(
    (participant) => participant.relation.role === 'from'
  )
  const senders = from.length
    ? from
    : email.value.participants.filter((participant) => participant.relation.role === 'sender')
  return senders
    .sort((left, right) => left.relation.order - right.relation.order)
    .map(
      (participant) =>
        participant.relation.display_name || participant.address.solvedContent.address
    )
    .join(', ')
})
const attachments = computed(() =>
  email.value.mimeParts.filter((part) => part.relation.role === 'attachment')
)
const inlineParts = computed(() =>
  email.value.mimeParts.filter((part) => part.relation.role === 'inline')
)
const conversations = computed(() => {
  const parents = new Set(email.value.parents.map((part) => part.block.id))
  return [
    ...email.value.parents,
    ...email.value.references.filter((part) => !parents.has(part.block.id)),
  ]
})

const htmlBody = computed(() =>
  email.value.bodies.find((body) => body.block.resolver === 'core.html.v1')
)
const textBody = computed(() =>
  email.value.bodies.find((body) => body.block.resolver === 'core.text.v1')
)

function objectUrl(part: SolvedMimePart): string | null {
  const solved = part.content?.solvedContent
  if (!solved || typeof solved !== 'object' || !('objectUrl' in solved)) return null
  return typeof solved.objectUrl === 'string' ? solved.objectUrl : null
}

const isolatedHtml = computed(() => {
  if (!htmlBody.value) return ''
  const sanitized = DOMPurify.sanitize(htmlBody.value.solvedContent, {
    FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'link', 'meta', 'base'],
    FORBID_ATTR: ['style', 'srcset', 'poster', 'background', 'formaction'],
  })
  const document = new DOMParser().parseFromString(sanitized, 'text/html')
  const cidUrls = new Map<string, string>()
  for (const embedded of email.value.embedded) {
    if (embedded.body.id !== htmlBody.value.block.id) continue
    const url = objectUrl(embedded.mimePart.solvedContent)
    if (url) cidUrls.set(embedded.reference.toLowerCase(), url)
  }

  for (const element of document.querySelectorAll<HTMLElement>('[src]')) {
    const source = element.getAttribute('src')?.trim() ?? ''
    const local = cidUrls.get(source.toLowerCase())
    if (element instanceof HTMLImageElement && local) element.src = local
    else element.removeAttribute('src')
  }
  for (const anchor of document.querySelectorAll<HTMLAnchorElement>('a[href]')) {
    const href = anchor.getAttribute('href') ?? ''
    try {
      const target = new URL(href)
      if (!['http:', 'https:'].includes(target.protocol)) throw new Error('unsupported link')
      anchor.href = target.href
      anchor.target = '_blank'
      anchor.rel = 'noopener noreferrer'
    } catch {
      anchor.removeAttribute('href')
      anchor.removeAttribute('target')
    }
  }
  return `<!doctype html><html><head><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src blob:; style-src 'nonce-inkcre-mail'"><style nonce="inkcre-mail">body{margin:0;padding:16px;color:#202020;background:#fff;font:16px/1.65 system-ui,sans-serif;overflow-wrap:anywhere}h1,h2,h3{line-height:1.35;font-weight:600}h1{font-size:1.5em}h2{font-size:1.25em}h3{font-size:1.1em}img{max-width:100%;height:auto}pre{white-space:pre-wrap}blockquote{margin-inline:0;padding-inline-start:16px;border-inline-start:2px solid #ccc}a{color:inherit}</style></head><body>${document.body.innerHTML}</body></html>`
})

async function materialize(block: number): Promise<void> {
  if (materializing.value.has(block)) return
  materializing.value = new Set(materializing.value).add(block)
  const errors = new Map(materializeErrors.value)
  errors.delete(block)
  materializeErrors.value = errors
  try {
    email.value = await props.resolver.materializeMimePart(block)
  } catch (cause) {
    materializeErrors.value = new Map(materializeErrors.value).set(
      block,
      cause instanceof Error ? cause.message : String(cause)
    )
  } finally {
    const active = new Set(materializing.value)
    active.delete(block)
    materializing.value = active
  }
}

function navigate(block: number): void {
  void router.push({ name: 'block', block })
}
</script>

<template>
  <article class="content-email">
    <header class="content-email__header">
      <h2>{{ email.root.subject || '(no subject)' }}</h2>
      <p v-if="sender" class="content-email__sender">{{ sender }}</p>
      <time v-if="email.root.authored_at" :datetime="email.root.authored_at.toISOString()">{{
        email.root.authored_at.toLocaleString()
      }}</time>
      <details
        v-if="participants.length || email.mailboxes.length || email.flags.length"
        class="content-email__details"
      >
        <summary>Message details</summary>
        <dl>
          <template v-for="[role, values] in participants" :key="role">
            <dt>{{ role.replace(/_/g, ' ') }}</dt>
            <dd>{{ values.join(', ') }}</dd>
          </template>
          <template v-if="email.mailboxes.length"
            ><dt>Mailboxes</dt>
            <dd>
              {{ email.mailboxes.map((item) => item.mailbox.solvedContent.name).join(', ') }}
            </dd></template
          >
          <template v-if="email.flags.length"
            ><dt>Flags</dt>
            <dd>
              {{ email.flags.map((item) => item.flag.solvedContent.name).join(', ') }}
            </dd></template
          >
        </dl>
      </details>
    </header>
    <iframe
      v-if="htmlBody"
      :key="isolatedHtml"
      class="content-email__html"
      title="Email HTML body"
      sandbox="allow-popups allow-popups-to-escape-sandbox"
      :srcdoc="isolatedHtml"
    />
    <pre v-else-if="textBody" class="content-email__text">{{ textBody.solvedContent }}</pre>
    <p v-else class="content-email__empty">No body content</p>
    <section v-if="attachments.length" class="content-email__parts" aria-label="Attachments">
      <h3>
        Attachments <span>{{ attachments.length }}</span>
      </h3>
      <ul>
        <li v-for="part in attachments" :key="part.block.id" class="content-email__part">
          <MimePartItem
            :content="part.solvedContent"
            :loading="materializing.has(part.block.id)"
            :error="materializeErrors.get(part.block.id)"
            @download="materialize(part.block.id)"
          />
        </li>
      </ul>
    </section>
    <details v-if="inlineParts.length" class="content-email__details">
      <summary>Inline content · {{ inlineParts.length }}</summary>
      <ul>
        <li v-for="part in inlineParts" :key="part.block.id" class="content-email__part">
          <MimePartItem
            :content="part.solvedContent"
            :loading="materializing.has(part.block.id)"
            :error="materializeErrors.get(part.block.id)"
            @download="materialize(part.block.id)"
          />
        </li>
      </ul>
    </details>
    <details v-if="conversations.length" class="content-email__details">
      <summary>Related messages · {{ conversations.length }}</summary>
      <ul>
        <li v-for="target in conversations" :key="target.block.id">
          <button
            type="button"
            class="content-email__message-link"
            @click="navigate(target.block.id)"
          >
            {{
              target.solvedContent.subject ||
              target.solvedContent.message_id ||
              `Message #${target.block.id}`
            }}
          </button>
        </li>
      </ul>
    </details>
  </article>
</template>

<style scoped lang="scss" src="./contentEmail.scss" />
