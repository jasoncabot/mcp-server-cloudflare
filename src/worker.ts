import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { Hono } from 'hono'
import { DurableMCP } from 'workers-mcp'
import { z } from 'zod'

export class McpServerCloudflare extends DurableMCP<{}> {
  server = new McpServer({
    name: 'Cloudflare MCP Server',
    version: '1.0.0',
  })

  async init() {
    this.server.tool(
      'add',
      'Add two numbers the way only MCP can',
      { a: z.number(), b: z.number() },
      async ({ a, b }) => {
        return {
          content: [{ type: 'text', text: String(a + b) }],
        }
      },
    )
  }
}

const app = new Hono()

app.get('/', async (c) => {
  return c.json({ hello: 'world' })
})

// If none of the above routes match, then let McpServerCloudflare have a go (looks for /sse and /sse/message)
app.route('/', McpServerCloudflare.mount('/sse'))

export default app
