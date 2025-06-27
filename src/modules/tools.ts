import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { AllowedRoles, handleData, rolesMap } from "../utils/nftData";



const addressMap = new Map([
        ["manager",   "resource_rdx1nt5k5h9dxcmn33dyp6e2ft857qrykc7haz5axg9ma9kdwf5l3maxe9"],
        ["admin",     "resource_rdx1t4t25kxx54wtnkmagn3f2cuy2gwgkmt74lys24maus0lqyl54t5vk5"],
        ["customer",  "resource_rdx1ngv5zqx99c5dcn3n8hfzaymaq62ndn5j944e6ujn5sl2xhgps64j4w"],
        ["owner",     "resource_rdx1t55j347j7g7m7g527j9uqv6zha6dy3mydel5cxqkr695jjnr2hy370"],
        ["offer",     "resource_rdx1nt9wwmsdlxssys69p08pre4eqst2rp9z44n9tu2nhet9amuwg9tm3q"],
      ]);

export function registerTools(server: McpServer) {
 
  // [
  //   { "ruolo": "manager" }
  // ]
  server.tool(
    "registered-users",
    {
      ruolo: AllowedRoles
    },    
    async ({ ruolo }) => {
      console.log("ruolo:", ruolo);

      // Moved addressMap to class level

      const rolesKey = ruolo && ruolo in rolesMap ? rolesMap[ruolo as keyof typeof rolesMap] : null;

      console.log("matchedRole:", ruolo);
      console.log("rolesKey:", rolesKey);

      const requestedAddress = addressMap.get(rolesKey!);
      console.log("requestedAddress:", requestedAddress);

      if (rolesKey) {
        console.log("I will look for the roles component for you:");
        const result = await handleData(rolesKey, requestedAddress as string);
        console.log("result :", result);
        return {
          content: [{ type: "text", text: result }],
        };
      }

      return {
        content: [
          {
            type: "text",
            text: "Please specify a valid role (proprietario / admin / manager / customer .",
          },
        ],
      };
    }
  );

}
