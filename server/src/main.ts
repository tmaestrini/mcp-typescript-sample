import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import express, { Request, Response } from 'express';
import authorizeRequest from './auth/validation';
import { server } from './mcp/server';
import { config } from 'dotenv';
import { authContext } from './context/AuthContext';


config();

const app = express();
app.use(express.json());
app.locals.authContext = authContext.Stateless; // auth context is used to make tokens (and further information) available in server tools

/**
 * In STATELESS mode, create a new transport for each request to prevent
 * request ID collisions. Different clients may use the same JSON-RPC request IDs,
 * which would cause responses to be routed to the wrong HTTP connections if
 * the transport state is shared.
 */
app.post('/mcp', authorizeRequest, async (req: Request, res: Response) => {

    // Get the user's token from the request
    const token = req.headers.authorization?.replace('Bearer ', '') as string;

    // Set the auth context for this request
    app.locals.authContext.setAuthContext({
        token,
    });

    try {
        const transport = new StreamableHTTPServerTransport({
            sessionIdGenerator: undefined, // No session ID generator for stateless mode
            enableJsonResponse: true,
        });

        res.on('close', () => {
            transport.close();
        });

        await server.connect(transport);
        await transport.handleRequest(req, res, req.body);
        console.log('Received MCP request:', req.body?.method, req.body?.params);
    } catch (error) {
        console.error('Error handling MCP request:', error);
        if (!res.headersSent) {
            res.status(500).json({
                jsonrpc: '2.0',
                error: {
                    code: -32603,
                    message: 'Internal server error'
                },
                id: null
            });
        }
    }
});

const port = parseInt(process.env.REMOTE_MCP_SERVER_PORT || '3000');

// Start the server and handle potential startup errors
app.listen(port, () => {
    console.log(`MCP Server running on http://localhost:${port}/mcp`);
}).on('error', (error: Error) => {
    console.error('Server error:', error);
    process.exit(1);
});