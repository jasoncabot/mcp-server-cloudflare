// Debug logging

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
export const config = isWorkers()
  ? {}
  : {
      accountId: process.env.CLOUDFLARE_ACCOUNT_ID,
      apiToken: process.env.CLOUDFLARE_API_TOKEN,
    }

export { version as mcpCloudflareVersion } from '../../package.json'
