# Container MCP Server

This is a simple MCP-based interface for a sandboxed development environment.

## Local Dev

Local dev is currently only supported for Cloudflare employees.

Cloudchamber local dev isn't implemented yet, so we are doing a bit of a hack to just run the server in your local environment. Because of this, testing the container(s) and container manager locally is not possible at this time.

Do the following from within the sandbox-container app:

1. Copy the `.dev.vars.example` file to a new `.dev.vars` file.
2. Get the Cloudflare client id and secret from a team member and add them to the `.dev.vars` file.
3. Run `pnpm i` then `pnpm dev` to start the MCP server.
4. Run `pnpx @modelcontextprotocol/inspector` to start the MCP inspector client. To avoid potential bugs in newer releases of the inspector, you can specify a version, such as `pnpx @modelcontextprotocol/inspector@0.9.0`.
5. Open the inspector client in your browser and connect to the server via `http://localhost:8976/sse`.

Note: Temporary files created through files tool calls are stored in the workdir folder of this app.

## Deploying

Deploying is currently only supported for Cloudflare employees.

1. Make sure the docker daemon is running

2. Disable WARP and run

```
npx https://prerelease-registry.devprod.cloudflare.dev/workers-sdk/runs/14387504770/npm-package-wrangler-8740 deploy
```

3. Upload the CLOUDFLARE_CLIENT_ID and CLOUDFLARE_CLIENT_SECRET secrets to the deployed Worker.

## Connecting This MCP Server with A Client

To use this MCP server with Claude Desktop:

1. Add the section below to your Claude config.

```
{
    "mcpServers": {
        "container": {
            "command": "npx",
            "args": [
                "mcp-remote",
                "https://containers-staging.mcp.cloudflare.com/sse"
            ]
        }
    }
}
```

2. If you're using Cloudflare WARP, add the section below to your Claude config:

```
    "env": {
        "NODE_EXTRA_CA_CERTS": "<path to warp certs file>"
    }
```

3. Remove node versions older than 18 from your local machine.

You can read more about using an MCP server with Claude in the [official MCP documentation](https://modelcontextprotocol.io/quickstart/user).

## Tools

- `container_initialize`: (Re)start a container. Containers are intended to be ephemeral and don't save any state. Containers are only guaranteed to last 10m (this is just because I have a max of like ~5 containers per account).
- `container_ping`: Ping a container for connectivity
- `container_exec`: Run a command in the shell
- `container_file_write`: Write to a file
- `container_files_list`: List all files in the work directory
- `container_file_read`: Read the contents of a single file or directory
- `container_file_delete`: Delete a single file or directory

## Resources

TODO

Tried implementing these, but MCP clients don't support resources well at all.

## Prompts

TODO

## Container support

The container currently runs python and node. It's connected to the internet and LLMs can install whatever packages.
