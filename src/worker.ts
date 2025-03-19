import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { Hono } from 'hono'
import { DurableMCP } from 'workers-mcp'
import server from './server'

export class McpServerCloudflare extends DurableMCP<{}> {
  // The code in this repo uses the lower-level Server class, but all DurableMCP cares about is that it has a
  // .connect(transport) method, which ours does. We can fix this later.
  server = server as unknown as McpServer

  async init() {
    // Nothing to do here, `server` is already set up.
  }
}

const app = new Hono()

// TODO: we can build a whole app
// app.get('/', async (c) => {
//   return c.json({ hello: 'world' })
// })

// If none of the above routes match, then let McpServerCloudflare
// have a go (looks for /sse and /sse/message)
app.route('/', McpServerCloudflare.mount('/sse'))

export default app
