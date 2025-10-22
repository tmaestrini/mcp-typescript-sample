import * as readline from 'node:readline/promises';
import { experimental_MCPClient as MCPClient, ModelMessage, stepCountIs, streamText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { createOllama } from 'ollama-ai-provider-v2';
import TokenAcquisitionHelper from './utils/TokenAcquisitionHelper';
import MCPClientFactory from './mcp/client';

const terminal = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

const messages: ModelMessage[] = [];
let client: MCPClient;

async function main() {

    process.stdout.write(`🧠 Simple console application\n`);
    
    try {
        process.stdout.write(`Acquiring an access token from Entra ID... `);
        
        // Acquire token with interactive authentication for demonstration purposes; 
        // in production consider using the token from your app's authentication context
        // (e.g., access token from an authenticated user session)
        const userToken = await (new TokenAcquisitionHelper().acquireTokenInteractively());
        process.stdout.write(`✅ ok\n`);
        
        // Create a MCP client to handle communication with the remote MCP server
        client = await MCPClientFactory(userToken);

        // List tools registered with the MCP server
        const toolset = await client.tools();
        const tools = {
            ...toolset, // note: this approach causes subsequent tool sets to override tools with the same name
        };
        console.log('Registered MCP Server tools:', Object.keys(tools));

        // Start handling user inputs and LLM interactions
        // 👉 For demo of MCP Server tools ask: "How many users work in my company?"
        await agentTasksLoop(tools);
    }
    catch (error) {
        console.error('Error in main application loop:', error);
    } finally {
        try {
            await Promise.all([
                client.close(),
                process.exit(0)
            ]);
        } catch (e) {
            // swallow close errors
        }
    }
}

async function agentTasksLoop(tools: Awaited<ReturnType<MCPClient['tools']>>) {

    process.stdout.write(`\nStarting the command line prompting game.\n`);
    process.stdout.write(`Have fun! 😃 Type 'exit' or 'quit' to terminate.\n`);

    try {
        let isRunning = true;
        while (isRunning) {
            const userInput = await terminal.question('Ask: ');
            messages.push({ role: 'user', content: userInput });

            if (userInput.toLowerCase() === 'exit' || userInput.toLowerCase() === 'quit') {
                isRunning = false;
                console.log('Exiting application. Bye! 👋');
                continue;
            }

            // LLM bindings examples
            // OLLAMA EXAMPLE
            const ollama = createOllama({
                baseURL: 'http://localhost:11434/api',
            });
            const ollamaModel = ollama('qwen3:4b');

            // Streaming example with OLLAMA
            const { textStream } = streamText({
                model: ollamaModel,
                providerOptions: { ollamaModel: { think: false } },
                tools,
                stopWhen: stepCountIs(3),
                messages
                // messages: [
                //     {
                //         role: 'user',
                //         content: [{ type: 'text', text: 'How many users do you find in the tenant?' }],
                //     },
                // ],
            });

            // OPENAI EXAMPLE
            // const response = await generateText({
            //     model: openai('gpt-4o'),
            //     tools,
            //     stopWhen: stepCountIs(5),
            //     messages: [
            //         {
            //             role: 'user',
            //             content: [{ type: 'text', text: 'Simply repeat this text.' }],
            //         },
            //     ],
            // });
            // console.log(response.text);

            process.stdout.write(`AI's response:\n`);
            const fullResponseChunks: string[] = [];
            for await (const chunk of textStream) {
                process.stdout.write(chunk);
                fullResponseChunks.push(chunk);
            };

            process.stdout.write('\n');
            messages.push({ role: 'assistant', content: fullResponseChunks.join() }); // Append assistant message as needed

            // CLOSING NOTE: 
            // Choose between generateText and streamText based on your application's needs:
            // generateText: When you need the complete response for processing, logging, or when the user doesn't need to see incremental progress
            // streamText: When building interactive UIs where you want to show text appearing in real-time, improving perceived performance and user experience
        }
    } catch (error) {
        console.error(error);
        throw error;
    }
}

main().catch((error) => {
    console.error('Unhandled error in main:', error);
});