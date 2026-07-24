import { get } from 'node:https'

const target = process.argv[2]
const instance = process.argv[3]
const names = {
  web: 'client-web',
  webext: 'webext',
}

if (!names[target] || !instance || !/^[a-f0-9]{16}$/.test(instance)) {
  process.exit(2)
}

const url = `https://${names[target]}-${instance}.localhost/__inkcre/dev/${instance}`

const observation = await new Promise((resolve) => {
  const request = get(
    url,
    {
      rejectUnauthorized: false,
      timeout: 3_000,
    },
    (response) => {
      let body = ''
      response.setEncoding('utf8')
      response.on('data', (chunk) => {
        if (body.length <= 4_096) body += chunk
      })
      response.on('end', () => {
        if (response.statusCode !== 200 || body.length > 4_096) {
          resolve(false)
          return
        }

        try {
          const identity = JSON.parse(body)
          resolve(identity.instance === instance && identity.target === target)
        } catch {
          resolve(false)
        }
      })
    }
  )

  request.once('error', () => resolve(false))
  request.once('timeout', () => {
    request.destroy()
    resolve(false)
  })
})

process.exitCode = observation ? 0 : 1
