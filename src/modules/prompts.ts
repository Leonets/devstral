import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { AllowedRoles } from "../utils/nftData";

export function registerPrompts(server: McpServer) {
  server.prompt(
    "echo",
    { message: z.string() },
    ({ message }) => ({
      messages: [{
        role: "user",
        content: {
          type: "text",
          text: `Please process this message: ${message}`
        }
      }]
    })
  );

  server.prompt(
    "registered-users",
    {
      ruolo: AllowedRoles
    },
    ({ ruolo }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `how many ${ruolo} are there in the platform ?`
          }
        }
      ]
    })
  );


}
