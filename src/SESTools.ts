import { Server } from "@modelcontextprotocol/sdk/server/index.js"
import { z } from "zod";
import { handleData } from "./utils/nftData";

export function registerCapabilities(server: Server) {

  // TODO Trying to register a new tool or capability
server.registerCapabilities({
  tools: {
    "registered-users": {
      inputSchema: z.object({
        messages: z.array(
          z.object({
            role: z.string(),
            content: z.string(),
          })
        )
      }),
      handler: async ({ messages }: { messages: Array<{ role: string; content: string }> }) => {
        console.log("Incoming messages:", messages);
        // your logic here
      }
    }
  }
});
 
  // [
  //   { "role": "user", "content": "How many managers are registered ?" }
  // ]
  // server.tool(
  //   "registered-users",
  //   {
  //     messages: z.array(
  //       z.object({
  //         role: z.string(),
  //         content: z.string(),
  //       })
  //     ),
  //   },
  //   async ({ messages }) => {
  //     console.log("Incoming messages:", JSON.stringify(messages, null, 2));

  //     if (!Array.isArray(messages) || messages.length === 0) {
  //       throw new Error("Invalid request: 'messages' must be a non-empty array.");
  //     }

  //     const last = messages[messages.length - 1]?.content.toLowerCase();

  //     const rolesMap = {
  //       manager: "manager",
  //       admin: "admin",
  //       admins: "admin",
  //       customer: "customer",
  //       owner: "owner",
  //       offer: "offer",
  //       offers: "offer",
  //     };

  //     const addressMap = new Map([
  //       ["manager",   "resource_rdx1nt5k5h9dxcmn33dyp6e2ft857qrykc7haz5axg9ma9kdwf5l3maxe9"],
  //       ["admin",     "resource_rdx1t4t25kxx54wtnkmagn3f2cuy2gwgkmt74lys24maus0lqyl54t5vk5"],
  //       ["customer",  "resource_rdx1ngv5zqx99c5dcn3n8hfzaymaq62ndn5j944e6ujn5sl2xhgps64j4w"],
  //       ["owner",     "resource_rdx1t55j347j7g7m7g527j9uqv6zha6dy3mydel5cxqkr695jjnr2hy370"],
  //       ["offer",     "resource_rdx1nt9wwmsdlxssys69p08pre4eqst2rp9z44n9tu2nhet9amuwg9tm3q"],
  //     ]);    

  //     const matchedRole = Object.keys(rolesMap).find(t => last.includes(t));
  //     const rolesKey = matchedRole && matchedRole in rolesMap ? rolesMap[matchedRole as keyof typeof rolesMap] : null;

  //     console.log("matchedRole:", matchedRole);
  //     console.log("rolesKey:", rolesKey);

  //     const requestedAddress = addressMap.get(rolesKey!);
  //     console.log("requestedAddress:", requestedAddress);

  //     if (rolesKey) {
  //       console.log("I will look for the roles component for you:");
  //       const result = await handleData(rolesKey, requestedAddress as string);
  //       console.log("result :", result);
  //       return {
  //         content: [{ type: "text", text: result }],
  //       };
  //     }

  //     return {
  //       content: [
  //         {
  //           type: "text",
  //           text: "Please specify a valid role (proprietario / admin / manager / customer .",
  //         },
  //       ],
  //     };
  //   }
  // );

}
