# mcp-typescript-sample

A sample implementation of a production-ready MCP setup (client / server) with authentication, fully implemented in Typescript (Node) using modern ES modules.

> [!NOTE]
> For the sake of demonstration, the agent connects to a locally hosted LLM, served by Ollama. Feel free to integrate an AI stack of your choice instead (see *client implementation* below).

---

## Setup / Prerequisites

Before running either the server or client, ensure you have the following prerequisites in place.

### Development environment (locally)

1. **Node.js** (v18 or higher)
   - Download and install from [nodejs.org](https://nodejs.org/)
   - Verify installation: `node --version`

2. **Ollama** (for the client demonstration)<br/>
    👉 Feel free to use another LLM (running locally or in the cloud and ajust the client implementation below):
   - Install Ollama from [ollama.ai](https://ollama.ai/)
   - Pull the required model: `ollama pull qwen3:4b`
   - Ensure Ollama is running on `http://localhost:11434`

### Microsoft Entra ID

This reference implementation needs a Microsoft Entra ID tenant with an app registration configured:

1. **Microsoft Entra ID App Registration**
   
   - Configure a new app registration in Microsoft Entra ID:
     - API permissions with the custom scope `mcp:tools`
     - Authentication settings (for interactive login in the client)
     - Expose an API with the required scope

    > [!TIP]
    > Regarding the API scope: make sure you add a dedicated scope by exposing a web api in your app registration (follow this link in case you need any guidance: <https://learn.microsoft.com/en-us/entra/identity-platform/quickstart-configure-app-expose-web-apis#add-a-scope-requiring-admin-and-user-consent>).


This information will be used within the client and server setup:

- `AZURE_TENANT_ID`: Your Entra ID tenant
- `AZURE_CLIENT_ID`: Your app registration client ID
- `AZURE_CLIENT_SECRET`: Your app registration client secret (for server)
- `AZURE_CLIENT_SCOPE`: The API scope (format: `api://<client-id>/mcp:tools`)

## Project Structure (Architecture)

This monorepo contains two main components:

- **`/server`**: MCP server implementation with Express.js, JWT authentication, and MCP SDK
- **`/client`**: MCP client implementation with AI SDK integration and interactive CLI

### Server

**Key Features:**

- **JWT Authentication**: Validates tokens from Entra ID using JWKS
- **Stateless Mode**: Creates new transport for each request to prevent ID collisions
- **Secure API**: Validates scopes, issuer, and token signatures
- **Express.js**: HTTP server with JSON-RPC over HTTP transport

**Server Architecture:**

```text
server/
├── src/
│   ├── main.ts              # Express server setup
│   ├── auth/
│   │   └── validation.ts    # JWT validation middleware
│   ├── context/
│   │   └── AuthContext.ts   # Authentication context management
│   ├── mcp/
│   │   └── server.ts        # MCP server implementation
│   └── utils/
│       └── api-client.ts    # API client utilities
```

### Client 

**Key Features:**

- **Interactive Authentication**: Uses Entra ID interactive token request flow
- **MCP Client**: Connects to remote MCP server with HTTP transport
- **AI SDK Integration**: Works with Vercel AI SDK for LLM interactions
- **Streaming Responses**: Real-time streaming of LLM responses
- **Tool Calling**: Automatically invokes MCP tools based on LLM requests

**Client Architecture:**

```text
client/
├── src/
│   ├── main.ts                          # CLI application entry point
│   ├── bootstrap.ts                     # Environment configuration loader
│   ├── mcp/
│   │   └── client.ts                    # MCP client factory
│   └── utils/
│       └── TokenAcquisitionHelper.ts    # Entra ID token acquisition
```

## Minimal Path to awesome

### Server

The MCP server provides authenticated access to MCP tools via HTTP transport.

#### 1. Configure Environment Variables

Navigate to the `server` directory and create a `.env` file from the template:

```bash
cd server
cp .env.template .env
```

Edit `.env` with your Entra ID credentials:

```bash
# Entra ID Configuration for OAuth2/MSAL
AZURE_TENANT_ID=your-tenant-id-here
AZURE_CLIENT_ID=your-client-id-here
AZURE_CLIENT_SECRET=your-client-secret-here

# MCP Server Configuration
REMOTE_MCP_SERVER_PORT=3000
```

#### 2. Install Dependencies

```bash
npm install
```

#### 3. Run the Server

Start the server in development mode with auto-reload:

```bash
npm start
```

Or build and run in production mode:

```bash
npm run build
node dist/main.js server
```

#### 4. Verify the Server

The server should be running on `http://localhost:3000/mcp`. You should see:

```text
MCP Server running on http://localhost:3000/mcp
```

---

## Client

The MCP client demonstrates how to connect to the MCP server, acquire authentication tokens, and interact with LLMs using MCP tools.

### 1. Configure Client Environment Variables

Navigate to the `client` directory and create a `.env.development` file from the template:

```bash
cd client
cp .env.template .env.development
```

Edit `.env.development` with your configuration:

```bash
# Entra ID Configuration for OAuth2/MSAL
AZURE_TENANT_ID=your-tenant-id-here
AZURE_CLIENT_ID=your-client-id-here
AZURE_CLIENT_SCOPE=api://your-client-id-here/mcp:tools

REMOTE_MCP_SERVER_BASE_URL=http://localhost:3000/mcp
```

### 2. Install Client Dependencies

```bash
npm install
```

### 3. Ensure Prerequisites

Before running the client:

- ✅ **MCP Server is running** (see above: Server > Run the server )
- ✅ **Ollama is running** with the required model:

  ```bash
  ollama serve
  ollama pull qwen3:4b
  ```

### 4. Run the Client

Start the interactive CLI application:

```bash
npm start
```

### 5. Authenticate and Interact

1. The application will prompt you to authenticate with Entra ID (interactive browser login)
2. After successful authentication, you'll see the registered MCP tools
3. Start asking questions in the interactive prompt

**Example interaction:**

```text
🧠 Simple console application
Acquiring an access token from Entra ID... ✅ ok
Registered MCP Server tools: ['tool1', 'tool2', ...]

Starting the command line prompting game.
Have fun! 😃 Type 'exit' or 'quit' to terminate.
Ask: How many users work in my company?
AI's response:
[Streaming response from LLM using MCP tools...]
```

### Switching to Other AI Providers

The client includes examples for both Ollama and OpenAI. To use OpenAI instead:

1. Uncomment the OpenAI example in `client/src/main.ts`
2. Set your OpenAI API key: `export OPENAI_API_KEY=your-key`
3. Replace the `streamText` call with the `generateText` call

## Troubleshooting

### Server Issues

- **Port already in use**: Change `REMOTE_MCP_SERVER_PORT` in `.env` or terminate the already running server
- **Token validation fails**: Verify Entra ID app registration configuration
- **JWKS errors**: Check that your app registration has the correct signing keys

### Client Issues

- **Authentication fails**: Ensure Entra ID app has correct redirect URIs configured
- **Cannot connect to server**: Verify `REMOTE_MCP_SERVER_BASE_URL` and that server is running
- **Ollama errors**: Ensure Ollama is running (`ollama serve`) and model is pulled

### Common Issues

- **Module resolution errors**: Ensure you're using Node.js v22+ with ES modules support
- **TypeScript errors**: Run `npm run type-check` to validate TypeScript configuration
- **Network errors**: Check firewall settings and localhost connectivity

## Additional Information

### Development Scripts

Both server and client support the following npm scripts:

- `npm start`: Run in development mode
- `npm run build`: Compile TypeScript to JavaScript
- `npm run type-check`: Check TypeScript types without emitting files

### Security Considerations

- **Never commit `.env` files**: These files contain sensitive credentials
- **Token validation**: The server validates tokens using JWKS from Entra ID
- **Scope checking**: Ensure the `mcp:tools` scope is properly configured
- **Production deployment**: Use proper secret management (Azure Key Vault, environment variables, etc.)

### Learn More

- [Model Context Protocol Documentation](https://modelcontextprotocol.io/)
- [Vercel AI SDK](https://sdk.vercel.ai/docs)
- [Microsoft Entra: Call a web API in Node.JS](https://learn.microsoft.com/en-us/entra/identity-platform/quickstart-web-app-node-sign-in-call-api/)
- [Ollama Documentation](https://ollama.ai/)