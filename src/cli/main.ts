// Start server
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { log } from '../utils/helpers'
import server from '../server'

export async function main() {
  log('Starting server...')
  try {
    const transport = new StdioServerTransport()
    log('Created transport')
    await server.connect(transport)
    log('Server connected and running')
  } catch (error) {
    log('Fatal error:', error)
    process.exit(1)
  }
}
