import { Client } from "@modelcontextprotocol/sdk/client/index.js"
import { Transport } from "@modelcontextprotocol/sdk/shared/transport.js"
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js"
import { LoggingMessageNotificationSchema, ToolListChangedNotificationSchema, TextContentSchema } from "@modelcontextprotocol/sdk/types.js"
import { URL } from "url"

class SESClient {
    tools: {name: string, description: string}[] = []

    private client: Client
    private transport: Transport | null = null
    private isCompleted = false

    constructor(serverName: string) {
        this.client = new Client({ name: `mcp-client-for-${serverName}`, version: "1.0.0" })
    }

    async connectToServer(serverUrl: string) {
        const url = new URL(serverUrl)
        try {
            this.transport = new SSEClientTransport(url)
            await this.client.connect(this.transport)
            console.log("Connected to server")

            this.setUpTransport()

        } catch (e) {
            console.log("Failed to connect to MCP server: ", e)
            throw e
        }
    }

    
    // Tools
    async simpleListTools() {
        try {
            const toolsResult = await this.client.listTools()
            console.log('Available tools:', toolsResult.tools)
        } catch (error) {
            console.log(`Tools not supported by the server (${error})`);
        }
    }

    async listTools() {
        try {
            const toolsResult = await this.client.listTools()
            console.log('Available tools:', toolsResult.tools)
            this.tools = toolsResult.tools.map((tool) => {
                return {
                    name: tool.name,
                    description: tool.description ?? "",
                }
            })
        } catch (error) {
            console.log(`Tools not supported by the server (${error})`);
        }
    }

    async callTool(name: string) {
        try {
            console.log('\nCalling tool: ', name);

            const result  = await this.client.callTool({
                name: name,
                arguments: { role: "user", content: "How many managers are registered ?" },
            })

            const content = result.content as object[]

            console.log('results:');
            content.forEach((item) => {
                const parse = TextContentSchema.safeParse(item)
                if (parse.success) {
                    console.log(`- ${parse.data.text}`);
                }
            })
        } catch (error) {
            console.log(`Error calling greet tool: ${error}`);
        }

    }

    private setUpTransport() {
        if (this.transport === null) {
            return
        }
        this.transport.onclose = () => {
            console.log("SSE transport closed.")
            this.isCompleted = true
        }

        this.transport.onerror = async (error) => {
            console.log("SSE transport error: ", error)
            await this.cleanup()
        }

        this.transport.onmessage = (message) => {
            console.log("message received: ", message)
            console.log("message received json: ", JSON.stringify(message, null, 2))
        };
    }

    async waitForCompletion() {
        while (!this.isCompleted) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
    }

    async cleanup() {
        await this.client.close()
    }
}

async function main() {
    const client = new SESClient("sse-server")

    try {
        await client.connectToServer("http://localhost:4000/sse")

        console.log("Connected to MCP server via SSE transport");
        console.log("Listing tools...");
        await client.simpleListTools()

        console.log("Listing tools again...");
        await client.listTools()
        for (const tool of client.tools) {
            console.log(`\nCalling tool: ${tool.name} - ${tool.description}`);
            //TODO Why is this not working?
            //TODO Why I cannot call the tool ?
            await client.callTool(tool.name)
        }

        await client.waitForCompletion()
    } finally {
        await client.cleanup()
    }
}

main()


