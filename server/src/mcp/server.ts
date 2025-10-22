import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { authContext } from '../context/AuthContext';
import AuthenticatedApiClient from '../utils/api-client';
import { OnBehalfOfCredential } from '@azure/identity';


// Create the MCP server once (can be reused across requests)
export const server = new McpServer({
    name: 'ts-mcpserver',
    version: '1.0.0'
});

// Set up your tools, resources, and prompts
server.registerTool(
    'echo',
    {
        title: 'Echo Tool',
        description: 'Echoes back the provided message',
        inputSchema: { message: z.string() },
        outputSchema: { echo: z.string() }
    },
    async ({ message }) => {        
        const output = { echo: `Tool echo (with your voice): ${message}` };
        return {
            content: [{ type: 'text', text: JSON.stringify(output) }],
            structuredContent: output
        };
    }
);

server.registerTool(
    'get all users in the user\'s tenant',
    {
        title: 'Secured Backend API from Microsoft Graph wito call all users in the user\'s tenant',
        description: 'Calls a secured backend API using authentication via access token from Microsoft Entra ID. The response contains a list of all users in the user\'s tenant.',
        inputSchema: { companyName: z.string().optional().describe('The company name associated with the tenant') },
        outputSchema: { result: z.string(), authenticated: z.boolean(), userData: z.any().optional() }
    },
    async ({ companyName }) => {
        try {
            const userToken = authContext.Stateless.getAuthContext()?.token;

            // Make OBO request to get access token for backend API on behalf of the user
            const oboTokenCredential = new OnBehalfOfCredential({
                tenantId: process.env.AZURE_TENANT_ID || '',
                clientId: process.env.AZURE_CLIENT_ID || '',
                clientSecret: process.env.AZURE_CLIENT_SECRET || '',
                userAssertionToken: userToken || '',
            });

            // Call the secured Graph API to get all users in the tenant;
            // the token is automatically included in auth context in the backendApiClient
            const client = new AuthenticatedApiClient("https://graph.microsoft.com", {
                scopes: ['https://graph.microsoft.com/.default'],
                tokenCredential: oboTokenCredential,
            })
            const apiResponse = await client.get<any>('/v1.0/users');

            const output = {
                result: `Secured API call processed message: "${companyName}" with data: ${JSON.stringify(apiResponse?.value)}`,
                authenticated: true,
                userData: apiResponse.value
            };

            return {
                content: [{ type: 'text', text: JSON.stringify(output, null, 2) }],
                structuredContent: output
            };
        } catch (error) {
            console.error('Error in secured API call:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            return {
                content: [{ type: 'text', text: `Error: ${errorMessage}` }],
                structuredContent: { result: 'API call failed', authenticated: false, error: errorMessage }
            };
        }
    }
);
