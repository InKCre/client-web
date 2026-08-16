<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { InkButton } from '@inkcre/ui-web'
import DOMPurify from 'dompurify'
import { getInfoBaseRouter, type SolvedContentRendererProps } from '@inkcre/core'

import type { EmailResolver } from '../../resolver'
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
  return `<!doctype html><html><head><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src blob:"></head><body>${document.body.innerHTML}</body></html>`
})

async function materialize(block: number): Promise<void> {
  materializing.value = new Set(materializing.value).add(block)
  const errors = new Map(materializeErrors.value)
  errors.delete(block)
  materializeErrors.value = errors
  try {
    email.value = await props.resolver.materializeMimePart(block)
  } catch (cause) {
    errors.set(block, cause instanceof Error ? cause.message : String(cause))
    materializeErrors.value = errors
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
      <time v-if="email.root.authored_at">{{ email.root.authored_at.toLocaleString() }}</time>
      <dl>
        <template v-for="[role, values] in participants" :key="role">
          <dt>{{ role.replace(/_/g, ' ') }}</dt>
          <dd>{{ values.join(', ') }}</dd>
        </template>
      </dl>
      <p v-if="email.mailboxes.length">
        {{ email.mailboxes.map((item) => item.mailbox.solvedContent.name).join(', ') }}
        <span v-if="email.flags.length">
          · {{ email.flags.map((item) => item.flag.solvedContent.name).join(', ') }}</span
        >
      </p>
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

    <section v-if="email.mimeParts.length" class="content-email__parts">
      <h3>Attachments and inline content</h3>
      <article v-for="part in email.mimeParts" :key="part.block.id" class="content-email__part">
        <div>
          <strong>{{
            part.solvedContent.root.filename ||
            part.solvedContent.root.description ||
            part.solvedContent.root.media_type
          }}</strong>
          <span>{{ part.solvedContent.root.media_type }}</span>
        </div>
        <a
          v-if="objectUrl(part.solvedContent)"
          :href="objectUrl(part.solvedContent) || undefined"
          target="_blank"
          rel="noopener noreferrer"
          >Open</a
        >
        <InkButton
          v-else
          text="Download"
          :loading="materializing.has(part.block.id)"
          @click="materialize(part.block.id)"
        />
        <p v-if="materializeErrors.get(part.block.id)">
          {{ materializeErrors.get(part.block.id) }}
        </p>
      </article>
    </section>

    <section
      v-if="email.parents.length || email.references.length"
      class="content-email__references"
    >
      <h3>Conversation</h3>
      <InkButton
        v-for="target in email.parents"
        :key="`parent-${target.block.id}`"
        :text="`View reply target: ${target.solvedContent.subject || target.solvedContent.message_id || `#${target.block.id}`}`"
        @click="navigate(target.block.id)"
      />
      <InkButton
        v-for="target in email.references"
        :key="`reference-${target.block.id}`"
        :text="`View reference: ${target.solvedContent.subject || target.solvedContent.message_id || `#${target.block.id}`}`"
        @click="navigate(target.block.id)"
      />
    </section>
  </article>
</template>

<style scoped lang="scss" src="./contentEmail.scss" />
