import {
  observeOperation,
  injectPeerContext,
  SpanKind,
  SpanStatusCode,
  type Context,
} from '../obsrv/telemetry'
import { z } from 'zod'
import { authStore } from '../auth'
import { configStore } from '../config'
import {
  PEER_EXECUTION_HEADER,
  PEER_HTTP_PROTOCOL,
  PEER_NOT_EXECUTED,
  type JsonValue,
  PeerOutcomeUnknown,
  PeerProtocolConfigurationError,
  PeerProtocolError,
  PeerProtocolRequestSchema,
  PeerProtocolResponseSchema,
  PeerRequestNotExecuted,
} from './contracts'
import type { Peer } from './peer'

const HTTP_TOKEN = /^[!#$%&'*+.^_`|~0-9A-Za-z-]+$/
const RESERVED_REQUEST_HEADERS = new Set([
  'authorization',
  'connection',
  'content-length',
  'host',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
])

const PeerHTTPInboundParametersSchema = z.object({
  method: z
    .string()
    .transform((value) => value.toUpperCase())
    .refine((value) => HTTP_TOKEN.test(value), 'HTTP method must be one valid token'),
  url: z.url().superRefine((value, context) => {
    const url = new URL(value)
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.hash) {
      context.addIssue({
        code: 'custom',
        message: 'Peer HTTP URL must be absolute HTTP(S) without credentials or fragment',
      })
    }
  }),
})

type Fetch = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>

export class PeerHTTPOutbound {
  readonly protocol = PEER_HTTP_PROTOCOL
  private readonly parameters: z.infer<typeof PeerHTTPInboundParametersSchema>

  constructor(
    private readonly peer: Peer,
    parameters: Record<string, JsonValue>,
    private readonly fetcher: Fetch = globalThis.fetch.bind(globalThis)
  ) {
    const parsed = PeerHTTPInboundParametersSchema.safeParse(parameters)
    if (!parsed.success) {
      throw new PeerProtocolConfigurationError(
        `Peer ${peer.id} published invalid HTTP inbound parameters`
      )
    }
    this.parameters = parsed.data
  }

  async execute(payload: JsonValue, parent?: Context): Promise<JsonValue> {
    return observeOperation(
      'peer.http',
      async (active, span, result) => {
        const parsed = PeerProtocolRequestSchema.safeParse(payload)
        if (!parsed.success) throw new PeerProtocolError('Invalid Peer HTTP request envelope')
        const request = parsed.data
        const url = new URL(this.parameters.url)
        for (const [name, values] of Object.entries(request.query)) {
          for (const value of values) url.searchParams.append(name, value)
        }

        const headers = new Headers()
        for (const [name, values] of Object.entries(request.headers)) {
          if (RESERVED_REQUEST_HEADERS.has(name)) {
            throw new PeerProtocolError(`Peer HTTP payload attempted reserved header: ${name}`)
          }
          for (const value of values) headers.append(name, value)
        }
        headers.set('Authorization', `Bearer ${await authStore.getToken()}`)

        let body: string | undefined
        if (Object.prototype.hasOwnProperty.call(request, 'body')) {
          body = JSON.stringify(request.body)
          if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json')
        }

        const propagating = injectPeerContext(active, headers)
        let response: Response
        try {
          response = await this.fetcher(url, {
            method: this.parameters.method,
            // A redirect could disclose deployment context beyond the configured Peer endpoint.
            ...(propagating ? { redirect: 'error' as const } : {}),
            headers,
            body,
            signal: AbortSignal.timeout(configStore.peerConfig.peer_http_timeout_ms),
          })
        } catch (error) {
          throw new PeerOutcomeUnknown(
            `Peer ${this.peer.id} dispatch may have executed: ${error instanceof Error ? error.message : 'fetch failed'}`
          )
        }

        span?.setAttribute('http.response.status_code', response.status)
        if (response.status >= 400) {
          result.outcome = 'error'
          span?.setStatus({ code: SpanStatusCode.ERROR })
        }
        if (
          response.headers.get(PEER_EXECUTION_HEADER)?.trim().toLowerCase() === PEER_NOT_EXECUTED
        ) {
          throw new PeerRequestNotExecuted(`Peer ${this.peer.id} reported non-execution`)
        }

        const responseHeaders: Record<string, string[]> = {}
        response.headers.forEach((value, name) => {
          responseHeaders[name.toLowerCase()] = [value]
        })
        const responseEnvelope: Record<string, unknown> = {
          status: response.status,
          headers: responseHeaders,
        }
        let text: string
        try {
          text = await response.text()
        } catch (error) {
          throw new PeerOutcomeUnknown(
            `Peer ${this.peer.id} response could not be read after dispatch: ${error instanceof Error ? error.message : 'response read failed'}`
          )
        }
        if (text) {
          try {
            responseEnvelope.body = JSON.parse(text)
          } catch {
            throw new PeerProtocolError(`Peer ${this.peer.id} returned a non-JSON HTTP body`)
          }
        }
        return PeerProtocolResponseSchema.parse(responseEnvelope) as JsonValue
      },
      {
        kind: SpanKind.CLIENT,
        attributes: {
          'inkcre.peer.target.id': this.peer.id,
          'http.request.method': this.parameters.method,
        },
      },
      parent
    )
  }
}
