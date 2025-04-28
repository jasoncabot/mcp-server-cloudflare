import { queryWorkersObservability, handleWorkerLogsKeys, handleWorkerLogsValues } from '@repo/mcp-common/src/api/workers-observability'
import { zKeysRequest, zQueryRunRequest, zValuesRequest } from '@repo/mcp-common/src/types/workers-logs-schemas'

import type { ObservabilityMCP } from '../index'

/**
 * Registers the logs analysis tool with the MCP server
 * @param server The MCP server instance
 * @param accountId Cloudflare account ID
 * @param apiToken Cloudflare API token
 */
export function registerObservabilityTools(agent: ObservabilityMCP) {
	// Register the worker logs analysis tool by worker name
	agent.server.tool(
		'query_worker_observability',
		`
Query the Workers Observability API to analyze recent logs from your Cloudflare Workers.

This API can do 3 things. Here are the capabilities with an example

List events - Show me errors for the worker api-proxy.
Do calculations - what is the p99 of the wall time for the invocations of the worker api-proxy.
Find invocations - Find a request with an error where the user was thomas.

These capabilities can be selected using the view field.

When selecting a calculation unless its a count you need to find a value to pass in:
I.e. avg would require that you find a number field and pass that in as the key for the calculation.
You can only select calculations defined in the schema, other options are not available.


When filtering unless you are extremely confident about the filter you are adding run the observability_keys and observability_values query to confirm the filter will be effective.

For parsing the results here are some suggestions:
* Show Invocations in a table.
* Use a chart to visualise the calculations.
* Show a table for events but if a user asks you to see more show the JSON for a single event. The user might hint for a value in the event. Show them the event that matches their hint.
`,

		{
			query: zQueryRunRequest,
		},
		async ({ query }) => {
			const accountId = agent.getActiveAccountId()
			if (!accountId) {
				return {
					content: [
						{
							type: 'text',
							text: 'No currently active accountId. Try listing your accounts (accounts_list) and then setting an active account (set_active_account)',
						},
					],
				}
			}
			try {
				const response = await queryWorkersObservability(agent.props.accessToken, accountId, query)
				return {
					content: [
						{
							type: 'text',
							text: JSON.stringify(response),
						},
					],
				}
			} catch (error) {
				return {
					content: [
						{
							type: 'text',
							text: JSON.stringify({
								error: `Error analyzing worker logs: ${error instanceof Error && error.message}`,
							}),
						},
					],
				}
			}
		}
	)

	agent.server.tool('observability_keys', `
Find keys in the workers observability Data. This tool should be used to ensure that the filters or calculations that you are adding to your query are valid.
Filters can be added to this query but because it is faster to return lots of keys set a high limit and only add the filter $metadata.service to filter by worker name.
		`, { keysQuery: zKeysRequest }, async ({ keysQuery }) => {
		const accountId = agent.getActiveAccountId()
		if (!accountId) {
			return {
				content: [
					{
						type: 'text',
						text: 'No currently active accountId. Try listing your accounts (accounts_list) and then setting an active account (set_active_account)',
					},
				],
			}
		}
		try {

			const result = await handleWorkerLogsKeys(agent.props.accessToken, accountId, keysQuery)
			return {
				content: [
					{
						type: 'text',
						text: JSON.stringify(result),
					},
				],
			}
		} catch (error) {
			return {
				content: [
					{
						type: 'text',
						text: JSON.stringify({
							error: `Error retrieving worker telemetry keys: ${error instanceof Error && error.message}`,
						}),
					},
				],
			}
		}
	})

	agent.server.tool('observability_values', `
Find values in the workers observability Data. This tool should be used to ensure that the filters that you are adding to your query are valid.
`,
		{ valuesQuery: zValuesRequest },
		async ({ valuesQuery }) => {
			const accountId = agent.getActiveAccountId()
			if (!accountId) {
				return {
					content: [
						{
							type: 'text',
							text: 'No currently active accountId. Try listing your accounts (accounts_list) and then setting an active account (set_active_account)',
						},
					],
				}
			}
			try {
				const result = await handleWorkerLogsValues(agent.props.accessToken, accountId, valuesQuery)
				return {
					content: [
						{
							type: 'text',
							text: JSON.stringify(result),
						},
					],
				}
			} catch (error) {
				return {
					content: [
						{
							type: 'text',
							text: JSON.stringify({
								error: `Error retrieving worker telemetry values: ${error instanceof Error && error.message}`,
							}),
						},
					],
				}
			}
		})
}
