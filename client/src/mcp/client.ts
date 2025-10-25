import { experimental_createMCPClient as createMCPClient, experimental_MCPClient as MCPClient} from 'ai';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import loadEnvironmentDefinitions from '../bootstrap';


loadEnvironmentDefinitions();

export async function client(userToken: string): Promise<MCPClient> {
    try {
        let client: MCPClient;

        // Connect to an MCP server and pass bearer token for authentication
        const httpTransport = new StreamableHTTPClientTransport(
            new URL(process.env.REMOTE_MCP_SERVER_BASE_URL || 'http://localhost:3000/mcp'),
            {
                requestInit: {
                    headers: {
                        'Authorization': `Bearer ${userToken}`
                    },
                },
            }
        );
        client = await createMCPClient({
            transport: httpTransport,
            name: 'demo-mcp-client',
        });

        // Alternatively, you can connect to other MCP servers (from the same or a different type, e.g., an SSE MCP server)
        const sseTransport = new SSEClientTransport(
            new URL('http://localhost:3000/sse'),
            {
                requestInit: {
                    headers: {
                        'Authorization': `Bearer ${userToken}`
                    },
                },
            }
        );

        return client;
    } catch (error) {
        console.error('Error creating MCP client:', error);
        throw error;
    }
}
