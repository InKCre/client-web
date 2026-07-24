const token = process.env.CLOUDFLARE_API_TOKEN
const accountId = process.env.CLOUDFLARE_ACCOUNT_ID
const project = process.env.CLOUDFLARE_PAGES_PROJECT
const branch = process.env.CLOUDFLARE_PAGES_BRANCH

if (!token || !accountId || !project || !branch) {
  throw new Error('Cloudflare account, project, branch, and token are required')
}
if (!/^preview\/client-web\/pr-[1-9][0-9]*$/.test(branch)) {
  throw new Error(`refusing to clean unexpected Pages branch: ${branch}`)
}

const endpoint = `https://api.cloudflare.com/client/v4/accounts/${accountId}/pages/projects/${project}/deployments`
const headers = {
  Authorization: `Bearer ${token}`,
  'Content-Type': 'application/json',
}
const deployments = []
let page = 1
let totalPages = 1

do {
  const response = await fetch(`${endpoint}?env=preview&page=${page}&per_page=100`, { headers })
  if (!response.ok) {
    throw new Error(`Cloudflare deployment listing failed with HTTP ${response.status}`)
  }
  const payload = await response.json()
  if (payload.success !== true || !Array.isArray(payload.result)) {
    throw new Error('Cloudflare deployment listing returned an invalid response')
  }
  deployments.push(
    ...payload.result.filter(
      (deployment) => deployment.deployment_trigger?.metadata?.branch === branch
    )
  )
  totalPages = Math.max(1, Number(payload.result_info?.total_pages ?? 1))
  page += 1
} while (page <= totalPages)

for (const deployment of deployments) {
  const deletion = await fetch(`${endpoint}/${deployment.id}?force=true`, {
    method: 'DELETE',
    headers,
  })
  if (!deletion.ok && deletion.status !== 404) {
    throw new Error(
      `Cloudflare deployment ${deployment.id} deletion failed with HTTP ${deletion.status}`
    )
  }
}

console.log(
  JSON.stringify({
    project,
    branch,
    deleted: deployments.map((deployment) => deployment.id),
  })
)
