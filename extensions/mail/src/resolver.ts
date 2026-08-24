import { markRaw } from 'vue'
import {
  Block,
  PeerManager,
  PeerProtocolResponseSchema,
  Relation,
  Resolver,
  ResolverCache,
  type ProjectionOptions,
} from '@inkcre/core'

import ContentEmail from './components/contentEmail/contentEmail.vue'
import ContentEmailPreview from './components/contentEmail/contentEmailPreview.vue'
import ContentMailFact from './components/contentMailFact/contentMailFact.vue'
import ContentMailFactPreview from './components/contentMailFact/contentMailFactPreview.vue'
import ContentMimePart from './components/contentMimePart/contentMimePart.vue'
import ContentMimePartPreview from './components/contentMimePart/contentMimePartPreview.vue'
import {
  CanonicalEmailAddressSchema,
  CanonicalEmailSchema,
  CanonicalMailFlagSchema,
  CanonicalMailboxSchema,
  CanonicalMimePartSchema,
  ComponentRelationSchema,
  ContainsRelationSchema,
  EmbeddedReferenceRelationSchema,
  ParticipantRelationSchema,
  parseJson,
  type CanonicalEmailAddress,
  type CanonicalMailFlag,
  type CanonicalMailbox,
  type SolvedBlock,
  type SolvedEmail,
  type SolvedMimePart,
} from './schema'

export const MAIL_MIME_PART_MATERIALIZE_CAPABILITY = 'extensions.mail.mime_part.materialize.v1'

async function solveBlock<Content>(
  block: Block,
  options: ProjectionOptions
): Promise<SolvedBlock<Content>> {
  const resolver = await ResolverCache.getResolver(block)
  return {
    block,
    solvedContent: (await resolver.getSolvedContent({
      ...options,
      materializeMissing: false,
    })) as Content,
  }
}

function parseRelation(content: string): unknown {
  try {
    return parseJson(content)
  } catch {
    return null
  }
}

async function relatedBlocks(relations: Relation[], focal: number): Promise<Map<number, Block>> {
  const refs = new Set(
    relations.map((relation) => (relation.from_ === focal ? relation.to_ : relation.from_))
  )
  const blocks = await Promise.all([...refs].map((ref) => Block.find(ref)))
  return new Map(
    blocks.filter((block): block is Block => block !== null).map((block) => [block.id, block])
  )
}

export class EmailResolver extends Resolver<string, SolvedEmail> {
  static readonly type = 'extensions.mail.email.v1'
  static readonly previewRenderer = markRaw(ContentEmailPreview)
  static readonly solvedContentRenderer = markRaw(ContentEmail)

  static {
    Resolver.register(EmailResolver.type, EmailResolver)
  }

  protected async _getSolvedContent(options: ProjectionOptions): Promise<SolvedEmail> {
    const root = CanonicalEmailSchema.parse(parseJson(await this.getRawContent(options)))
    const relations = await this.getRelations({ refresh: options.refresh })
    const blocks = await relatedBlocks(relations, this.block.id)
    const result: SolvedEmail = {
      root,
      bodies: [],
      mimeParts: [],
      participants: [],
      mailboxes: [],
      flags: [],
      parents: [],
      references: [],
      embedded: [],
    }

    for (const relation of relations) {
      const outgoing = relation.from_ === this.block.id
      const related = blocks.get(outgoing ? relation.to_ : relation.from_)
      if (!related) continue

      if (outgoing) {
        const component = ComponentRelationSchema.safeParse(parseRelation(relation.content))
        if (component.success && component.data.role === 'body') {
          if (!['core.text.v1', 'core.html.v1'].includes(related.resolver)) continue
          result.bodies.push({
            ...(await solveBlock<string>(related, options)),
            relation: component.data,
          })
          continue
        }
        if (component.success && component.data.role !== 'body') {
          if (related.resolver !== MailMimePartResolver.type) continue
          result.mimeParts.push({
            ...(await solveBlock<SolvedMimePart>(related, options)),
            relation: component.data,
          })
          continue
        }

        const participant = ParticipantRelationSchema.safeParse(parseRelation(relation.content))
        if (participant.success && related.resolver === EmailAddressResolver.type) {
          result.participants.push({
            relation: participant.data,
            address: await solveBlock<CanonicalEmailAddress>(related, options),
          })
          continue
        }
        if (related.resolver === EmailResolver.type && relation.content.startsWith('parent:')) {
          result.parents.push({
            block: related,
            solvedContent: CanonicalEmailSchema.parse(parseJson(related.content)),
          })
        } else if (
          related.resolver === EmailResolver.type &&
          relation.content.startsWith('reference:')
        ) {
          result.references.push({
            block: related,
            solvedContent: CanonicalEmailSchema.parse(parseJson(related.content)),
          })
        }
        continue
      }

      const contains = ContainsRelationSchema.safeParse(parseRelation(relation.content))
      if (contains.success && related.resolver === MailboxResolver.type) {
        result.mailboxes.push({
          relation: contains.data,
          mailbox: await solveBlock<CanonicalMailbox>(related, options),
        })
      } else if (relation.content === 'tags' && related.resolver === MailFlagResolver.type) {
        result.flags.push({ flag: await solveBlock<CanonicalMailFlag>(related, options) })
      }
    }

    const mimeParts = new Map(result.mimeParts.map((part) => [part.block.id, part]))
    for (const body of result.bodies.filter((item) => item.block.resolver === 'core.html.v1')) {
      for (const relation of await Relation.getByBlock(body.block.id)) {
        if (relation.from_ !== body.block.id) continue
        const embedded = EmbeddedReferenceRelationSchema.safeParse(parseRelation(relation.content))
        const mimePart = mimeParts.get(relation.to_)
        if (embedded.success && mimePart) {
          result.embedded.push({
            body: body.block,
            reference: embedded.data.reference,
            mimePart,
          })
        }
      }
    }
    return result
  }

