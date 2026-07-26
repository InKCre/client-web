const deploymentId = process.env.CLOUDFLARE_PAGES_DEPLOYMENT_ID
const deploymentUrl = process.env.CLOUDFLARE_PAGES_DEPLOYMENT_URL

if (!deploymentId) {
  throw new Error('Wrangler did not report a Cloudflare Pages deployment ID')
}
if (!deploymentUrl) {
  throw new Error('Wrangler did not report a Cloudflare Pages deployment URL')
}

const origin = new URL(deploymentUrl)
if (origin.protocol !== 'https:' || !origin.hostname.endsWith('.pages.dev')) {
  throw new Error(`unexpected Cloudflare Pages deployment URL: ${origin.origin}`)
}

async function readStaticPage(path) {
  let lastError

  for (let attempt = 1; attempt <= 5; attempt += 1) {
    try {
      const response = await fetch(new URL(path, origin), {
        redirect: 'error',
        signal: AbortSignal.timeout(5000),
      })
      const body = await response.text()
      if (!response.ok) {
        throw new Error(`Pages smoke ${path} returned HTTP ${response.status}`)
      }
      if (!response.headers.get('content-type')?.startsWith('text/html')) {
        throw new Error(`Pages smoke ${path} did not return HTML`)
      }
      if (!body.includes('<div id="app"></div>')) {
        throw new Error(`Pages smoke ${path} did not return the client-web shell`)
      }
      return
    } catch (error) {
      lastError = error
      if (attempt < 5) {
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }
    }
  }

  throw lastError
}

await readStaticPage('/')
await readStaticPage('/__inkcre_pages_spa_smoke')

if (process.env.GITHUB_STEP_SUMMARY) {
  const { appendFile } = await import('node:fs/promises')
  await appendFile(
    process.env.GITHUB_STEP_SUMMARY,
    [
      '## Cloudflare Pages deployment',
      '',
      `- Deployment ID: \`${deploymentId}\``,
      `- URL: ${origin.origin}`,
      '- Root and SPA fallback smoke: passed',
      '',
    ].join('\n')
  )
}
