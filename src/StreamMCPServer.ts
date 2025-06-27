import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { Notification, CallToolRequestSchema, ListToolsRequestSchema, LoggingMessageNotification, ToolListChangedNotification, JSONRPCNotification, JSONRPCError, InitializeRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { randomUUID } from "crypto";
import { Request, Response } from "express"

const SESSION_ID_HEADER_NAME = "mcp-session-id"
const JSON_RPC = "2.0"

export class MCPServer {
    server: Server

    // to support multiple simultaneous connections
    transports: {[sessionId: string]: StreamableHTTPServerTransport} = {}

    private toolInterval: NodeJS.Timeout | undefined
    private registeredUser = "registered-user"
    private registeredAdmin = "registered-admin"

    constructor(server: Server) {
        this.server = server
        //Here we can register capabilities, tools, etc.
        this.setupTools()
    }

    async handleGetRequest(req: Request, res: Response) {
        console.log("get request received")
        // if server does not offer an SSE stream at this endpoint.
        // res.status(405).set('Allow', 'POST').send('Method Not Allowed')

        // if instead I wanna enable SSE streaming
        console.log("get request received")
        // if server does not offer an SSE stream at this endpoint.
        // res.status(405).set('Allow', 'POST').send('Method Not Allowed')

        const sessionId = req.headers['mcp-session-id'] as string | undefined
        if (!sessionId || !this.transports[sessionId]) {
            res.status(400).json(this.createErrorResponse("Bad Request: invalid session ID or method."))
            return
        }

        console.log(`Establishing SSE stream for session ${sessionId}`)
        const transport = this.transports[sessionId]
        await transport.handleRequest(req, res)
        await executeSend(transport)
        
        return
    }

    async handlePostRequest(req: Request, res: Response) {
        const sessionId = req.headers[SESSION_ID_HEADER_NAME] as string | undefined

        console.log("post request received")
        console.log("body: ", req.body)

        let transport: StreamableHTTPServerTransport

        try {
            // reuse existing transport
            if (sessionId && this.transports[sessionId]) {
                transport = this.transports[sessionId]
                await transport.handleRequest(req, res, req.body)
                return
            }

            // create new transport
            if (!sessionId && this.isInitializeRequest(req.body)) {
                const transport = new StreamableHTTPServerTransport({
                    sessionIdGenerator: () => randomUUID(),
                    // for stateless mode:
                    // sessionIdGenerator: () => undefined
                })

                await this.server.connect(transport)
                await transport.handleRequest(req, res, req.body)

                // session ID will only be available (if in not Stateless-Mode)
                // after handling the first request
                const sessionId = transport.sessionId
                if (sessionId) {
                    this.transports[sessionId] = transport
                }

                await this.sendMessages(transport)
                return
            }

            res.status(400).json(this.createErrorResponse("Bad Request: invalid session ID or method."))
            return

        } catch (error) {

            console.error('Error handling MCP request:', error)
            res.status(500).json(this.createErrorResponse("Internal server error."))
            return
        }
    }

    // send message streaming message every second
    // cannot use server.sendLoggingMessage because we have can have multiple transports
    private async sendMessages(transport: StreamableHTTPServerTransport) {
        //Sends two example messages to the client
        executeSend(transport);   
    }

    private createErrorResponse(message: string): JSONRPCError {
        return {
            jsonrpc: '2.0',
            error: {
              code: -32000,
              message: message,
            },
            id: randomUUID(),
        }
    }

    private isInitializeRequest(body: any): boolean {
        const isInitial = (data: any) => {
            const result = InitializeRequestSchema.safeParse(data)
            return result.success
        }
        if (Array.isArray(body)) {
          return body.some(request => isInitial(request))
        }
        return isInitial(body)
    }


    private setupTools() {
        // Define available tools
        const setToolSchema = () => this.server.setRequestHandler(ListToolsRequestSchema, async () => {
            this.registeredUser = `Registered User on FCG Sales Platform`
            // tool that returns a Registered User Category counting
            const registeredUserTool = {
                name: this.registeredUser,
                description: "This tools extract how many registered users are on the FCG Sales Platform and returns its counting",
                inputSchema: {
                    type: "object",
                    properties: {
                        name: {
                            type: "string" ,
                            description: "Owner, Admin, Manager, Customer, Offer, or Offers",
                        },
                    },
                    required: ["name"]
                }
            }
            return {
                tools: [registeredUserTool]
            }
        })

        setToolSchema()


        // Define another available tools to test notification of tool change
        const setAnotherToolSchema = () => this.server.setRequestHandler(ListToolsRequestSchema, async () => {
            this.registeredAdmin = `Registered Admin on FCG Sales Platform`
            // tool that returns a Registered Admin Category counting
            const registeredAdminTool = {
                name: this.registeredAdmin,
                description: "This tools extract the amount of offers accepted on the FCG Sales Platform ",
                inputSchema: {
                    type: "object",
                    properties: {
                        name: {
                            type: "string" ,
                            description: "amount of offers accepted",
                        },
                    },
                    required: ["name"]
                }
            }
            return {
                tools: [registeredAdminTool]
            }
        })

        // set tools dynamically, changing 5 second
        this.toolInterval = setInterval(async () => {
            setAnotherToolSchema()
            // to notify client that the tool changed
            Object.values(this.transports).forEach((transport) => {
                const notification: ToolListChangedNotification = {
                    method: "notifications/tools/list_changed",
                }
                this.sendNotification(transport, notification)
            })
        }, 50000)

        // handle tool calls
        this.server.setRequestHandler(CallToolRequestSchema, async (request, extra) => {
            console.log("tool request received: ", request)
            console.log("extra: ", extra)

            const args = request.params.arguments
            const toolName = request.params.name
            const sendNotification = extra.sendNotification

            if (!args) {
                throw new Error("arguments undefined")
            }
            if (!toolName) {
                throw new Error("tool name undefined")
            }

            //TODO example business logic
            if (toolName === this.registeredUser) {
                console.log("Calling registered user tool with args: ", args)
                //TODO put here the business logic
                const { name } = args
                if (!name) {
                    throw new Error("Name to greet undefined.")
                }
                return {
                    content: [ {
                        type: "text",
                        text: `Hey ${name}! Welcome to itsuki's world!`
                    }]
                }
            } else if (toolName === this.registeredAdmin) {
                console.log("Calling registered admin tool with args: ", args)
                return {
                    content: [ {
                        type: "text",
                        text: `Tool has not be implemented yet!`
                    }]
                }
            }

            throw new Error("Tool not found")
        })
    }

    private async sendNotification(transport: StreamableHTTPServerTransport, notification: Notification) {
        const rpcNotificaiton: JSONRPCNotification = {
            ...notification,
            jsonrpc: JSON_RPC,
        }
        await transport.send(rpcNotificaiton)
    }

}

async function executeSend(transport: StreamableHTTPServerTransport) {
    try {
        await transport.send({
            jsonrpc: "2.0",
            method: "sse/connection",
            params: { message: "Stream started" }
        })
        console.log("Stream started")

        let messageCount = 0
        const interval = setInterval(async () => {

        messageCount++

        const message = `Message ${messageCount} at ${new Date().toISOString()}`

        try {
            await transport.send({
                jsonrpc: "2.0",
                method: "sse/message",
                params: { data: message }
            })

        console.log(`Sent: ${message}`)

            if (messageCount === 2) {
                clearInterval(interval)
                await transport.send({
                    jsonrpc: "2.0",
                    method: "sse/complete",
                    params: { message: "Stream completed" }
                })
                console.log("Stream completed")
            }

        } catch (error) {
        console.error("Error sending message:", error)
        clearInterval(interval)
        }

    }, 1000)

    } catch (error) {
    console.error("Error in startSending:", error)
    }
}
