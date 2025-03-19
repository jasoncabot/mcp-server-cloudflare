import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { Hono } from 'hono'
import { DurableMCP } from 'workers-mcp'
import server from './server'
import { AuthRequest, OAuthHelpers, OAuthProvider } from 'workers-mcp/vendor/workers-oauth-provider/oauth-provider.js'
import { fetchUpstreamAuthToken, getUpstreamAuthorizeUrl } from './utils/oauth'
import { withEnv } from 'cloudflare:workers'

export class McpServerCloudflare extends DurableMCP<{}> {
  // The code in this repo uses the lower-level Server class, but all DurableMCP cares about is that it has a
  // .connect(transport) method, which ours does. We can fix this later.
  server = server as unknown as McpServer
  private account_id: number

  async init() {
    /* NOTE: FOR USERS WITH >1 ACCOUNT WE JUST GRAB THE FIRST. THIS NEEDS CHANGING! */
    const { accounts } = this.props
    if (accounts.length > 1) {
      console.log(
        `User has more than one account [${accounts.map((a) => `${a.name} (${a.id})`).join(', ')}], using the first one`,
      )
    }
    this.account_id = accounts[0].id
  }

  // HACK, override `import { env }` within all the tool calls
  async onMessage(request: Request) {
    return withEnv({ USER_API_TOKEN: this.props.tokens.access_token, USER_ACCOUNT_ID: this.account_id }, async () => {
      return await super.onMessage(request)
    })
  }
}

const app = new Hono<{ Bindings: Env & { OAUTH_PROVIDER: OAuthHelpers } }>()

// TODO: this worker can host an entire public website if we want
app.get('/', async (c) => {
  return c.text('Hello, world!')
})

app.get('/authorize', async (c) => {
  const oauthReqInfo = await c.env.OAUTH_PROVIDER.parseAuthRequest(c.req.raw)
  if (!oauthReqInfo.clientId) {
    return c.text('Invalid request', 400)
  }

  return Response.redirect(
    getUpstreamAuthorizeUrl({
      upstream_url: `https://dash.cloudflare.com/oauth2/auth`,
      scope:
        'account:read user:read workers:write workers_kv:write workers_routes:write workers_scripts:write workers_tail:read d1:write pages:write zone:read ssl_certs:write ai:write queues:write pipelines:write offline_access',
      client_id: c.env.CF_CLIENT_ID,
      redirect_uri: new URL('/oauth/callback', c.req.url).href,
      state: btoa(JSON.stringify(oauthReqInfo)),
    }),
  )
})

app.get('/oauth/callback', async (c) => {
  const oauthReqInfo = JSON.parse(atob(c.req.query('state') as string)) as AuthRequest
  if (!oauthReqInfo.clientId) {
    return c.text('Invalid state', 400)
  }

  // Exchange the code for an access token
  const [tokens, errResponse] = await fetchUpstreamAuthToken({
    upstream_url: `https://dash.cloudflare.com/oauth2/token`,
    client_id: c.env.CF_CLIENT_ID,
    client_secret: c.env.CF_CLIENT_SECRET,
    code: c.req.query('code'),
    redirect_uri: new URL('/oauth/callback', c.req.url).href,
  })
  if (errResponse) return errResponse

  // Fetch the user info from Cloudflare
  const userResponse = await fetch(`https://api.cloudflare.com/client/v4/user`, {
    headers: {
      Authorization: `bearer ${tokens.access_token}`,
    },
  })
  if (!userResponse.ok) {
    console.log(await userResponse.text())
    return c.text('Failed to fetch user', 500)
  }

  const user = (await userResponse.json()) as { result: Record<string, string> }
  console.log({ user })

  // Fetch the user info from Cloudflare
  const accountsResponse = await fetch(`https://api.cloudflare.com/client/v4/accounts`, {
    headers: {
      Authorization: `bearer ${tokens.access_token}`,
    },
  })
  if (!accountsResponse.ok) {
    console.log(await accountsResponse.text())
    return c.text('Failed to fetch accounts', 500)
  }
  const { result: accounts } = (await accountsResponse.json()) as { result: { name: string; id: string }[] }

  const { id, email } = user.result
  // Return back to the MCP client a new token
  const { redirectTo } = await c.env.OAUTH_PROVIDER.completeAuthorization({
    request: oauthReqInfo,
    userId: id,
    metadata: {
      label: email,
    },
    scope: oauthReqInfo.scope,
    // This will be available on this.props inside MyMCP
    props: {
      userId: id,
      email,
      tokens,
      accounts,
    },
  })

  return Response.redirect(redirectTo)
})

export default new OAuthProvider({
  apiRoute: '/sse',
  apiHandler: McpServerCloudflare.mount('/sse'),
  defaultHandler: app,
  authorizeEndpoint: '/authorize',
  tokenEndpoint: '/token',
  clientRegistrationEndpoint: '/register',
})
