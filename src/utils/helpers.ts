// Debug logging
import { env } from 'cloudflare:workers'

export function isWorkers() {
  // @ts-ignore
  return navigator.userAgent === 'Cloudflare-Workers'
}

const debug = true
export function log(...args: any[]) {
  const msg = `[DEBUG ${new Date().toISOString()}] ${args.join(' ')}\n`
  if (isWorkers()) {
    console.log(msg)
  } else {
    process.stderr.write(msg)
  }
}

// Config
// @ts-ignore
export const config: Record<string, string> = isWorkers()
  ? {
      get accountId() {
        return env.USER_ACCOUNT_ID
      },
      get apiToken() {
        return env.USER_API_TOKEN
      },
    }
  : {
      accountId: process.env.CLOUDFLARE_ACCOUNT_ID,
      apiToken: process.env.CLOUDFLARE_API_TOKEN,
    }

export { version as mcpCloudflareVersion } from '../../package.json'