  async materializeMimePart(blockRef: number): Promise<SolvedEmail> {
    const block = await Block.get(blockRef)
    if (block.resolver !== MailMimePartResolver.type) {
      throw new TypeError(`Block ${blockRef} is not a Mail MIME part`)
    }
    const resolver = await ResolverCache.getResolver<MailMimePartResolver>(block)
    await resolver.getSolvedContent({ refresh: true, materializeMissing: true })
    return this.getSolvedContent({ refresh: true, materializeMissing: false })
  }

  async getText(options: ProjectionOptions = {}): Promise<string> {
    const email = await this.getSolvedContent(options)
    if (options.context === 'lexical') {
      return email.root.subject || email.root.message_id || 'email'
    }
    const body = email.bodies.find((item) => item.block.resolver === 'core.text.v1')
    return [email.root.subject, body?.solvedContent].filter(Boolean).join('\n\n') || 'email'
  }
}

abstract class JsonMailResolver<Content> extends Resolver<string, Content> {
  abstract readonly schema: { parse(value: unknown): Content }

  protected async _getSolvedContent(options: ProjectionOptions): Promise<Content> {
    return this.schema.parse(parseJson(await this.getRawContent(options)))
  }

  async getText(options: ProjectionOptions = {}): Promise<string> {
    return JSON.stringify(await this.getSolvedContent(options))
  }
}

export class MailboxResolver extends JsonMailResolver<CanonicalMailbox> {
  static readonly type = 'extensions.mail.mailbox.v1'
  static readonly previewRenderer = markRaw(ContentMailFactPreview)
  static readonly solvedContentRenderer = markRaw(ContentMailFact)
  readonly schema = CanonicalMailboxSchema

  static {
    Resolver.register(MailboxResolver.type, MailboxResolver)
  }
}

export class EmailAddressResolver extends JsonMailResolver<CanonicalEmailAddress> {
  static readonly type = 'extensions.mail.email_address.v1'
  static readonly previewRenderer = markRaw(ContentMailFactPreview)
  static readonly solvedContentRenderer = markRaw(ContentMailFact)
  readonly schema = CanonicalEmailAddressSchema

  static {
    Resolver.register(EmailAddressResolver.type, EmailAddressResolver)
  }
}

export class MailFlagResolver extends JsonMailResolver<CanonicalMailFlag> {
  static readonly type = 'extensions.mail.flag.v1'
  static readonly previewRenderer = markRaw(ContentMailFactPreview)
  static readonly solvedContentRenderer = markRaw(ContentMailFact)
  readonly schema = CanonicalMailFlagSchema

  static {
    Resolver.register(MailFlagResolver.type, MailFlagResolver)
  }
}

export class MailMimePartResolver extends Resolver<string, SolvedMimePart> {
  static readonly type = 'extensions.mail.mime_part.v1'
  static readonly previewRenderer = markRaw(ContentMimePartPreview)
  static readonly solvedContentRenderer = markRaw(ContentMimePart)

  static {
    Resolver.register(MailMimePartResolver.type, MailMimePartResolver)
  }

  protected async _getSolvedContent(options: ProjectionOptions): Promise<SolvedMimePart> {
    const root = CanonicalMimePartSchema.parse(parseJson(await this.getRawContent(options)))
    const relations = await this.getRelations({
      refresh: options.refresh,
      includeIn: false,
      includeOut: true,
    })
    const contentRelation = relations.find((relation) => relation.content === 'content')
    if (contentRelation) {
      const child = await Block.find(contentRelation.to_)
      if (child) return { root, content: await solveBlock(child, options) }
    }
    if (!options.materializeMissing) return { root, content: null }

    const delegated = await PeerManager.delegate(MAIL_MIME_PART_MATERIALIZE_CAPABILITY, {
      body: { block: this.block.id },
    })
    const response = PeerProtocolResponseSchema.parse(delegated)
    if (response.status !== 200 || !Object.prototype.hasOwnProperty.call(response, 'body')) {
      throw new Error(`Mail materialization Peer returned HTTP ${response.status}`)
    }
    const child = Block.parse(response.body)
    return { root, content: await solveBlock(child, options) }
  }

  async getText(options: ProjectionOptions = {}): Promise<string> {
    const { root } = await this.getSolvedContent({ ...options, materializeMissing: false })
    return [root.filename, root.description, root.media_type].filter(Boolean).join('\n')
  }
}
