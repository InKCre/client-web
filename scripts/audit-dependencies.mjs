import { spawn } from 'node:child_process'
import { createServer } from 'node:http'
import { once } from 'node:events'

const auditPath = '/-/npm/v1/security/advisories/bulk'
const npmAuditUrl = new URL(auditPath, 'https://registry.npmjs.org')

function isGzip(body) {
  return body.length >= 2 && body[0] === 0x1f && body[1] === 0x8b
}

async function proxyAudit(request, response) {
  if (request.method !== 'POST' || request.url !== auditPath) {
    response.writeHead(404).end()
    return
  }

  try {
    const chunks = []
    for await (const chunk of request) chunks.push(chunk)

    const upstream = await fetch(npmAuditUrl, {
      body: Buffer.concat(chunks),
      headers: {
        'content-type': 'application/json',
        'user-agent': request.headers['user-agent'] ?? 'inkcre-audit-transport',
      },
      method: 'POST',
      signal: AbortSignal.timeout(15_000),
    })
    const body = Buffer.from(await upstream.arrayBuffer())
    const contentEncoding = upstream.headers.get('content-encoding')

    response.statusCode = upstream.status
    response.setHeader('content-type', upstream.headers.get('content-type') ?? 'application/json')
    if (contentEncoding) {
      response.setHeader('content-encoding', contentEncoding)
    } else if (isGzip(body)) {
      response.setHeader('content-encoding', 'gzip')
    }
    response.end(body)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    response.writeHead(502, { 'content-type': 'application/json' })
    response.end(JSON.stringify({ error: `npm audit transport failed: ${message}` }))
  }
}

async function runAudit(registry) {
  const child = spawn(
    'pnpm',
    ['audit', '--audit-level', 'high', `--registry=${registry.origin}/`],
    {
      env: process.env,
      stdio: 'inherit',
    }
  )
  const timeout = setTimeout(() => child.kill('SIGTERM'), 60_000)

  const [exitCode, signal] = await once(child, 'exit')
  clearTimeout(timeout)

  if (signal) {
    throw new Error(`pnpm audit was terminated by ${signal}`)
  }
  return exitCode ?? 1
}

const server = createServer((request, response) => {
  void proxyAudit(request, response)
})

server.listen(0, '127.0.0.1')
await once(server, 'listening')

const address = server.address()
if (!address || typeof address === 'string') {
  throw new Error('failed to bind the local npm audit transport')
}

try {
  process.exitCode = await runAudit(new URL(`http://127.0.0.1:${address.port}`))
} finally {
  server.closeAllConnections()
  server.close()
}
